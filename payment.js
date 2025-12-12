/* 
    ============================================
    SOULTOUCH ZA - STRIPE PAYMENT INTEGRATION
    ============================================
    
    This script handles:
    - Stripe Elements initialization
    - Payment form handling
    - Payment processing
    - Error handling and loading states
*/

// Stripe publishable key (should be set in environment or config)
const STRIPE_PUBLISHABLE_KEY = window.STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here';

// Initialize Stripe
let stripe = null;
let elements = null;
let cardElement = null;
let paymentIntentClientSecret = null;
let currentOrderId = null;
let currentOrderNumber = null;

// Initialize Stripe when DOM is ready
function initializeStripe() {
    if (typeof Stripe === 'undefined') {
        console.error('Stripe.js not loaded');
        return false;
    }

    try {
        stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
        elements = stripe.elements();
        
        // Create card element
        cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#E8E8E8',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    '::placeholder': {
                        color: '#B8B8B9',
                    },
                    backgroundColor: 'transparent',
                },
                invalid: {
                    color: '#ff6b6b',
                    iconColor: '#ff6b6b',
                },
            },
        });

        // Mount card element
        const cardElementContainer = document.getElementById('card-element');
        if (cardElementContainer) {
            cardElement.mount('#card-element');
            
            // Handle real-time validation errors
            cardElement.on('change', (event) => {
                const displayError = document.getElementById('card-errors');
                if (event.error) {
                    displayError.textContent = event.error.message;
                    displayError.style.display = 'block';
                } else {
                    displayError.textContent = '';
                    displayError.style.display = 'none';
                }
            });
        }

        return true;
    } catch (error) {
        console.error('Error initializing Stripe:', error);
        return false;
    }
}

// Create payment intent
async function createPaymentIntent(cart, customerInfo) {
    try {
        const response = await fetch('/api/checkout/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                cart,
                customerInfo,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create payment intent');
        }

        return data;
    } catch (error) {
        console.error('Error creating payment intent:', error);
        throw error;
    }
}

// Process payment
async function processPayment() {
    if (!stripe || !cardElement) {
        throw new Error('Stripe not initialized');
    }

    if (!paymentIntentClientSecret) {
        throw new Error('Payment intent not created');
    }

    try {
        const { error, paymentIntent } = await stripe.confirmCardPayment(
            paymentIntentClientSecret,
            {
                payment_method: {
                    card: cardElement,
                },
            }
        );

        if (error) {
            throw new Error(error.message);
        }

        if (paymentIntent.status === 'succeeded') {
            return {
                success: true,
                paymentIntent,
            };
        } else {
            throw new Error('Payment not completed');
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        throw error;
    }
}

// Handle payment form submission
async function handlePaymentSubmission(cart, customerInfo) {
    try {
        // Show loading state
        setPaymentLoading(true);
        
        // Create payment intent
        const { clientSecret, orderId, orderNumber } = await createPaymentIntent(cart, customerInfo);
        
        paymentIntentClientSecret = clientSecret;
        currentOrderId = orderId;
        currentOrderNumber = orderNumber;

        // Process payment
        const result = await processPayment();

        if (result.success) {
            // Payment successful - redirect to order summary
            // Store order ID for order summary page
            sessionStorage.setItem('soultouch_last_order_id', currentOrderId);
            sessionStorage.setItem('soultouch_last_order_number', currentOrderNumber);
            
            // Clear cart
            saveCart([]);
            
            // Redirect to order summary
            window.location.href = `order-summary.html?orderId=${currentOrderId}`;
        }
    } catch (error) {
        console.error('Payment error:', error);
        showPaymentError(error.message);
        setPaymentLoading(false);
    }
}

// Set loading state
function setPaymentLoading(loading) {
    const submitButton = document.getElementById('proceedToOrderSummary') || document.getElementById('payButton');
    const cardErrors = document.getElementById('card-errors');
    
    if (submitButton) {
        submitButton.disabled = loading;
        submitButton.textContent = loading ? 'Processing...' : 'Complete Payment';
    }

    if (cardElement) {
        cardElement.update({ disabled: loading });
    }

    if (loading && cardErrors) {
        cardErrors.style.display = 'none';
    }
}

// Show payment error
function showPaymentError(message) {
    const cardErrors = document.getElementById('card-errors');
    if (cardErrors) {
        cardErrors.textContent = message;
        cardErrors.style.display = 'block';
    }
    
    // Also show toast if available
    if (typeof showToast === 'function') {
        showToast(message);
    }
}

// Export functions for use in checkout.js
window.stripePayment = {
    initialize: initializeStripe,
    handlePaymentSubmission,
    setPaymentLoading,
    showPaymentError,
};

