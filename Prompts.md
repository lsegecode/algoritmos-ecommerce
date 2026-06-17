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



