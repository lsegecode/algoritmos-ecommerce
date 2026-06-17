/* ==========================================================================
   BIOTINKER - COORDINADOR ESTÁTICO (CLIENT-SIDE CLIENT APP)
   Materia: Algoritmos y Estructura de Datos
   ========================================================================== */

// Base de datos de productos y categorías global para el cliente
let productsDB = {};

// --- PARSER DE MARKDOWN EN JAVASCRIPT ---
function markdownToHtml(mdText) {
    if (!mdText) return "";
    
    let html = mdText;
    
    // Reemplazar bloques de código ``` ... ``` con <pre><code>...</code></pre>
    html = html.replace(/```(?:python|javascript|json|html|css|mermaid)?\s*([\s\S]*?)\s*```/g, '<pre><code>$1</code></pre>');
    
    // Reemplazar código en línea `code`
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    
    // Reemplazar negrita **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Reemplazar cursiva *text*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Reemplazar encabezados: ###, ##, #
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    
    // Reemplazar citas comunes > texto
    html = html.replace(/^>\s*(.*?)$/gm, '<blockquote>$1</blockquote>');
    
    // Convertir listas con guión o asterisco a <li>
    html = html.replace(/^\s*[\-\*]\s*(.*?)$/gm, '<li>$1</li>');
    
    // Procesar líneas y tablas por algoritmo lineal
    let lines = html.split('\n');
    let processedLines = [];
    let inCode = false;
    let inTable = false;
    let tableHeader = true;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let trimmed = line.trim();
        
        if (line.includes('<pre>')) inCode = true;
        if (line.includes('</pre>')) {
            inCode = false;
            processedLines.push(line);
            continue;
        }
        
        if (inCode) {
            processedLines.push(line);
            continue;
        }
        
        // Parser de Tablas Markdown
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            if (/^\|[\s\-\:\s|]+$/.test(trimmed)) {
                continue; // Saltar línea de separación
            }
            
            let cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
            
            if (!inTable) {
                inTable = true;
                tableHeader = true;
                processedLines.push('<table><thead>');
            }
            
            if (tableHeader) {
                let ths = cells.map(c => `<th>${c}</th>`).join('');
                processedLines.push(`<tr>${ths}</tr>`);
                processedLines.push('</thead><tbody>');
                tableHeader = false;
            } else {
                let tds = cells.map(c => `<td>${c}</td>`).join('');
                processedLines.push(`<tr>${tds}</tr>`);
            }
            continue;
        } else {
            if (inTable) {
                inTable = false;
                processedLines.push('</tbody></table>');
            }
        }
        
        // Espaciadores y párrafos
        if (!trimmed) {
            processedLines.push('<div class="spacer"></div>');
        } else if (trimmed.startsWith('<h') || 
                   trimmed.startsWith('<li') || 
                   trimmed.startsWith('<blockquote') || 
                   trimmed.startsWith('<div') || 
                   trimmed.startsWith('<pre') || 
                   trimmed.startsWith('</pre>')) {
            processedLines.push(line);
        } else {
            processedLines.push(`<p>${line}</p>`);
        }
    }
    
    if (inTable) {
        processedLines.push('</tbody></table>');
    }
    
    return processedLines.join('\n');
}

// Auxiliar para extraer secciones del texto de prompts por cabecera
function getPromptSection(content, startHeader, endHeader = null) {
    let idxStart = content.indexOf(startHeader);
    if (idxStart === -1) return "";
    
    // Mover cursor después de la cabecera e incluir el salto de línea
    let idxStartContent = content.indexOf('\n', idxStart);
    if (idxStartContent === -1) {
        idxStartContent = idxStart + startHeader.length;
    } else {
        idxStartContent += 1;
    }
    
    if (endHeader) {
        let idxEnd = content.indexOf(endHeader, idxStartContent);
        if (idxEnd !== -1) {
            return content.substring(idxStartContent, idxEnd).trim();
        }
    }
    return content.substring(idxStartContent).trim();
}

// --- MANEJO DE BASE DE DATOS Y PERSISTENCIA TEMPORAL ---

/**
 * Cargar los productos desde el archivo JSON de forma asíncrona.
 * Conserva el stock modificado en el sessionStorage para simular persistencia
 * entre navegaciones en GitHub Pages.
 */
async function loadProducts() {
    // Si ya existe en sessionStorage, cargarlo desde allí (mantiene stock modificado)
    const cached = sessionStorage.getItem('biotinker_products');
    if (cached) {
        productsDB = JSON.parse(cached);
        return;
    }
    
    try {
        const response = await fetch('productos.json');
        if (!response.ok) throw new Error("No se pudo cargar productos.json");
        productsDB = await response.json();
        
        // Guardar copia en cache de sesión
        sessionStorage.setItem('biotinker_products', JSON.stringify(productsDB));
    } catch (err) {
        console.error("Error cargando productos.json:", err);
        // Fallback en caso de CORS local severo
        productsDB = {
            "BIO-9003-98-9-GFP": {
                "id_cepa_sku": "BIO-9003-98-9-GFP",
                "nombre_cientifico": "Aequorea victoria Fluorescent Protein Strain",
                "nivel_bioseguridad": 1,
                "temp_almacenamiento": -20.0,
                "requiere_licencia": false,
                "precio_por_microlitro": 14.25,
                "precio_mayorista": 11.50,
                "volumen_stock": 1000.0,
                "Descripcion": "Cepa modificada genéticamente que expresa la Proteína Verde Fluorescente (GFP) de Aequorea victoria. Ideal para demostraciones educativas de fluorescencia y marcado molecular.",
                "Categoria": "Bioluminiscencia"
            }
        };
        sessionStorage.setItem('biotinker_products', JSON.stringify(productsDB));
    }
}

// Actualizar el almacenamiento en sesión con los valores actuales de stock
function saveProductsToSession() {
    sessionStorage.setItem('biotinker_products', JSON.stringify(productsDB));
}

// --- INICIALIZADORES DE VISTAS ESTÁTICAS ---

/**
 * Inicializar Catálogo Estático (index.html)
 */
async function initStaticCatalog() {
    await loadProducts();
    
    // Obtener parámetros de la URL
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || '';
    const category = params.get('categoria') || 'Todas';
    const sortBy = params.get('orden') || 'nombre';
    
    // Rellenar controles del formulario con los valores actuales
    const searchInput = document.getElementById('search-input');
    const categorySelect = document.getElementById('category-select');
    const sortSelect = document.getElementById('sort-select');
    
    if (searchInput) searchInput.value = query;
    if (sortSelect) sortSelect.value = sortBy;
    
    // Obtener categorías dinámicas y poblar el dropdown
    const categorias = getUniqueCategories();
    if (categorySelect) {
        categorySelect.innerHTML = `<option value="Todas">Todas las categorías</option>`;
        categorias.forEach(cat => {
            const selectedAttr = (cat === category) ? 'selected' : '';
            categorySelect.insertAdjacentHTML('beforeend', `<option value="${cat}" ${selectedAttr}>${cat}</option>`);
        });
    }
    
    // Filtrar y ordenar productos en memoria (Algoritmos JS)
    let list = Object.values(productsDB);
    
    // 1. Filtrar por búsqueda
    if (query.trim() !== '') {
        const q = query.toLowerCase().trim();
        list = list.filter(p => 
            p.id_cepa_sku.toLowerCase().includes(q) || 
            p.nombre_cientifico.toLowerCase().includes(q) || 
            p.Descripcion.toLowerCase().includes(q)
        );
    }
    
    // 2. Filtrar por categoría
    if (category !== 'Todas') {
        list = list.filter(p => p.Categoria === category);
    }
    
    // 3. Ordenar
    if (sortBy === 'precio_asc') {
        list.sort((a, b) => a.precio_por_microlitro - b.precio_por_microlitro);
    } else if (sortBy === 'precio_desc') {
        list.sort((a, b) => b.precio_por_microlitro - a.precio_por_microlitro);
    } else if (sortBy === 'stock_asc') {
        list.sort((a, b) => a.volumen_stock - b.volumen_stock);
    } else if (sortBy === 'stock_desc') {
        list.sort((a, b) => b.volumen_stock - a.volumen_stock);
    } else { // nombre (A-Z)
        list.sort((a, b) => a.nombre_cientifico.localeCompare(b.nombre_cientifico));
    }
    
    // Renderizar grilla de productos
    const grid = document.getElementById('products-grid-static');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (list.length === 0) {
        grid.innerHTML = `
            <div class="no-results glass">
                <p>No se encontraron productos que coincidan con los criterios de búsqueda o filtrado.</p>
                <a href="index.html" class="btn-primary">Ver Catálogo Completo</a>
            </div>
        `;
        return;
    }
    
    list.forEach(prod => {
        const isOutOfStock = prod.volumen_stock <= 0;
        const cardHtml = `
            <div class="product-card glass ${isOutOfStock ? 'out-of-stock-card' : ''}" id="card-${prod.id_cepa_sku}">
                <div class="card-header">
                    <span class="category-badge">${prod.Categoria}</span>
                    <span class="bioseguridad-badge level-${prod.nivel_bioseguridad}">
                        Nivel BST ${prod.nivel_bioseguridad}
                    </span>
                </div>

                <div class="card-body">
                    <h3 class="product-title">${prod.nombre_cientifico}</h3>
                    <p class="product-sku">SKU: <code>${prod.id_cepa_sku}</code></p>
                    <p class="product-desc-preview">${prod.Descripcion.substring(0, 100)}...</p>
                    
                    <div class="product-meta">
                        <div class="meta-item">
                            <span class="meta-label">Temp:</span>
                            <span class="meta-value">${prod.temp_almacenamiento} °C</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Licencia:</span>
                            <span class="meta-value">${prod.requiere_licencia ? 'Requerida' : 'No requerida'}</span>
                        </div>
                    </div>
                </div>

                <div class="card-footer">
                    <div class="price-box">
                        <div class="price-row">
                            <span class="price-label">Precio/μL:</span>
                            <span class="price-value">$${prod.precio_por_microlitro.toFixed(2)}</span>
                        </div>
                        <div class="price-row wholesale">
                            <span class="price-label">Mayorista:</span>
                            <span class="price-value">$${prod.precio_mayorista.toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="stock-box">
                        <span class="stock-label">Stock:</span>
                        <span id="stock-val-${prod.id_cepa_sku}" class="stock-value ${prod.volumen_stock < 800 ? 'stock-low' : ''}">
                            ${!isOutOfStock ? Math.floor(prod.volumen_stock) + ' μL' : 'Sin Stock'}
                        </span>
                    </div>

                    <div class="card-actions">
                        <a href="detalle.html?sku=${prod.id_cepa_sku}" class="btn-secondary">Detalle</a>
                        <button 
                            id="btn-add-${prod.id_cepa_sku}"
                            class="btn-primary" 
                            onclick="addToCart('${prod.id_cepa_sku}', ${prod.volumen_stock}, '${prod.nombre_cientifico}', ${prod.precio_por_microlitro})"
                            ${isOutOfStock ? 'disabled' : ''}>
                            ${isOutOfStock ? 'Sin Stock' : 'Agregar'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', cardHtml);
    });
    
    // Mostrar u ocultar el botón de limpiar filtros
    const resetWrapper = document.getElementById('reset-filters-wrapper');
    if (resetWrapper) {
        if (query || category !== 'Todas' || sortBy !== 'nombre') {
            resetWrapper.innerHTML = `<a href="index.html" class="btn-reset">Limpiar Filtros</a>`;
        } else {
            resetWrapper.innerHTML = '';
        }
    }
}

/**
 * Inicializar Vista de Detalle Estática (detalle.html)
 */
async function initStaticDetail() {
    await loadProducts();
    
    const params = new URLSearchParams(window.location.search);
    const sku = params.get('sku');
    
    if (!sku || !productsDB[sku]) {
        // Redirigir a catálogo si el SKU no es válido
        window.location.href = 'index.html';
        return;
    }
    
    const prod = productsDB[sku];
    
    // Renderizar detalles dinámicamente en el DOM
    document.title = `${prod.nombre_cientifico} - Detalle Cepa`;
    
    // 1. Panel Visual
    const visualPanel = document.getElementById('detail-visual-panel-static');
    if (visualPanel) {
        visualPanel.innerHTML = `
            <div class="biotech-graphic-container">
                <div class="biotech-glow"></div>
                <div class="biotech-dna-icon">🧬</div>
            </div>
            
            <div class="spec-quick-tags">
                <span class="category-badge big">${prod.Categoria}</span>
                <span class="bioseguridad-badge level-${prod.nivel_bioseguridad} big">
                    Nivel de Bioseguridad ${prod.nivel_bioseguridad}
                </span>
            </div>

            <div class="license-alert-box ${prod.requiere_licencia ? 'required' : ''}">
                ${prod.requiere_licencia ? `
                    <div class="license-icon">⚠️</div>
                    <div class="license-text">
                        <strong>Requiere Licencia Especial:</strong> Este producto requiere aprobación regulatoria para su manipulación y envío.
                    </div>
                ` : `
                    <div class="license-icon">✓</div>
                    <div class="license-text">
                        <strong>Manipulación Libre:</strong> No se requiere licencia adicional para su manipulación básica de laboratorio.
                    </div>
                `}
            </div>
        `;
    }
    
    // 2. Tabla de especificaciones y descripción
    const infoPanel = document.getElementById('detail-info-panel-static');
    if (infoPanel) {
        const isOutOfStock = prod.volumen_stock <= 0;
        infoPanel.innerHTML = `
            <h1 class="detail-title">${prod.nombre_cientifico}</h1>
            <p class="detail-sku-label">SKU Identificador: <code>${prod.id_cepa_sku}</code></p>
            
            <div class="detail-description">
                <h2>Descripción Científica</h2>
                <p>${prod.Descripcion}</p>
            </div>

            <div class="technical-specs">
                <h2>Especificaciones de Registro</h2>
                <table class="specs-table">
                    <tbody>
                        <tr>
                            <th>Clave SKU (id_cepa_sku)</th>
                            <td><code>${prod.id_cepa_sku}</code></td>
                        </tr>
                        <tr>
                            <th>Nombre Científico</th>
                            <td><em>${prod.nombre_cientifico}</em></td>
                        </tr>
                        <tr>
                            <th>Categoría Científica</th>
                            <td>${prod.Categoria}</td>
                        </tr>
                        <tr>
                            <th>Nivel de Bioseguridad (BST)</th>
                            <td>Clase ${prod.nivel_bioseguridad} (Recomendación CDC)</td>
                        </tr>
                        <tr>
                            <th>Temperatura de Almacenamiento</th>
                            <td class="temp-highlight">${prod.temp_almacenamiento} °C</td>
                        </tr>
                        <tr>
                            <th>Licencia Requerida</th>
                            <td>${prod.requiere_licencia ? 'Sí, control especial' : 'No, libre adquisición'}</td>
                        </tr>
                        <tr>
                            <th>Precio Regular por Microlitro</th>
                            <td><strong>$${prod.precio_por_microlitro.toFixed(2)} USD</strong></td>
                        </tr>
                        <tr>
                            <th>Precio Mayorista (&ge; 500 μL)</th>
                            <td class="wholesale-price-highlight"><strong>$${prod.precio_mayorista.toFixed(2)} USD</strong></td>
                        </tr>
                        <tr>
                            <th>Volumen Disponible en Stock</th>
                            <td>
                                <span id="stock-val-${prod.id_cepa_sku}">
                                    ${Math.floor(prod.volumen_stock)}
                                </span> μL
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Panel de Compra -->
            <div class="purchase-action-card">
                <h3>Agregar a Orden Científica</h3>
                ${!isOutOfStock ? `
                    <div class="purchase-inputs">
                        <div class="quantity-selector-wrapper">
                            <label for="detail-qty">Cantidad (μL):</label>
                            <div class="quantity-input-controls">
                                <button type="button" class="btn-qty-adj" onclick="adjustDetailQty(-50)">-50</button>
                                <input type="number" id="detail-qty" value="100" min="1" max="${Math.floor(prod.volumen_stock)}" oninput="updateDetailPriceCalculations()">
                                <button type="button" class="btn-qty-adj" onclick="adjustDetailQty(50)">+50</button>
                            </div>
                        </div>
                        
                        <div class="pricing-preview">
                            <div class="preview-row">
                                <span>Tarifa Aplicada:</span>
                                <span id="applied-rate-label" class="rate-badge">Regular</span>
                            </div>
                            <div class="preview-row total">
                                <span>Subtotal:</span>
                                <span id="detail-price-preview">$0.00</span>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        id="btn-add-${prod.id_cepa_sku}"
                        class="btn-primary btn-block" 
                        onclick="addCustomQtyToCartStatic('${prod.id_cepa_sku}', ${prod.volumen_stock}, '${prod.nombre_cientifico}', ${prod.precio_por_microlitro}, ${prod.precio_mayorista})">
                        Agregar al Carrito
                    </button>
                ` : `
                    <div class="out-of-stock-alert">
                        <span>Sin existencias disponibles en el inventario de laboratorio actual.</span>
                    </div>
                `}
            </div>
        `;
        
        // Inicializar cálculos si hay stock
        if (!isOutOfStock) {
            // Guardar variables en window para los scripts de ajuste
            window.detail_sku = prod.id_cepa_sku;
            window.detail_max_stock = prod.volumen_stock;
            window.detail_price_regular = prod.precio_por_microlitro;
            window.detail_price_wholesale = prod.precio_mayorista;
            updateDetailPriceCalculations();
        }
    }
}

// Funciones globales para la página de detalle
window.adjustDetailQty = function(amount) {
    const input = document.getElementById('detail-qty');
    if (!input) return;
    let val = parseInt(input.value) || 0;
    val += amount;
    if (val < 1) val = 1;
    if (val > window.detail_max_stock) val = Math.floor(window.detail_max_stock);
    input.value = val;
    updateDetailPriceCalculations();
};

window.updateDetailPriceCalculations = function() {
    const input = document.getElementById('detail-qty');
    if (!input) return;
    
    let qty = parseInt(input.value) || 0;
    if (qty < 1) qty = 1;
    if (qty > window.detail_max_stock) qty = Math.floor(window.detail_max_stock);
    input.value = qty;
    
    const rateLabel = document.getElementById('applied-rate-label');
    const pricePreview = document.getElementById('detail-price-preview');
    
    let activePrice = window.detail_price_regular;
    if (qty >= 500) {
        activePrice = window.detail_price_wholesale;
        rateLabel.textContent = "Mayorista";
        rateLabel.className = "rate-badge wholesale";
    } else {
        rateLabel.textContent = "Regular";
        rateLabel.className = "rate-badge";
    }
    
    const subtotal = qty * activePrice;
    pricePreview.textContent = "$" + subtotal.toFixed(2);
};

window.addCustomQtyToCartStatic = function(sku, maxStock, name, regPrice, wholesalePrice) {
    const input = document.getElementById('detail-qty');
    const qty = parseInt(input.value) || 0;
    
    if (qty <= 0) {
        showToast("La cantidad debe ser mayor a 0", true);
        return;
    }
    
    addArbitraryQtyToCart(sku, qty, maxStock, name, regPrice, wholesalePrice);
};

/**
 * Inicializar Vista de Prompts Estática (prompts.html)
 */
async function initStaticPrompts() {
    // 1. Cargar y parsear Prompts.md
    try {
        const resPrompts = await fetch('Prompts.md');
        if (!resPrompts.ok) throw new Error();
        const text = await resPrompts.text();
        
        // Separar secciones
        const seccionPre = getPromptSection(text, "# Pre creacion", "# Numero 1");
        const seccionNum1 = getPromptSection(text, "# Numero 1", "# Numero 2");
        const seccionNum2 = getPromptSection(text, "# Numero 2", "# Numero 3");
        const seccionNum3 = getPromptSection(text, "# Numero 3", "# Numero 4");
        const seccionNum4 = getPromptSection(text, "# Numero 4", "# Numero 5");
        const seccionNum5 = getPromptSection(text, "# Numero 5");
        
        // Renderizar en el slideshow
        document.getElementById('slide-content-0').innerHTML = markdownToHtml(seccionPre);
        document.getElementById('slide-content-1').innerHTML = markdownToHtml(seccionNum1);
        document.getElementById('slide-content-2').innerHTML = markdownToHtml(seccionNum2);
        document.getElementById('slide-content-3').innerHTML = markdownToHtml(seccionNum3);
        document.getElementById('slide-content-4').innerHTML = markdownToHtml(seccionNum4);
        document.getElementById('slide-content-5').innerHTML = markdownToHtml(seccionNum5);
    } catch(err) {
        console.error("Error cargando Prompts.md en estático:", err);
        // Mensaje de fallback
        for (let i = 0; i < 6; i++) {
            const container = document.getElementById(`slide-content-${i}`);
            if (container) container.innerHTML = `<p>Error al cargar el archivo Prompts.md. Asegúrate de estar corriendo la app en un servidor (como Live Server o GitHub Pages).</p>`;
        }
    }
    
    // 2. Cargar y parsear propuesta.md
    try {
        const resPropuesta = await fetch('propuesta.md');
        if (!resPropuesta.ok) throw new Error();
        const text = await resPropuesta.text();
        document.getElementById('propuesta-html-container').innerHTML = markdownToHtml(text);
    } catch(err) {
        document.getElementById('propuesta-html-container').innerHTML = `<p>Error al cargar propuesta.md</p>`;
    }
    
    // 3. Cargar y parsear plan_implementacion.md
    try {
        const resPlan = await fetch('plan_implementacion.md');
        if (!resPlan.ok) throw new Error();
        const text = await resPlan.text();
        document.getElementById('plan-html-container').innerHTML = markdownToHtml(text);
    } catch(err) {
        document.getElementById('plan-html-container').innerHTML = `<p>Error al cargar plan_implementacion.md</p>`;
    }
    
    // 4. Cargar y parsear plan_implementacion_despliegue.md
    try {
        const resPlanDesp = await fetch('plan_implementacion_despliegue.md');
        if (!resPlanDesp.ok) throw new Error();
        const text = await resPlanDesp.text();
        document.getElementById('plan-despliegue-html-container').innerHTML = markdownToHtml(text);
    } catch(err) {
        document.getElementById('plan-despliegue-html-container').innerHTML = `<p>Error al cargar plan_implementacion_despliegue.md</p>`;
    }
}

// --- AUXILIARES GENERALES ---

function getUniqueCategories() {
    const list = Object.values(productsDB);
    const set = new Set();
    list.forEach(p => set.add(p.Categoria));
    return Array.from(set).sort();
}

// --- ENRUTADOR INICIAL DE VISTA ESTÁTICA ---
document.addEventListener("DOMContentLoaded", () => {
    // Detectar en qué página estamos por el nombre del archivo en la URL
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);
    
    if (page === 'detalle.html') {
        initStaticDetail();
    } else if (page === 'prompts.html') {
        initStaticPrompts();
    } else {
        // Por defecto, index.html o raíz
        initStaticCatalog();
    }
});
