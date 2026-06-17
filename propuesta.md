# Propuesta de Diseño: BioTinker E-Commerce

Propuesta de diseño inicial para la aplicación de e-commerce de biotecnología **BioTinker**, adaptada para la materia *Algoritmos y Estructuras de Datos*.

---

## 1. Objetivos del Proyecto

El objetivo de **BioTinker** es servir como plataforma educativa y funcional de e-commerce especializada en insumos biotecnológicos (cultivos microbiológicos, enzimas de restricción y reactivos para ingeniería genética). 

De acuerdo con las pautas de la materia, el sistema se enfocará en:
*   **Modelado de datos** mediante estructuras de tipo registro (objetos en Python).
*   **Uso de claves primarias** para la organización, búsqueda y manipulación de datos en memoria.
*   **Operaciones fundamentales** de algoritmos sobre colecciones (búsquedas por clave, ordenamientos y filtrados).

---

## 2. Requerimientos de la Aplicación (Alcance: 1 Semana)

Para asegurar la viabilidad del proyecto en el plazo de una semana utilizando **Flask** en Python y almacenamiento en memoria (o archivo plano JSON/CSV), se definen los siguientes requerimientos mínimos:

### Requerimientos Funcionales
1.  **Catálogo de Productos**: Vista principal que muestra el listado de productos disponibles. Debe permitir ordenar los productos por precio o stock.
2.  **Detalle del Producto**: Vista detallada de un producto seleccionado mediante su clave única.
3.  **Buscador**: Campo de búsqueda rápida que permita buscar un producto específico ingresando su código único (clave) o por coincidencia en el nombre.
4.  **Carrito de Compras**: Agregar productos al carrito (guardado en la sesión de Flask) y calcular el precio total acumulado.
5.  **Simulación de Compra**: Confirmación del pedido que descuente las cantidades del stock disponible en memoria.

### Requerimientos Técnicos
*   **Framework**: Flask (Python) para el ruteo de URLs y presentación de templates HTML básicos.
*   **Estructura de Datos**: El catálogo se gestionará como un diccionario de registros en memoria (`dict`), donde la clave será el código del producto y el valor será el registro con la información técnica.
*   **Persistencia**: Inicialización desde un archivo JSON para simular una base de datos sin incurrir en la complejidad de configurar sistemas de bases de datos relacionales (como SQLite o PostgreSQL).

---

## 3. Diseño del Registro Principal: `Producto`

Para representar los productos de biotecnología en **BioTinker**, se define la estructura de registro `Producto`. En Python, este registro se implementará utilizando `@dataclass` (o una clase convencional con atributos).

### Campos del Registro

| Nombre del Campo | Tipo de Dato | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `id_cepa_sku` *(Clave)* | `str` (String) | Stock Keeping Unit. Identificador alfanumérico único. | `"BIO-9003-98-9-GFP"` |
| `nombre_cientifico` | `str` (String) | Nombre taxonómico/científico de la cepa o reactivo. | `"Aequorea victoria Fluorescent Protein Strain"` |
| `nivel_bioseguridad` | `int` (Entero) | Nivel de bioseguridad recomendado para manipulación. | `1` |
| `temp_almacenamiento` | `float` (Real) | Temperatura de conservación recomendada en °C. | `-20.0` |
| `requiere_licencia` | `bool` (Booleano) | Indica si requiere aprobación regulatoria especial. | `false` |
| `precio_por_microlitro` | `float` (Real) | Tarifa estándar por microlitro en USD. | `14.25` |
| `precio_mayorista` | `float` (Real) | Tarifa mayorista reducida por microlitro (&ge; 500 μL). | `11.50` |
| `volumen_stock` | `float` (Real) | Volumen total de stock disponible en microlitros. | `1000.0` |
| `Descripcion` | `str` (String) | Resumen y detalles técnicos específicos del producto. | `"Cepa modificada genéticamente..."` |
| `Categoria` | `str` (String) | Clasificación científica o de laboratorio del producto. | `"Bioluminiscencia"` |

### Identificación y Justificación de la Clave
*   **Clave Elegida**: `id_cepa_sku` (Identificador de Cepa SKU).
*   **Justificación**: 
    1.  **Unicidad**: El SKU es un código normalizado e inequívoco para cada tipo de producto en inventario. No se repite entre diferentes artículos.
    2.  **Eficiencia de Búsqueda**: Al mapear el catálogo en un diccionario de Python (`{id_cepa_sku: Producto}`), la búsqueda de un producto específico para añadir al carrito o ver sus detalles se realiza en tiempo constante ($O(1)$) usando su clave `id_cepa_sku`.
    3.  **Semántica del Dominio**: En sistemas reales de inventario y biotecnología, los nombres de los compuestos o cepas pueden ser similares o cambiar (ej. cambiar de proveedor o marca), mientras que el código de inventario permanece inmutable para esa presentación específica.

---

## 4. Registro del Proceso de Interacción con la IA

*Nota: A continuación se detallan los prompts estructurados que dieron origen al diseño de la aplicación y la estructura de registro solicitada por la cátedra.*

### Prompt 1: Generación de Ideas y Definición de Requerimientos
> **Usuario**:
> "Hola. Necesito crear el diseño inicial de un e-commerce web llamado 'BioTinker' para la materia Algoritmos y Estructura de Datos usando Python y Flask. Venderá productos de biotecnología, cultivos microbiológicos y enzimas. El proyecto debe ser simple para poder terminarse en una semana. Ayúdame a definir los requerimientos básicos y cómo estructurar el catálogo usando conceptos de la Unidad 2 de la materia (estructuras tipo registro y uso de una clave)."

### Prompt 2: Diseño Detallado del Registro y Elección de Clave
> **Usuario**:
> "Diseña el registro principal para representar un producto biotecnológico en Python. Indica claramente el nombre de cada campo, el tipo de dato esperado y define una clave de registro única justificando por qué es la mejor opción para realizar búsquedas rápidas en el catálogo."
