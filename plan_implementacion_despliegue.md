# Plan de Despliegue y URL Pública para BioTinker

Este plan propone alternativas para publicar la aplicación **BioTinker** de forma gratuita y pública, ordenadas por simplicidad. 

Debido a que GitHub Pages solo hospeda contenido estático (HTML, CSS, JS), se detalla la migración de la lógica de Python al navegador en JavaScript para permitir su publicación en GitHub Pages, manteniendo el código original en Python intacto como documentación y ejecución local.

---

## Opciones de Publicación Gratuitas (Ordenadas por Simplicidad)

### Opción 1: GitHub Pages (Migración a Frontend Estático) - **RECOMENDADA**
*   **Cómo funciona:** Se replican los archivos HTML en la raíz del proyecto para que corran de forma 100% estática en el navegador. La búsqueda, ordenamiento, filtrado, guardado del carrito y reducción de stock se ejecutan localmente en JavaScript. El servidor de Flask (`app.py`) queda guardado en la carpeta del proyecto como documentación académica.
*   **Pros:** 
    *   Despliegue automático y gratuito en 1 clic desde la configuración del repositorio de GitHub.
    *   Carga instantánea sin tiempos de espera ("cold starts").
    *   Es sumamente estable y no requiere mantenimiento de servidores.
*   **Cons:** El stock rebajado solo se mantiene en la sesión del navegador actual (pero esto ya ocurría con la caché del servidor Flask al reiniciarse).

### Opción 2: Render.com (Hospedaje del Servidor Flask en la Nube)
*   **Cómo funciona:** Se conecta el repositorio de GitHub a Render, creando un "Web Service" de Python. Render compila y ejecuta el servidor `app.py`.
*   **Pros:** Corre el código Python original.
*   **Cons:** 
    *   La versión gratuita se "duerme" tras 15 minutos de inactividad. La primera visita puede demorar hasta 50 segundos en cargar ("cold start").
    *   Configuración más compleja (requiere archivo `requirements.txt` y configurar comandos de ejecución).

### Opción 3: PythonAnywhere (Hospedaje Flask Tradicional)
*   **Cómo funciona:** Se crea una cuenta gratuita en PythonAnywhere, se clonan los archivos en su consola y se configura un archivo WSGI apuntando a `app.py`.
*   **Pros:** Servidor Python permanente sin tiempo de arranque ("cold start").
*   **Cons:** 
    *   Proceso manual (no se despliega automáticamente al subir a GitHub).
    *   Las cuentas gratuitas caducan cada 3 meses a menos que se inicie sesión y se renueven manualmente haciendo un clic.

---

## Propuesta de Cambios para la Opción 1 (GitHub Pages)

Para habilitar **GitHub Pages** sin romper la versión actual de **Flask**, crearemos una versión estática en la raíz del proyecto. El usuario podrá seguir ejecutando `python app.py` localmente, y al mismo tiempo subir el proyecto a GitHub y activar Pages para tener la web pública funcionando.

### Estructura del Proyecto Dual:

```text
algoritmos-ecommerce/
│
├── index.html                   <-- Catálogo estático para GitHub Pages
├── detalle.html                 <-- Vista de detalle estática para GitHub Pages
├── prompts.html                 <-- Slideshow estático para GitHub Pages
│
├── productos.json               <-- Compartido por ambos
├── Prompts.md                   <-- Compartido por ambos
├── propuesta.md                 <-- Compartido por ambos
├── plan_implementacion.md       <-- Compartido por ambos
│
├── app.py                       <-- Código Python para ejecución local y documentación
├── templates/                   <-- Carpetas de Flask intactas
│   ├── base.html
│   ├── index.html
│   └── detalle.html
│
└── static/                      <-- CSS y JS compartidos
    ├── css/styles.css
    └── js/
        ├── cart.js
        └── static_app.js        <-- Lógica de búsqueda/filtrado y markdown en JS
```

---

## Cambios Específicos

### 1. Archivos HTML Estáticos en la Raíz
Crearemos tres archivos HTML en la raíz (`index.html`, `detalle.html`, `prompts.html`). Estos archivos usarán la misma estructura semántica y clases CSS de las plantillas de Flask, pero en lugar de Jinja2 (`{% %}`), utilizarán JavaScript en el cliente (`static/js/static_app.js`) para:
*   Descargar `productos.json` usando `fetch()`.
*   Leer parámetros de búsqueda de la URL (ej: `detalle.html?sku=BIO-9003-98-9-GFP`).
*   Renderizar dinámicamente las tarjetas, tablas y contenidos.
*   Hacer fetch de los archivos `.md` y parsear el Markdown directamente en el navegador a través de una función JavaScript equivalente a la de Python.

### 2. Archivo JavaScript Coordinador (`static/js/static_app.js`)
*   Implementará la función `markdownToHtml(mdText)` en JS para renderizar la documentación y las tablas.
*   Cargará la base de datos de productos en una variable global en el cliente.
*   Manejará el filtrado por categorías, búsqueda por términos y ordenación de arreglos en JavaScript (`products.sort(...)`).

---

## Plan de Verificación

1.  **Localmente (Flask):** Correr `python app.py` y corroborar que todo siga funcionando en `http://127.0.0.1:5000`.
2.  **Localmente (Estático):** Abrir el archivo `index.html` de la raíz directamente en el navegador (usando la ruta de archivo local o Live Server) y verificar que las búsquedas, carrito, compras y slideshow se ejecuten sin errores de consola.
3.  **Hospedaje:** Subir a GitHub, activar GitHub Pages en la sección *Settings > Pages* seleccionando la rama principal (`main`) y la carpeta raíz (`/root`), y abrir la URL pública brindada por GitHub.
