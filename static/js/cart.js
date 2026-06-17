/* ==========================================================================
   BIOTINKER - LÓGICA DE CARRITO EN MEMORIA
   Materia: Algoritmos y Estructura de Datos
   ========================================================================== */

// Estado del carrito en memoria caché del cliente (se pierde al recargar F5)
let cart = {};

// Alternar visibilidad del carrito (Abrir / Cerrar)
function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
}

/**
 * Añadir producto básico (usado desde las tarjetas del catálogo, añade de a 100 μL por comodidad)
 */
function addToCart(sku, maxStock, name, price, wholesalePrice = null) {
    // Para simplificar desde el catálogo, cada click añade 100 μL
    const quantityToAdd = 100;
    
    // Si no se pasa el precio mayorista, se estima con 20% de descuento
    const wPrice = wholesalePrice ? wholesalePrice : (price * 0.8);
    
    addArbitraryQtyToCart(sku, quantityToAdd, maxStock, name, price, wPrice);
}

/**
 * Añadir cantidad arbitraria al carrito (usado desde la vista de detalle)
 */
function addArbitraryQtyToCart(sku, qty, maxStock, name, regPrice, wholesalePrice) {
    // Si el producto no está en el carrito, se inicializa su registro
    if (!cart[sku]) {
        cart[sku] = {
            id_cepa_sku: sku,
            nombre_cientifico: name,
            precio_regular: regPrice,
            precio_mayorista: wholesalePrice,
            cantidad: 0,
            max_stock: maxStock
        };
    }
    
    // Validar stock disponible
    const nuevaCantidad = cart[sku].cantidad + qty;
    if (nuevaCantidad > maxStock) {
        // Ajustar al máximo posible y alertar
        const disponibleParaAgregar = maxStock - cart[sku].cantidad;
        if (disponibleParaAgregar > 0) {
            cart[sku].cantidad = maxStock;
            showToast(`Se agregaron solo ${disponibleParaAgregar} μL. Stock límite alcanzado.`, true);
        } else {
            showToast("No se puede agregar más. Stock límite alcanzado.", true);
            return;
        }
    } else {
        cart[sku].cantidad = nuevaCantidad;
        showToast(`Agregado al carrito: ${qty} μL de ${name}`);
    }
    
    // Actualizar interfaz
    updateCartUI();
    
    // Abrir automáticamente el carrito para dar feedback visual
    const sidebar = document.getElementById('cart-sidebar');
    if (!sidebar.classList.contains('open')) {
        toggleCart();
    }
}

/**
 * Quitar un ítem del carrito completamente
 */
function removeFromCart(sku) {
    if (cart[sku]) {
        const name = cart[sku].nombre_cientifico;
        delete cart[sku];
        showToast(`Eliminado del carrito: ${name}`);
        updateCartUI();
    }
}

/**
 * Actualizar interfaz del carrito (DOM)
 */
function updateCartUI() {
    const container = document.getElementById('cart-items-container');
    const badge = document.getElementById('cart-badge');
    const totalPriceEl = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    const keys = Object.keys(cart);
    badge.textContent = keys.length;
    
    if (keys.length === 0) {
        container.innerHTML = `
            <div class="cart-empty-message">
                <p>Tu carrito está vacío.</p>
                <small>Agrega cepas o reactivos del catálogo.</small>
            </div>
        `;
        totalPriceEl.textContent = '$0.00';
        checkoutBtn.disabled = true;
        return;
    }
    
    let totalAcumulado = 0;
    checkoutBtn.disabled = false;
    
    keys.forEach(sku => {
        const item = cart[sku];
        
        // Algoritmo de precio: si lleva >= 500 uL aplica el precio mayorista
        const aplicaMayorista = item.cantidad >= 500;
        const precioUnitario = aplicaMayorista ? item.precio_mayorista : item.precio_regular;
        const subtotal = item.cantidad * precioUnitario;
        
        totalAcumulado += subtotal;
        
        const itemHtml = `
            <div class="cart-item">
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.nombre_cientifico}</span>
                    <span class="cart-item-sku">SKU: ${item.id_cepa_sku}</span>
                    <span class="cart-item-math">
                        ${item.cantidad} μL &times; $${precioUnitario.toFixed(2)}
                        ${aplicaMayorista ? '<span class="rate-badge wholesale">Mayorista</span>' : ''}
                    </span>
                </div>
                <div class="cart-item-controls">
                    <span class="cart-item-subtotal">$${subtotal.toFixed(2)}</span>
                    <button class="btn-remove-item" onclick="removeFromCart('${item.id_cepa_sku}')" title="Eliminar ítem">
                        <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', itemHtml);
    });
    
    totalPriceEl.textContent = `$${totalAcumulado.toFixed(2)}`;
}

/**
 * Confirmar Compra (Checkout) enviando datos a Flask API
 */
function checkout() {
    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Procesando Envío Científico...';
    
    // Mapear items al formato esperado por el backend
    const itemsPayload = Object.keys(cart).map(sku => {
        return {
            id_cepa_sku: sku,
            cantidad: cart[sku].cantidad
        };
    });
    
    fetch('/api/comprar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: itemsPayload })
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(res => {
        if (res.status === 200 && res.body.success) {
            // Actualizar stock en la vista de forma dinámica (efecto reactivo)
            res.body.actualizaciones.forEach(act => {
                const sku = act.id_cepa_sku;
                const nuevoStock = act.nuevo_stock;
                
                // Actualizar etiquetas de stock en el catálogo e información de detalle si existen
                const stockLabel = document.getElementById(`stock-val-${sku}`);
                if (stockLabel) {
                    if (nuevoStock > 0) {
                        stockLabel.textContent = `${Math.floor(nuevoStock)} μL`;
                    } else {
                        stockLabel.textContent = 'Sin Stock';
                        stockLabel.classList.add('stock-low');
                    }
                }
                
                // Si estamos en la página del catálogo, deshabilitar el botón si el stock es 0
                const addBtn = document.getElementById(`btn-add-${sku}`);
                const card = document.getElementById(`card-${sku}`);
                if (nuevoStock <= 0) {
                    if (addBtn) {
                        addBtn.disabled = true;
                        addBtn.textContent = 'Sin Stock';
                    }
                    if (card) {
                        card.classList.add('out-of-stock-card');
                    }
                }
            });
            
            // Éxito: Limpiar carrito
            cart = {};
            updateCartUI();
            toggleCart(); // Cerrar sidebar
            
            // Mostrar Toast Exitoso
            showToast(res.body.message, false, 'success');
        } else {
            // Error en validación de stock
            showToast(res.body.error || 'Ocurrió un error al procesar la compra.', true, 'error');
            checkoutBtn.disabled = false;
        }
    })
    .catch(err => {
        console.error('Error en checkout:', err);
        showToast('Error de conexión con el laboratorio. Reintente.', true, 'error');
        checkoutBtn.disabled = false;
    })
    .finally(() => {
        checkoutBtn.textContent = 'Confirmar Compra Recombinante';
    });
}

/**
 * Mostrar notificaciones tipo Toast
 */
function showToast(message, isError = false, type = '') {
    const toast = document.getElementById('toast-notification');
    toast.textContent = message;
    
    // Limpiar clases previas
    toast.className = 'toast-notification';
    
    if (isError || type === 'error') {
        toast.classList.add('error');
    } else if (type === 'success') {
        toast.classList.add('success');
    }
    
    toast.classList.add('show');
    
    // Ocultar a los 4 segundos
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}
