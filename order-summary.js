/* 
    ============================================
    SOULTOUCH ZA - ORDER SUMMARY PAGE FUNCTIONALITY
    ============================================
    
    This script handles:
    - Loading order data from localStorage
    - Displaying order confirmation details
    - Generating order number
    - Estimating delivery date
*/

// ============================================
// ORDER SUMMARY PAGE INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Update cart count in navbar
    updateCartCount();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Get order ID from URL or session storage
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId') || sessionStorage.getItem('soultouch_last_order_id');
    
    if (!orderId) {
        showToast('No order found. Redirecting to store...');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    // Fetch order from database
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Order not found');
        }
        
        const { order } = await response.json();
        
        // Load order summary
        loadFinalOrderSummary(order);
        
        // Initialize download receipt button
        const downloadBtn = document.getElementById('downloadReceipt');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                generateReceiptPDF(order);
            });
        }
        
        // Clear session storage
        sessionStorage.removeItem('soultouch_last_order_id');
        sessionStorage.removeItem('soultouch_last_order_number');
    } catch (error) {
        console.error('Error loading order:', error);
        showToast('Failed to load order. Redirecting to store...');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
});

// ============================================
// GET ORDER DATA (DEPRECATED - NOW FROM DATABASE)
// ============================================
function getOrderData() {
    // This function is kept for backward compatibility
    // but is no longer used in the new flow
    return null;
}

// ============================================
// LOAD FINAL ORDER SUMMARY
// ============================================
function loadFinalOrderSummary(order) {
    if (!order) return;
    
    // Display order number
    const orderNumberEl = document.getElementById('orderNumber');
    if (orderNumberEl) {
        orderNumberEl.textContent = order.orderNumber;
    }
    
    // Update track order button with order number
    const trackOrderBtn = document.getElementById('trackOrderBtn');
    if (trackOrderBtn) {
        trackOrderBtn.href = `tracking.html?order=${order.orderNumber}`;
    }
    
    // Display customer information
    const customerNameEl = document.getElementById('customerName');
    if (customerNameEl) {
        customerNameEl.textContent = order.customerName;
    }
    
    // Display delivery address
    const deliveryAddressEl = document.getElementById('deliveryAddress');
    if (deliveryAddressEl) {
        deliveryAddressEl.textContent = `${order.deliveryAddress}, ${order.deliveryCity} ${order.deliveryPostalCode}`;
    }
    
    // Display delivery method
    const deliveryMethodEl = document.getElementById('deliveryMethod');
    if (deliveryMethodEl) {
        const methodName = order.deliveryMethod === 'express' ? 'Express Delivery (1–2 days)' : 'Standard Delivery (3–5 days)';
        deliveryMethodEl.textContent = methodName;
    }
    
    // Display estimated delivery date
    const estimatedDeliveryEl = document.getElementById('estimatedDelivery');
    if (estimatedDeliveryEl) {
        const estimatedDate = estimateDeliveryDate(order.deliveryMethod);
        estimatedDeliveryEl.textContent = estimatedDate;
    }
    
    // Display order items
    renderOrderItems(order.items || []);
    
    // Display totals
    const subtotalEl = document.getElementById('orderSubtotal');
    const deliveryEl = document.getElementById('orderDelivery');
    const totalEl = document.getElementById('orderTotal');
    
    if (subtotalEl) subtotalEl.textContent = `R${order.subtotal}`;
    if (deliveryEl) deliveryEl.textContent = `R${order.deliveryCost}`;
    if (totalEl) totalEl.textContent = `R${order.total}`;
}

// ============================================
// GENERATE ORDER NUMBER (DEPRECATED)
// ============================================
function generateOrderNumber() {
    // This function is kept for backward compatibility
    // Order numbers are now generated on the server
    const timestamp = Date.now();
    return `ST-${timestamp.toString().slice(-8)}`;
}

// ============================================
// ESTIMATE DELIVERY DATE
// ============================================
function estimateDeliveryDate(deliveryMethod) {
    const today = new Date();
    let daysToAdd = 0;
    
    if (deliveryMethod === 'express') {
        // Express: 1-2 business days
        daysToAdd = 2;
    } else {
        // Standard: 3-5 business days
        daysToAdd = 5;
    }
    
    // Add business days (skip weekends)
    let deliveryDate = new Date(today);
    let addedDays = 0;
    
    while (addedDays < daysToAdd) {
        deliveryDate.setDate(deliveryDate.getDate() + 1);
        const dayOfWeek = deliveryDate.getDay();
        // Skip weekends (Saturday = 6, Sunday = 0)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            addedDays++;
        }
    }
    
    // Format date as "Day, Month DD, YYYY"
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return deliveryDate.toLocaleDateString('en-ZA', options);
}

// ============================================
// RENDER ORDER ITEMS
// ============================================
function renderOrderItems(items) {
    const itemsList = document.getElementById('orderItemsList');
    if (!itemsList) return;
    
    // Clear existing items
    itemsList.innerHTML = '';
    
    if (!items || items.length === 0) {
        itemsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 1rem;">No items found</p>';
        return;
    }
    
    // Render each order item
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'order-item';
        
        // Use productName from database or fallback to name
        const itemName = item.productName || item.name;
        
        itemElement.innerHTML = `
            <div class="order-item-image" data-brand="${item.brand}">
                ${itemName}
            </div>
            <div class="order-item-details">
                <div class="order-item-name">${itemName}</div>
                <div class="order-item-brand">${item.brand}</div>
                <div class="order-item-meta">
                    <span>Size: ${item.size}</span>
                    <span class="order-item-separator">•</span>
                    <span>Quantity: ${item.quantity}</span>
                </div>
                <div class="order-item-price">R${item.price * item.quantity}</div>
            </div>
        `;
        
        itemsList.appendChild(itemElement);
    });
}

// ============================================
// GENERATE ORDER CONFIRMATION EMAIL
// ============================================
function generateOrderConfirmationEmail(orderData) {
    if (!orderData) return '';
    
    // Generate order number
    const orderNumber = generateOrderNumber();
    
    // Format delivery method
    const deliveryMethod = orderData.customer.delivery === 'express' 
        ? 'Express Delivery (1–2 days)' 
        : 'Standard Delivery (3–5 days)';
    
    // Format delivery address
    const deliveryAddress = `${orderData.customer.address}, ${orderData.customer.city} ${orderData.customer.postalCode}`;
    
    // Estimate delivery date
    const estimatedDelivery = estimateDeliveryDate(orderData.customer.delivery);
    
    // Generate order items HTML
    let orderItemsHTML = '';
    orderData.items.forEach(item => {
        orderItemsHTML += `
            <tr>
                <td style="padding: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td style="font-size: 16px; font-weight: 600; color: #E8E8E8; padding-bottom: 5px;">${item.name}</td>
                            <td align="right" style="font-size: 16px; font-weight: 700; color: #C4B998;">R${item.price * item.quantity}</td>
                        </tr>
                        <tr>
                            <td style="font-size: 12px; color: #B8B8B9;">${item.brand} • Size ${item.size} • Qty ${item.quantity}</td>
                            <td></td>
                        </tr>
                    </table>
                </td>
            </tr>
        `;
    });
    
    // Build email HTML
    const emailHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - Soultouch ZA</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #1A1B1D; color: #E8E8E8;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0A0A0B; padding: 20px 0;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #1A1B1D; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.35);">
                    <tr>
                        <td style="padding: 40px 30px 30px; text-align: center; background: linear-gradient(135deg, rgba(174, 177, 181, 0.1) 0%, rgba(196, 185, 152, 0.1) 100%);">
                            <h1 style="margin: 0 0 10px; font-size: 28px; font-weight: 700; color: #E8E8E8; letter-spacing: -0.5px;">Soultouch ZA</h1>
                            <p style="margin: 0; font-size: 14px; color: #B8B8B9; text-transform: uppercase; letter-spacing: 1px;">Order Confirmation</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                            <p style="margin: 0 0 10px; font-size: 14px; color: #B8B8B9;">Order Number</p>
                            <h2 style="margin: 0; font-size: 32px; font-weight: 700; color: #C4B998; letter-spacing: 2px;">${orderNumber}</h2>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <p style="margin: 0 0 8px; font-size: 12px; color: #B8B8B9; text-transform: uppercase; letter-spacing: 1px;">Customer Name</p>
                                        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #E8E8E8;">${orderData.customer.fullName}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 700; color: #E8E8E8;">Ordered Items</h3>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(255, 255, 255, 0.06); border-radius: 12px; overflow: hidden;">
                                ${orderItemsHTML}
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="padding: 15px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="font-size: 14px; color: #B8B8B9;">Subtotal</td>
                                                <td align="right" style="font-size: 14px; font-weight: 600; color: #E8E8E8;">R${orderData.totals.subtotal}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="font-size: 14px; color: #B8B8B9;">Delivery</td>
                                                <td align="right" style="font-size: 14px; font-weight: 600; color: #E8E8E8;">R${orderData.totals.delivery}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 20px 0 0;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="font-size: 18px; font-weight: 700; color: #C4B998;">Total</td>
                                                <td align="right" style="font-size: 24px; font-weight: 700; color: #C4B998;">R${orderData.totals.total}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(196, 185, 152, 0.1); border-radius: 12px; padding: 20px;">
                                <tr>
                                    <td style="padding-bottom: 15px;">
                                        <p style="margin: 0 0 8px; font-size: 12px; color: #B8B8B9; text-transform: uppercase; letter-spacing: 1px;">Delivery Method</p>
                                        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #E8E8E8;">${deliveryMethod}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 15px;">
                                        <p style="margin: 0 0 8px; font-size: 12px; color: #B8B8B9; text-transform: uppercase; letter-spacing: 1px;">Delivery Address</p>
                                        <p style="margin: 0; font-size: 14px; color: #E8E8E8; line-height: 1.6;">${deliveryAddress}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 8px; font-size: 12px; color: #B8B8B9; text-transform: uppercase; letter-spacing: 1px;">Estimated Delivery Date</p>
                                        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #C4B998;">${estimatedDelivery}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 30px; text-align: center;">
                            <a href="tracking.html?order=${orderNumber}" style="display: inline-block; padding: 16px 40px; background-color: #1A1B1D; color: #E8E8E8; text-decoration: none; border: 1px solid rgba(255, 255, 255, 0.28); border-radius: 20px; font-weight: 600; font-size: 16px;">Track Your Order</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px; background-color: rgba(255, 255, 255, 0.06); border-top: 1px solid rgba(255, 255, 255, 0.1);">
                            <p style="margin: 0 0 15px; font-size: 12px; color: #B8B8B9; text-align: center; line-height: 1.6;">
                                <strong style="color: #E8E8E8;">Soultouch ZA</strong><br>
                                123 Business Street, City, 0000<br>
                                South Africa
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #AEB1B5; text-align: center; font-style: italic;">
                                This is a demo email. No payment was processed.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
    
    // For demo: log email HTML (in production, this would be sent via email service)
    console.log('Order Confirmation Email Generated');
    console.log('Email HTML:', emailHTML);
    
    // Optionally, you could open it in a new window for demo purposes
    // const emailWindow = window.open('', '_blank');
    // emailWindow.document.write(emailHTML);
    
    return emailHTML;
}

// ============================================
// GENERATE RECEIPT PDF
// ============================================
function generateReceiptPDF() {
    const orderData = getOrderData();
    if (!orderData) {
        showToast('No order data found');
        return;
    }
    
    // Open receipt template in new window
    const receiptWindow = window.open('receipt-template.html', '_blank');
    
    // Wait for window to load, then trigger print
    if (receiptWindow) {
        receiptWindow.onload = function() {
            // Small delay to ensure content is loaded
            setTimeout(() => {
                receiptWindow.print();
            }, 500);
        };
    } else {
        showToast('Please allow pop-ups to view receipt');
    }
}

