import os
import json
from flask import Flask, render_template, request, jsonify, abort

app = Flask(__name__)
app.secret_key = 'biotinker_secret_key_for_session_security'

# Ruta al archivo de base de datos simulada
DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'productos.json')

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

if __name__ == '__main__':
    # Ejecuta el servidor de desarrollo local de Flask
    app.run(debug=True, port=5000)
