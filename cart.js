/* 
    ============================================
    SOULTOUCH ZA - CART PAGE FUNCTIONALITY
    ============================================
    
    This script handles:
    - Rendering cart items on cart page
    - Updating quantities
    - Removing items
    - Calculating totals
    - Empty cart state
*/

// ============================================
// CART PAGE INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Render cart items on page load
    renderCartItems();
    
    // Update cart count in navbar
    updateCartCount();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const cart = getCart();
            if (cart.length === 0) {
                showToast('Your cart is empty');
                return;
            }
            // Redirect to checkout page
            window.location.href = 'checkout.html';
        });
    }
});

