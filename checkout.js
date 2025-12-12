/* 
    ============================================
    SOULTOUCH ZA - CHECKOUT PAGE FUNCTIONALITY
    ============================================
    
    This script handles:
    - Loading cart items into checkout summary
    - Calculating totals with delivery costs
    - Form validation
    - Redirecting to order summary page
*/

// ============================================
// CHECKOUT PAGE INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Check if cart is empty
    const cart = getCart();
    if (cart.length === 0) {
        showToast('Your cart is empty');
        setTimeout(() => {
            window.location.href = 'cart.html';
        }, 2000);
        return;
    }
    
    // Load checkout summary
    loadCheckoutSummary();
    
    // Update cart count in navbar
    updateCartCount();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize Stripe
    if (window.stripePayment) {
        window.stripePayment.initialize();
    }
    
    // Initialize delivery cost updates
    const deliveryRadios = document.querySelectorAll('.delivery-radio');
    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', updateDeliveryCost);
    });
    
    // Initialize payment method toggle
    const paymentRadios = document.querySelectorAll('.payment-radio');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', togglePaymentMethod);
    });
    
    // Initialize form submission
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateCheckoutForm()) {
                proceedToOrderSummary();
            }
        });
    }
    
    // Initialize input focus effects
    const inputs = document.querySelectorAll('.checkout-input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
    });
});

// ============================================
// LOAD CHECKOUT SUMMARY
// ============================================
function loadCheckoutSummary() {
    const cart = getCart();
    const itemsList = document.getElementById('checkoutItemsList');
    
    if (!itemsList) return;
    
    // Clear existing items
    itemsList.innerHTML = '';
    
    if (cart.length === 0) {
        itemsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 1rem;">No items in cart</p>';
        return;
    }
    
    // Render each cart item
    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'checkout-item';
        
        itemElement.innerHTML = `
            <div class="checkout-item-image" data-brand="${item.brand}">
                ${item.name}
            </div>
            <div class="checkout-item-details">
                <div class="checkout-item-name">${item.name}</div>
                <div class="checkout-item-meta">
                    <span class="checkout-item-brand">${item.brand}</span>
                    <span class="checkout-item-separator">•</span>
                    <span class="checkout-item-size">Size ${item.size}</span>
                    <span class="checkout-item-separator">•</span>
                    <span class="checkout-item-qty">Qty ${item.quantity}</span>
                </div>
                <div class="checkout-item-price">R${item.price * item.quantity}</div>
            </div>
        `;
        
        itemsList.appendChild(itemElement);
    });
    
    // Calculate and update totals
    calculateCheckoutTotal();
}

// ============================================
// UPDATE DELIVERY COST
// ============================================
function updateDeliveryCost() {
    const selectedDelivery = document.querySelector('input[name="delivery"]:checked');
    const deliveryCostEl = document.getElementById('checkoutDelivery');
    
    if (!selectedDelivery || !deliveryCostEl) return;
    
    const deliveryCost = selectedDelivery.value === 'express' ? 180 : 100;
    deliveryCostEl.textContent = `R${deliveryCost}`;
    
    // Recalculate total
    calculateCheckoutTotal();
    
    // Add animation to delivery option
    const deliveryOption = selectedDelivery.closest('.delivery-option');
    if (deliveryOption) {
        deliveryOption.style.transform = 'scale(1.02)';
        setTimeout(() => {
            deliveryOption.style.transform = '';
        }, 200);
    }
}

// ============================================
// CALCULATE CHECKOUT TOTAL
// ============================================
function calculateCheckoutTotal() {
    const cart = getCart();
    const subtotalEl = document.getElementById('checkoutSubtotal');
    const deliveryEl = document.getElementById('checkoutDelivery');
    const totalEl = document.getElementById('checkoutTotal');
    
    if (!subtotalEl || !deliveryEl || !totalEl) return;
    
    // Calculate subtotal
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Get delivery cost
    const selectedDelivery = document.querySelector('input[name="delivery"]:checked');
    const deliveryCost = selectedDelivery && selectedDelivery.value === 'express' ? 180 : 100;
    
    // Calculate total
    const total = subtotal + deliveryCost;
    
    // Update display
    subtotalEl.textContent = `R${subtotal}`;
    deliveryEl.textContent = `R${deliveryCost}`;
    totalEl.textContent = `R${total}`;
}

// ============================================
// VALIDATE CHECKOUT FORM
// ============================================
function validateCheckoutForm() {
    const form = document.getElementById('checkoutForm');
    if (!form) return false;
    
    const requiredFields = [
        { id: 'fullName', name: 'Full Name' },
        { id: 'email', name: 'Email Address' },
        { id: 'phone', name: 'Phone Number' },
        { id: 'address', name: 'Delivery Address' },
        { id: 'city', name: 'City' },
        { id: 'postalCode', name: 'Postal Code' }
    ];
    
    let isValid = true;
    const errors = [];
    
    // Validate each required field
    requiredFields.forEach(field => {
        const input = document.getElementById(field.id);
        if (!input || !input.value.trim()) {
            isValid = false;
            errors.push(`${field.name} is required`);
            input.classList.add('error');
        } else {
            input.classList.remove('error');
            
            // Additional validation for email
            if (field.id === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value.trim())) {
                    isValid = false;
                    errors.push('Please enter a valid email address');
                    input.classList.add('error');
                }
            }
            
            // Additional validation for phone
            if (field.id === 'phone') {
                const phoneRegex = /^[\d\s\-\+\(\)]+$/;
                if (!phoneRegex.test(input.value.trim()) || input.value.trim().length < 10) {
                    isValid = false;
                    errors.push('Please enter a valid phone number');
                    input.classList.add('error');
                }
            }
        }
    });
    
    // Check if cart is not empty
    const cart = getCart();
    if (cart.length === 0) {
        isValid = false;
        errors.push('Your cart is empty');
    }
    
    // Show errors if any
    if (!isValid) {
        showToast(errors[0] || 'Please fill in all required fields');
        
        // Scroll to first error
        const firstError = document.querySelector('.checkout-input.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
    }
    
    return isValid;
}

// ============================================
// TOGGLE PAYMENT METHOD
// ============================================
function togglePaymentMethod() {
    const selectedPayment = document.querySelector('input[name="payment"]:checked').value;
    const cardPaymentSection = document.getElementById('card-payment-section');
    
    if (cardPaymentSection) {
        if (selectedPayment === 'card') {
            cardPaymentSection.style.display = 'block';
        } else {
            cardPaymentSection.style.display = 'none';
        }
    }
}

// ============================================
// PROCEED TO ORDER SUMMARY
// ============================================
async function proceedToOrderSummary() {
    // Validate form first
    if (!validateCheckoutForm()) {
        return;
    }
    
    // Get form data
    const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim(),
        city: document.getElementById('city').value.trim(),
        postalCode: document.getElementById('postalCode').value.trim(),
        delivery: document.querySelector('input[name="delivery"]:checked').value,
        payment: document.querySelector('input[name="payment"]:checked').value
    };
    
    // Get cart data
    const cart = getCart();
    
    // Check payment method
    if (formData.payment === 'card') {
        // Process with Stripe
        if (window.stripePayment) {
            try {
                await window.stripePayment.handlePaymentSubmission(cart, formData);
            } catch (error) {
                console.error('Payment error:', error);
                showToast('Payment failed. Please try again.');
            }
        } else {
            showToast('Payment system not initialized');
        }
    } else {
        // For other payment methods (coming soon), show message
        showToast('This payment method is coming soon. Please use card payment.');
    }
}

