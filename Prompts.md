# Herramienta usada
Se utilizó el Editor de Código Antigravity, que es un fork de visual studio code desarrollado por Google.
En este editor de código se puede alternar entre diferentes modelos de IA, sin embargo, utilicé el modelo Gemini 3.5 Flash (High) para la generación del código y análisis de errores.

# Pre creacion
Tengo que hacer una actividad formativa para la facultad, especificamente para la materia Algoritmos y Estructura de Datos, necesito propuestas de como implementar un e-commerce web usando el lenguaje Python y un framework, se me ocurre usar el framework Flask ya que no es tan robusto y no depende tanto de conceptos tan avanzados para la materia.
Mi idea es crear un e-commerce "BioTinker" donde se vendan productos de Biotecnología, cultivos microbiológicos y enzimas para ingenieria genética.
Primero necesito que me ayudes a pensar en todos los requerimientos que debe tener este e-commerce sencillo utilizando como parametros la consigna y los objetivos propuestos por la cátedra
---
Objetivo
Aplicar los conceptos trabajados en la Unidad 2, especialmente:

Definición y uso de estructuras tipo registro.
Identificación y diseño de una clave para organizar y diferenciar datos.
Comprensión de cómo modelar información para resolver problemas reales.

Consigna
De manera individual, deberán crear el diseño inicial de una App de e-Commerce utilizando la Inteligencia Artificial que elijan (por ejemplo: ChatGPT, Gemini, Claude, Copilot, entre otras).

La app deberá incluir el diseño de al menos un registro principal relacionado con los productos o servicios ofrecidos, indicando claramente:

Nombre de cada campo del registro.
Tipo de dato esperado.
Identificación de la clave del registro y justificación de su elección.
Además, deberán documentar el proceso de interacción con la IA.

Uso obligatorio de IA
Deberán utilizar una herramienta de IA para generar ideas, diseñar la aplicación y definir el registro.

Es obligatorio presentar los prompts utilizados durante el proceso.

El prompt debe incluir explícitamente el pedido del diseño del registro y la definición de una clave.

Pueden realizar mejoras o nuevos prompts y deberán incluirlos todos.
---

Crea un documento llamado propuesta.md, corto, el e-commerce no debe tener demasiadas funcionalidades ya que debe realizarse en una semana.

[propuesta.md](./propuesta.md)

# Numero 1
(En primer lugar se analiza el archivo propuesta.md y la respuesta del Agente)
Revisando la propuesta tengo varias dudas respecto a la implementación, en primer lugar mi registro debería ser una combinación del registro json que tengo yo:
{
    "BIO-9003-98-9-GFP": {
        "id_cepa_cas": "BIO-9003-98-9-GFP",
        "nombre_cientifico": "Aequorea victoria Fluorescent Protein Strain",
        "nivel_bioseguridad": 1,
        "temp_almacenamiento": -20.0,
        "requiere_licencia": false,
        "precio_por_microlitro": 14.25,
        "volumen_stock": 1000.0
    },
    "BIO-1100-22-4-BACS": {
        "id_cepa_cas": "BIO-1100-22-4-BACS",
        "nombre_cientifico": "Bacillus subtilis (Cepa Bioluminiscente Educativa)",
        "nivel_bioseguridad": 1,
        "temp_almacenamiento": 4.0,
        "requiere_licencia": false,
        "precio_por_microlitro": 8.50,
        "volumen_stock": 2500.0
    }
}

Agregando las columnas "Descripcion", "precio_mayorista" (despues de precio por microlitro), "Categoria". Ademas cambiar mi id_cepa_cas por la clave elegida "id_cepa_sku"

Crea el diseño inicial del e-commerce con 10 productos utilizando el formato de JSON brindado. El framework a utilizar es FLASK, propone una arquitectura sencilla, basandote principalmente en funciones. 

Ayudame a definir los requerimientos básicos y como estructurar el procedimiento de añadir productos al carrito. No utilizaremos bases de datos por lo que el carrito se guardará en memoria caché, lo que significa que al recargar la página se perderán los productos agregados.

## Respuesta (plan de implementación brindado por la IA)

El plan de implementación completo con el diseño de la arquitectura, definición de la clave de registro, campos y flujo del carrito en memoria caché ha sido detallado e incorporado en el proyecto en el archivo [plan_implementacion.md](./plan_implementacion.md).



# Numero 2

(Luego de ejecutarse el plan de implementacion brindado por la IA)
En el navbar donde dice "Materia: Algoritmos y Estructuras de Datos" lleva a una nueva pestaña donde tenga un slideshow donde estén los prompts escritos en este archivo. Crea todas las plantillas html necesarias para que esto sea posible manteniendo la estética futurista.
Asi como dropdowns para el plan de implementacion y la propuesta.

## Respuesta

Se ha implementado de forma dinámica la vista del slideshow futurista y los desplegables de documentación.

### Detalles de la Implementación:
- **Enlace en Navbar**: Modificado en [base.html](./templates/base.html) para dirigir al usuario a la ruta `/prompts` abriéndose en una pestaña nueva (`target="_blank"`).
- **Slideshow de Prompts**: Se creó la plantilla [prompts.html](./templates/prompts.html) que renderiza de manera futurista y con transiciones los prompts leídos y fragmentados algorítmicamente desde el archivo de texto [Prompts.md](./Prompts.md) en el servidor.
- **Desplegables de Documentación**: Incorporados en la misma página de prompts utilizando elementos nativos `<details>` de HTML5 estilizados como consolas táctiles de laboratorio. Estos cargan dinámicamente el contenido parseado de:
  - [propuesta.md](./propuesta.md)
  - [plan_implementacion.md](./plan_implementacion.md)
- **Lógica en Backend**: Se implementó en [app.py](./app.py) un miniparser de Markdown a HTML basado en expresiones regulares para que el proyecto no dependa de librerías externas complejas, alineándose con los objetivos de la materia.


# Numero 3

Necesito una URL Pública para este proyecto, por lo cual pensé en publicarlo en github pages pero ahi solo se puede ver el frontend, necesito poder acceder a FLASK, brindame diferentes opciones ordenando por la simplicidad para poder acceder de manera pública al proyecto, tambien estas opciones deben ser gratuitas.
En caso de que la opcion mas sencilla sea pasar el código de python a todo el frontend en javascript y seguir manteniendo las mismas funcionalidades, acepto, pero mantené el código en python como documentación ya que es el lenguaje que mas manejo.

## Respuesta

El plan detallado para habilitar una URL pública y gratuita se encuentra documentado en [plan_implementacion_despliegue.md](./plan_implementacion_despliegue.md).

Para lograr esto de la manera más sencilla e instantánea (sin caídas por inactividad o cold starts), se migró la lógica de Python a un frontend estático interactivo en JavaScript, el cual es 100% compatible con **GitHub Pages**.

La estructura del código de Flask original en Python se mantiene completamente intacta como documentación en la carpeta del proyecto para fines de estudio y para correrlo localmente.


# Numero 4

Necesito que modifiques el archivo readme.md donde en primer lugar expliques como desplegar y acceder al proyecto desde una url publica en github pages, como esta estructurada la arquitectura del proyecto y que función cumplen cada uno de los archivos del proyecto, incluyendo el deprecado apps.py y app_v2. 

## Respuesta

El archivo [README.md](./README.md) ha sido modificado y reescrito por completo para cumplir con la documentación requerida para el repositorio de GitHub:

1. **Instrucciones de Despliegue**: Se detalló paso a paso cómo activar **GitHub Pages** desde la sección de Configuración (*Settings*) del repositorio, seleccionando la rama `main` y la carpeta raíz (`/root`).
2. **Arquitectura del Proyecto**: Se explicó el diseño del **Soporte Híbrido/Dual** (Flask para ejecución local y Frontend Estático interactivo con sessionStorage para la URL pública en producción), incluyendo un diagrama de flujo de arquitectura.
3. **Estructura del Proyecto e Inventario de Archivos**: Se creó un listado categorizado describiendo la función que cumple cada archivo en la raíz, en `templates/` y en `static/`.
4. **Historial y Archivos Deprecados**: Se documentaron los archivos deprecados (`apps.py`, `app_v2.py` y `propuesta_registro.json`), aclarando sus propósitos en fases previas y el porqué de sus reemplazos o integraciones en la versión definitiva de producción (`app.py`, `productos.json` y `static_app.js`).
