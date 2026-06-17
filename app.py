import os
import json
import re
from flask import Flask, render_template, request, jsonify, abort

app = Flask(__name__)
app.secret_key = 'biotinker_secret_key_for_session_security'

# Ruta al archivo de base de datos simulada
DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'productos.json')

# --- PARSER DE MARKDOWN Y LÓGICA DE PROMPTS PARA SLIDESHOW ---

def markdown_a_html(md_text):
    """
    Convierte un subconjunto básico de Markdown a HTML utilizando expresiones regulares y lógica por líneas.
    Ideal para un enfoque de algoritmos y estructuras de datos sin librerías externas.
    Soporta formato básico, listas, código y tablas de Markdown.
    """
    if not md_text:
        return ""
        
    html = md_text
    
    # Reemplazar bloques de código ``` ... ``` con <pre><code>...</code></pre>
    html = re.sub(r'```(?:python|javascript|json|html|css|mermaid)?\s*(.*?)\s*```', r'<pre><code>\1</code></pre>', html, flags=re.DOTALL)
    
    # Reemplazar código en línea `code`
    html = re.sub(r'`([^`\n]+)`', r'<code>\1</code>', html)
    
    # Reemplazar negrita **text**
    html = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', html)
    
    # Reemplazar cursiva *text*
    html = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', html)
    
    # Reemplazar encabezados: ###, ##, #
    html = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    
    # Reemplazar citas comunes > texto
    html = re.sub(r'^>\s*(.*?)$', r'<blockquote>\1</blockquote>', html, flags=re.MULTILINE)
    
    # Convertir listas con guión o asterisco a <li>
    html = re.sub(r'^\s*[\-\*]\s*(.*?)$', r'<li>\1</li>', html, flags=re.MULTILINE)
    
    # Procesar líneas y tablas de forma algorítmica
    lineas = html.split('\n')
    lineas_procesadas = []
    dentro_de_codigo = False
    en_tabla = False
    cabecera_tabla = True
    
    for linea in lineas:
        linea_stripped = linea.strip()
        
        # Manejo de bloques de código preformateados
        if '<pre>' in linea:
            dentro_de_codigo = True
        if '</pre>' in linea:
            dentro_de_codigo = False
            lineas_procesadas.append(linea)
            continue
            
        if dentro_de_codigo:
            lineas_procesadas.append(linea)
            continue
            
        # --- PARSER DE TABLAS MARKDOWN ---
        if linea_stripped.startswith('|') and linea_stripped.endswith('|'):
            # Si es la línea de separación/alineación (ej: | :--- | :--- |), la ignoramos
            if re.match(r'^\|[\s\-\:\s|]+$', linea_stripped):
                continue
                
            # Extraemos las celdas (ignorando la primera y última celda vacía por los '|' extremos)
            celdas = [celda.strip() for celda in linea_stripped.split('|')[1:-1]]
            
            if not en_tabla:
                # Iniciar una nueva tabla
                en_tabla = True
                cabecera_tabla = True
                lineas_procesadas.append('<table><thead>')
                
            if cabecera_tabla:
                # Fila de cabecera
                th_elements = ''.join([f'<th>{celda}</th>' for celda in celdas])
                lineas_procesadas.append(f'<tr>{th_elements}</tr>')
                lineas_procesadas.append('</thead><tbody>')
                cabecera_tabla = False
            else:
                # Fila de datos
                td_elements = ''.join([f'<td>{celda}</td>' for celda in celdas])
                lineas_procesadas.append(f'<tr>{td_elements}</tr>')
            
            continue
        else:
            # Si estábamos en una tabla y la línea actual ya no es parte de la tabla, la cerramos
            if en_tabla:
                en_tabla = False
                lineas_procesadas.append('</tbody></table>')
                
        # --- PROCESAMIENTO DE LÍNEAS REGULARES ---
        if not linea_stripped:
            lineas_procesadas.append('<div class="spacer"></div>')
        elif (linea_stripped.startswith('<h') or 
              linea_stripped.startswith('<li') or 
              linea_stripped.startswith('<blockquote') or 
              linea_stripped.startswith('<div') or
              linea_stripped.startswith('<pre') or
              linea_stripped.startswith('</pre')):
            lineas_procesadas.append(linea)
        else:
            lineas_procesadas.append(f'<p>{linea}</p>')
            
    # Si al terminar el archivo seguimos en una tabla, la cerramos
    if en_tabla:
        lineas_procesadas.append('</tbody></table>')
        
    html = '\n'.join(lineas_procesadas)
    return html

def obtener_seccion_prompts(contenido, cabecera_inicio, cabecera_fin=None):
    """
    Busca de forma algorítmica una subsección de texto delimitada por cabeceras.
    """
    idx_inicio = contenido.find(cabecera_inicio)
    if idx_inicio == -1:
        return ""
    
    # Avanzamos hasta después de la cabecera e inclusive la nueva línea
    idx_inicio_contenido = contenido.find('\n', idx_inicio)
    if idx_inicio_contenido == -1:
        idx_inicio_contenido = idx_inicio + len(cabecera_inicio)
    else:
        idx_inicio_contenido += 1
        
    if cabecera_fin:
        idx_fin = contenido.find(cabecera_fin, idx_inicio_contenido)
        if idx_fin != -1:
            return contenido[idx_inicio_contenido:idx_fin].strip()
    return contenido[idx_inicio_contenido:].strip()

def cargar_secciones_prompts():
    """
    Lee Prompts.md y lo separa en los bloques correspondientes
    a las fases de interacción con la IA.
    """
    prompts_path = os.path.join(os.path.dirname(__file__), 'Prompts.md')
    try:
        with open(prompts_path, 'r', encoding='utf-8') as f:
            contenido = f.read()
    except FileNotFoundError:
        return []
        
    # Extraer las secciones por cabeceras
    seccion_pre = obtener_seccion_prompts(contenido, "# Pre creacion", "# Numero 1")
    seccion_num1 = obtener_seccion_prompts(contenido, "# Numero 1", "# Numero 2")
    seccion_num2 = obtener_seccion_prompts(contenido, "# Numero 2", "# Numero 3")
    seccion_num3 = obtener_seccion_prompts(contenido, "# Numero 3", "# Numero 4")
    seccion_num4 = obtener_seccion_prompts(contenido, "# Numero 4", "# Numero 5")
    seccion_num5 = obtener_seccion_prompts(contenido, "# Numero 5")
    
    # Procesar markdown a HTML
    slides = [
        {
            'titulo': 'Fase Inicial (Pre-creación)',
            'subtitulo': 'Definición de requerimientos básicos de BioTinker',
            'html': markdown_a_html(seccion_pre)
        },
        {
            'titulo': 'Fase 1 (Prompt 1)',
            'subtitulo': 'Diseño del registro Producto y formato JSON inicial',
            'html': markdown_a_html(seccion_num1)
        },
        {
            'titulo': 'Fase 2 (Prompt 2)',
            'subtitulo': 'Construcción del Slideshow de Prompts y desplegables',
            'html': markdown_a_html(seccion_num2)
        },
        {
            'titulo': 'Fase 3 (Prompt 3)',
            'subtitulo': 'Alternativas de despliegue gratuito para URL pública',
            'html': markdown_a_html(seccion_num3)
        },
        {
            'titulo': 'Fase 4 (Prompt 4)',
            'subtitulo': 'Estructuración de documentación y README del proyecto',
            'html': markdown_a_html(seccion_num4)
        },
        {
            'titulo': 'Fase 5 (Prompt 5)',
            'subtitulo': 'Solución a errores de compilación de GitHub Pages',
            'html': markdown_a_html(seccion_num5)
        }
    ]
    return slides


def cargar_archivo_markdown(nombre_archivo):
    """
    Carga un archivo markdown y lo parsea a HTML.
    """
    filepath = os.path.join(os.path.dirname(__file__), nombre_archivo)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            return markdown_a_html(content)
    except FileNotFoundError:
        return f"<p>Error: El archivo {nombre_archivo} no se encuentra en el proyecto.</p>"

# Carga inicial de datos en memoria (Base de datos en caché del servidor)
def cargar_productos_desde_archivo():
    try:
        with open(DATABASE_PATH, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        # En caso de no encontrar el archivo, se retorna un diccionario vacío
        return {}

# Variable global que actúa como nuestra base de datos en memoria (caché del servidor)
PRODUCTOS_DB = cargar_productos_desde_archivo()

# --- FUNCIONES DE LÓGICA DE NEGOCIO Y ALGORITMOS ---

def obtener_todas_las_categorias():
    """
    Recorre el diccionario en memoria y recopila las categorías únicas.
    Complejidad: O(N) donde N es el número de productos.
    """
    categorias = set()
    for prod in PRODUCTOS_DB.values():
        categorias.add(prod.get('Categoria', 'General'))
    return sorted(list(categorias))

def buscar_productos(productos_lista, query):
    """
    Filtra la lista de productos por búsqueda case-insensitive.
    Busca coincidencias en SKU, Nombre Científico o Descripción.
    Complejidad: O(N)
    """
    if not query:
        return productos_lista
    
    query = query.lower().strip()
    resultados = []
    for p in productos_lista:
        if (query in p['id_cepa_sku'].lower() or 
            query in p['nombre_cientifico'].lower() or 
            query in p.get('Descripcion', '').lower()):
            resultados.append(p)
    return resultados

def filtrar_por_categoria(productos_lista, categoria):
    """
    Filtra los productos por la categoría especificada.
    Complejidad: O(N)
    """
    if not categoria or categoria == 'Todas':
        return productos_lista
    return [p for p in productos_lista if p.get('Categoria') == categoria]

def ordenar_productos(productos_lista, criterio):
    """
    Ordena la lista de productos según el criterio seleccionado.
    Criterios soportados:
    - 'precio_asc': Precio por microlitro menor a mayor.
    - 'precio_desc': Precio por microlitro mayor a menor.
    - 'stock_asc': Volumen de stock menor a mayor.
    - 'stock_desc': Volumen de stock mayor a menor.
    - 'nombre': Alfabéticamente por Nombre Científico.
    """
    if criterio == 'precio_asc':
        return sorted(productos_lista, key=lambda x: x['precio_por_microlitro'])
    elif criterio == 'precio_desc':
        return sorted(productos_lista, key=lambda x: x['precio_por_microlitro'], reverse=True)
    elif criterio == 'stock_asc':
        return sorted(productos_lista, key=lambda x: x['volumen_stock'])
    elif criterio == 'stock_desc':
        return sorted(productos_lista, key=lambda x: x['volumen_stock'], reverse=True)
    elif criterio == 'nombre':
        return sorted(productos_lista, key=lambda x: x['nombre_cientifico'])
    return productos_lista

# --- RUTAS DE LA APLICACIÓN FLASK ---

@app.route('/')
def index():
    """
    Página principal: Muestra el catálogo de productos con opciones
    de búsqueda, filtrado y ordenamiento.
    """
    # Convertimos el diccionario global a una lista de registros para trabajar algoritmos lineales
    productos_lista = list(PRODUCTOS_DB.values())
    
    # Obtener parámetros de la query URL
    query_busqueda = request.args.get('q', '')
    categoria_filtrada = request.args.get('categoria', 'Todas')
    criterio_orden = request.args.get('orden', 'nombre')
    
    # Aplicar algoritmos de búsqueda, filtrado y ordenación
    productos_procesados = buscar_productos(productos_lista, query_busqueda)
    productos_procesados = filtrar_por_categoria(productos_procesados, categoria_filtrada)
    productos_procesados = ordenar_productos(productos_procesados, criterio_orden)
    
    # Obtener categorías únicas para llenar el selector del filtro
    categorias = obtener_todas_las_categorias()
    
    return render_template(
        'index.html',
        productos=productos_procesados,
        categorias=categorias,
        query=query_busqueda,
        categoria_actual=categoria_filtrada,
        orden_actual=criterio_orden
    )

@app.route('/producto/<id_cepa_sku>')
def detalle_producto(id_cepa_sku):
    """
    Vista detallada: Recupera un producto específico por su clave SKU.
    Demuestra la búsqueda directa O(1) en un diccionario usando la clave primaria.
    """
    # Búsqueda por clave primaria (SKU) en tiempo constante O(1)
    producto = PRODUCTOS_DB.get(id_cepa_sku)
    if not producto:
        abort(404, description="Producto no encontrado")
        
    return render_template('detalle.html', producto=producto)

@app.route('/api/comprar', methods=['POST'])
def api_comprar():
    """
    Simulación de Compra:
    Valida el stock de los productos solicitados y los descuenta del inventario en memoria.
    No persiste cambios a productos.json para permitir reiniciar fácilmente.
    """
    data = request.get_json()
    if not data or 'items' not in data:
        return jsonify({'success': False, 'error': 'Datos de compra inválidos o vacíos.'}), 400
        
    items_compra = data['items']  # Lista de dicts: [{'id_cepa_sku': '...', 'cantidad': ...}]
    
    # 1. Primera pasada: Validar la existencia de productos y suficiencia de stock
    for item in items_compra:
        sku = item.get('id_cepa_sku')
        cantidad = item.get('cantidad', 0)
        
        # Validación de campos
        if not sku or cantidad <= 0:
            return jsonify({'success': False, 'error': 'Estructura de ítem no válida.'}), 400
            
        # Búsqueda en O(1) por clave primaria
        producto = PRODUCTOS_DB.get(sku)
        if not producto:
            return jsonify({'success': False, 'error': f'El producto con SKU {sku} no existe.'}), 404
            
        # Comprobar stock suficiente
        if producto['volumen_stock'] < cantidad:
            return jsonify({
                'success': False, 
                'error': f'Stock insuficiente para {producto["nombre_cientifico"]}. Disponible: {producto["volumen_stock"]} μL.'
            }), 400
            
    # 2. Segunda pasada: Proceder a restar el stock si todos están ok
    detalles_descuento = []
    for item in items_compra:
        sku = item.get('id_cepa_sku')
        cantidad = item.get('cantidad')
        
        PRODUCTOS_DB[sku]['volumen_stock'] -= cantidad
        detalles_descuento.append({
            'id_cepa_sku': sku,
            'nuevo_stock': PRODUCTOS_DB[sku]['volumen_stock']
        })
        
    return jsonify({
        'success': True,
        'message': '¡Compra procesada con éxito! Su pedido científico está en camino.',
        'actualizaciones': detalles_descuento
    })

@app.route('/prompts')
def mostrar_prompts():
    """
    Ruta que muestra el slideshow de prompts dinámicamente parseados desde Prompts.md
    y paneles desplegables de propuesta.md, plan_implementacion.md y plan_implementacion_despliegue.md.
    """
    slides = cargar_secciones_prompts()
    propuesta_html = cargar_archivo_markdown('propuesta.md')
    plan_html = cargar_archivo_markdown('plan_implementacion.md')
    plan_despliegue_html = cargar_archivo_markdown('plan_implementacion_despliegue.md')
    
    return render_template(
        'prompts.html',
        slides=slides,
        propuesta_html=propuesta_html,
        plan_html=plan_html,
        plan_despliegue_html=plan_despliegue_html
    )

if __name__ == '__main__':
    # Ejecuta el servidor de desarrollo local de Flask
    app.run(debug=True, port=5000)
