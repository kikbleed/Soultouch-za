/* 
    ============================================
    SOULTOUCH ZA - ORDER TRACKING PAGE FUNCTIONALITY
    ============================================
    
    This script handles:
    - Order number input and validation
    - Loading order data from localStorage
    - Displaying order tracking status
    - Generating tracking timeline
*/

// ============================================
// TRACKING PAGE INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Update cart count in navbar
    updateCartCount();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize tracking form
    const trackingForm = document.getElementById('trackingForm');
    if (trackingForm) {
        trackingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleTrackOrder();
        });
    }
    
    // Check if order number is in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('order');
    if (orderNumber) {
        document.getElementById('orderNumberInput').value = orderNumber;
        handleTrackOrder();
    }
});

// ============================================
// HANDLE TRACK ORDER
// ============================================
async function handleTrackOrder() {
    const orderNumberInput = document.getElementById('orderNumberInput');
    const orderNumber = orderNumberInput.value.trim().toUpperCase();
    
    if (!orderNumber) {
        showToast('Please enter an order number');
        return;
    }
    
    try {
        // Fetch order from database
        const response = await fetch(`/api/orders/${orderNumber}/track`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            showTrackingNotFound();
            return;
        }
        
        const { order } = await response.json();
        displayTrackingResult(order);
    } catch (error) {
        console.error('Error tracking order:', error);
        showTrackingNotFound();
    }
}

// ============================================
// GET ORDER DATA (DEPRECATED)
// ============================================
function getOrderData() {
    // This function is kept for backward compatibility
    // Orders are now fetched from database
    return null;
}

// ============================================
// GENERATE ORDER NUMBER (DEPRECATED)
// ============================================
function generateOrderNumber() {
    // This function is kept for backward compatibility
    // Order numbers are now generated on the server
    return null;
}

// ============================================
// DISPLAY TRACKING RESULT
// ============================================
function displayTrackingResult(order) {
    // Hide not found message
    const notFoundEl = document.getElementById('trackingNotFound');
    if (notFoundEl) {
        notFoundEl.style.display = 'none';
    }
    
    // Show tracking result
    const resultEl = document.getElementById('trackingResult');
    if (resultEl) {
        resultEl.style.display = 'block';
        resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Display order details
    document.getElementById('trackingOrderNumber').textContent = order.orderNumber;
    document.getElementById('trackingCustomerName').textContent = order.customerName;
    document.getElementById('trackingDeliveryAddress').textContent = 
        `${order.deliveryAddress}, ${order.deliveryCity} ${order.deliveryPostalCode}`;
    
    // Display estimated delivery
    const estimatedDate = estimateDeliveryDate(order.deliveryMethod);
    document.getElementById('trackingEstimatedDelivery').textContent = estimatedDate;
    
    // Display order items
    renderTrackingItems(order.items || []);
    
    // Display tracking timeline
    const trackingStatus = getOrderTrackingStatus(order);
    renderTrackingTimeline(trackingStatus);
}

// ============================================
// ESTIMATE DELIVERY DATE
// ============================================
function estimateDeliveryDate(deliveryMethod) {
    const today = new Date();
    let daysToAdd = 0;
    
    if (deliveryMethod === 'express') {
        daysToAdd = 2;
    } else {
        daysToAdd = 5;
    }
    
    let deliveryDate = new Date(today);
    let addedDays = 0;
    
    while (addedDays < daysToAdd) {
        deliveryDate.setDate(deliveryDate.getDate() + 1);
        const dayOfWeek = deliveryDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            addedDays++;
        }
    }
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return deliveryDate.toLocaleDateString('en-ZA', options);
}

// ============================================
// RENDER TRACKING ITEMS
// ============================================
function renderTrackingItems(items) {
    const itemsList = document.getElementById('trackingItemsList');
    if (!itemsList) return;
    
    itemsList.innerHTML = '';
    
    if (!items || items.length === 0) {
        itemsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 1rem;">No items found</p>';
        return;
    }
    
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'tracking-item';
        
        // Use productName from database or fallback to name
        const itemName = item.productName || item.name;
        
        itemElement.innerHTML = `
            <div class="tracking-item-image" data-brand="${item.brand}">
                ${itemName}
            </div>
            <div class="tracking-item-details">
                <div class="tracking-item-name">${itemName}</div>
                <div class="tracking-item-brand">${item.brand}</div>
                <div class="tracking-item-meta">
                    <span>Size: ${item.size}</span>
                    <span class="tracking-item-separator">•</span>
                    <span>Quantity: ${item.quantity}</span>
                </div>
                <div class="tracking-item-price">R${item.price * item.quantity}</div>
            </div>
        `;
        
        itemsList.appendChild(itemElement);
    });
}

// ============================================
// GET ORDER TRACKING STATUS
// ============================================
function getOrderTrackingStatus(order) {
    if (!order) return null;
    
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const daysSinceOrder = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
    
    // Map order status to stages
    const statusMap = {
        'placed': ['placed'],
        'payment-confirmed': ['placed', 'payment'],
        'preparing': ['placed', 'payment', 'preparing'],
        'shipped': ['placed', 'payment', 'preparing', 'shipped'],
        'out-for-delivery': ['placed', 'payment', 'preparing', 'shipped', 'out-for-delivery'],
        'delivered': ['placed', 'payment', 'preparing', 'shipped', 'out-for-delivery', 'delivered'],
        'cancelled': ['placed']
    };
    
    const completedStages = statusMap[order.orderStatus] || ['placed'];
    
    // Define tracking stages
    const stages = [
        { id: 'placed', label: 'Order Placed', completed: completedStages.includes('placed') },
        { id: 'payment', label: 'Payment Confirmed', completed: completedStages.includes('payment'), note: order.paymentStatus === 'succeeded' ? 'Payment Successful' : '' },
        { id: 'preparing', label: 'Preparing Order', completed: completedStages.includes('preparing') },
        { id: 'shipped', label: 'Shipped', completed: completedStages.includes('shipped') },
        { id: 'out-for-delivery', label: 'Out for Delivery', completed: completedStages.includes('out-for-delivery') },
        { id: 'delivered', label: 'Delivered', completed: completedStages.includes('delivered') }
    ];
    
    // Find current active stage
    let activeStage = order.orderStatus;
    
    return {
        stages: stages,
        activeStage: activeStage
    };
}

// ============================================
// RENDER TRACKING TIMELINE
// ============================================
function renderTrackingTimeline(trackingStatus) {
    const timelineEl = document.getElementById('trackingTimeline');
    if (!timelineEl || !trackingStatus) return;
    
    timelineEl.innerHTML = '';
    
    trackingStatus.stages.forEach((stage, index) => {
        const isActive = stage.id === trackingStatus.activeStage;
        const isCompleted = stage.completed;
        
        const stageElement = document.createElement('div');
        stageElement.className = `tracking-timeline-stage ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
        
        stageElement.innerHTML = `
            <div class="tracking-timeline-indicator">
                <div class="tracking-timeline-circle">
                    ${isCompleted ? `
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    ` : ''}
                </div>
                ${index < trackingStatus.stages.length - 1 ? '<div class="tracking-timeline-line"></div>' : ''}
            </div>
            <div class="tracking-timeline-content">
                <h3 class="tracking-timeline-title">${stage.label}</h3>
                ${stage.note ? `<p class="tracking-timeline-note">${stage.note}</p>` : ''}
            </div>
        `;
        
        timelineEl.appendChild(stageElement);
    });
}

// ============================================
// SHOW TRACKING NOT FOUND
// ============================================
function showTrackingNotFound() {
    const resultEl = document.getElementById('trackingResult');
    if (resultEl) {
        resultEl.style.display = 'none';
    }
    
    const notFoundEl = document.getElementById('trackingNotFound');
    if (notFoundEl) {
        notFoundEl.style.display = 'block';
        notFoundEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

