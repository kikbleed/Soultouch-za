/* 
    ============================================
    SOULTOUCH ZA - PRODUCT CATALOG & FILTERING
    ============================================
    
    This script handles:
    - Product catalog data (loaded from products.js)
    - Dynamic product grid rendering
    - Brand filtering (All/Nike/Puma/Adidas)
    - Trending section population
    - Product detail gallery/slideshow
    - Smooth scroll navigation
*/

// ============================================
// PRODUCT CATALOG DATA
// ============================================
// Products are loaded from products.js (PRODUCTS array)
// Using PRODUCTS as the source of truth
const products = PRODUCTS;

// ============================================
// DOM ELEMENTS
// ============================================
const productsGrid = document.getElementById('productsGrid');
const trendingGrid = document.getElementById('trendingGrid');
const filterButtons = document.querySelectorAll('.filter-btn');

// Product detail modal elements
let selectedSize = null;
let currentProduct = null;
let currentImageIndex = 0;
let autoSlideInterval = null;

// ============================================
// LOAD PRODUCTS - Renders all sneakers
// ============================================
function loadProducts(filterBrand = 'all') {
    // Clear existing products
    productsGrid.innerHTML = '';
    
    // Filter products by brand
    const filteredProducts = filterBrand === 'all' 
        ? products 
        : products.filter(product => product.brand === filterBrand);
    
    // Render each product as a glass card
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// ============================================
// LOAD TRENDING - Populates first 6 products
// ============================================
function loadTrending() {
    // Clear existing trending items
    trendingGrid.innerHTML = '';
    
    // Get first 6 products
    const trendingProducts = products.slice(0, 6);
    
    // Render each trending product
    trendingProducts.forEach(product => {
        const productCard = createProductCard(product);
        trendingGrid.appendChild(productCard);
    });
}

// ============================================
// CREATE PRODUCT CARD - Glassmorphism card
// ============================================
function createProductCard(product) {
    // Create card container
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-id', product.id);
    
    // Create image element with real image
    if (product.images && product.images.length > 0) {
        const image = document.createElement('img');
        image.className = 'product-image';
        image.setAttribute('data-brand', product.brand);
        image.src = product.images[0];
        image.alt = `${product.brand} ${product.name}`;
        card.appendChild(image);
    } else {
        // Fallback to placeholder styling
        const placeholder = document.createElement('div');
        placeholder.className = 'product-image-placeholder';
        placeholder.setAttribute('data-brand', product.brand);
        placeholder.textContent = product.name;
        card.appendChild(placeholder);
    }
    
    // Create product info container
    const info = document.createElement('div');
    info.className = 'product-info';
    
    // Brand label
    const brand = document.createElement('div');
    brand.className = 'product-brand';
    brand.textContent = product.brand;
    
    // Product name
    const name = document.createElement('div');
    name.className = 'product-name';
    name.textContent = product.name;
    
    // Price - format as R####
    const price = document.createElement('div');
    price.className = 'product-price';
    price.textContent = `R${product.price}`;
    
    // Assemble card
    info.appendChild(brand);
    info.appendChild(name);
    info.appendChild(price);
    
    card.appendChild(info);
    
    // Add click handler to open product detail by ID
    card.addEventListener('click', () => {
        openProductDetail(product.id);
    });
    
    return card;
}

// ============================================
// INIT FILTERS - Brand filtering functionality
// ============================================
function initFilters() {
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get filter brand from data attribute
            const filterBrand = button.getAttribute('data-brand');
            
            // Reload products with filter
            loadProducts(filterBrand);
            
            // Smooth scroll to products section
            document.getElementById('products').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        });
    });
}

// ============================================
// INIT SMOOTH SCROLL - Anchor navigation
// ============================================
function initSmoothScroll() {
    // Handle all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ============================================
// MOBILE MENU TOGGLE
// ============================================
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-link');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-open');
            menuToggle.classList.toggle('active');
        });
        
        // Close menu when a link is clicked
        navLinksItems.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('mobile-open');
                menuToggle.classList.remove('active');
            });
        });
    }
}

// ============================================
// PRODUCT DETAIL MODAL FUNCTIONS
// ============================================

// Render image gallery with thumbnails
function renderImageGallery(product) {
    if (!product.images || product.images.length === 0) return;
    
    const mainImage = document.getElementById('productMainImage');
    const thumbnailsContainer = document.getElementById('productThumbnails');
    
    if (!mainImage || !thumbnailsContainer) return;
    
    // Set main image to first image
    currentImageIndex = 0;
    setActiveImage(0);
    
    // Clear thumbnails
    thumbnailsContainer.innerHTML = '';
    
    // Create thumbnails
    product.images.forEach((imagePath, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'product-thumb';
        if (index === 0) thumb.classList.add('active');
        
        const thumbImg = document.createElement('img');
        thumbImg.src = imagePath;
        thumbImg.alt = `${product.name} - View ${index + 1}`;
        
        thumb.appendChild(thumbImg);
        thumb.addEventListener('click', () => setActiveImage(index));
        
        thumbnailsContainer.appendChild(thumb);
    });
    
    // Setup arrow navigation
    const leftArrow = document.querySelector('.gallery-arrow.left');
    const rightArrow = document.querySelector('.gallery-arrow.right');
    
    if (leftArrow) {
        leftArrow.onclick = (e) => {
            e.stopPropagation();
            prevImage();
        };
    }
    
    if (rightArrow) {
        rightArrow.onclick = (e) => {
            e.stopPropagation();
            nextImage();
        };
    }
}

// Set active image by index
function setActiveImage(index) {
    if (!currentProduct || !currentProduct.images) return;
    
    const images = currentProduct.images;
    if (index < 0 || index >= images.length) return;
    
    currentImageIndex = index;
    
    // Update main image
    const mainImage = document.getElementById('productMainImage');
    if (mainImage) {
        mainImage.src = images[index];
        mainImage.alt = `${currentProduct.name} - View ${index + 1}`;
    }
    
    // Update active thumbnail
    const thumbnails = document.querySelectorAll('.product-thumb');
    thumbnails.forEach((thumb, i) => {
        if (i === index) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
    
    // Reset auto-slide when user interacts
    stopAutoSlide();
    startAutoSlide();
}

// Navigate to next image
function nextImage() {
    if (!currentProduct || !currentProduct.images) return;
    const nextIndex = (currentImageIndex + 1) % currentProduct.images.length;
    setActiveImage(nextIndex);
}

// Navigate to previous image
function prevImage() {
    if (!currentProduct || !currentProduct.images) return;
    const prevIndex = (currentImageIndex - 1 + currentProduct.images.length) % currentProduct.images.length;
    setActiveImage(prevIndex);
}

// Start auto-slide
function startAutoSlide() {
    if (!currentProduct || !currentProduct.images || currentProduct.images.length <= 1) return;
    
    stopAutoSlide(); // Clear any existing interval
    
    autoSlideInterval = setInterval(() => {
        nextImage();
    }, 4000); // 4 second delay
}

// Stop auto-slide
function stopAutoSlide() {
    if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
    }
}

// Open product detail modal
function openProductDetail(productId) {
    // Find product by ID
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    currentProduct = product;
    selectedSize = null;
    currentImageIndex = 0;
    
    renderProductDetail(currentProduct);
    
    const modal = document.getElementById('productDetailModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock scrolling
    }
    
    // Start auto-slide if enabled
    startAutoSlide();
}

// Close product detail modal
function closeProductDetail() {
    const modal = document.getElementById('productDetailModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
    selectedSize = null;
    currentProduct = null;
    currentImageIndex = 0;
    stopAutoSlide();
}

// Render product detail content
async function renderProductDetail(product) {
    const modal = document.getElementById('productDetailModal');
    if (!modal) return;
    
    const content = modal.querySelector('.product-detail-content');
    if (!content) return;
    
    // Render image gallery
    renderImageGallery(product);
    
    // Product name
    const nameEl = content.querySelector('.product-detail-name');
    if (nameEl) nameEl.textContent = product.name;
    
    // Brand
    const brandEl = content.querySelector('.product-detail-brand');
    if (brandEl) brandEl.textContent = product.brand;
    
    // Price
    const priceEl = content.querySelector('.product-detail-price');
    if (priceEl) priceEl.textContent = `R${product.price}`;
    
    // Description
    const descEl = content.querySelector('.product-detail-description');
    if (descEl) descEl.textContent = product.description;
    
    // Fetch inventory for this product
    let inventoryMap = {};
    try {
        const response = await fetch(`/api/inventory/${product.id}`, {
            credentials: 'include'
        });
        if (response.ok) {
            const { inventory } = await response.json();
            // Create a map of size -> inventory data
            inventory.forEach(inv => {
                inventoryMap[inv.size] = inv;
            });
        }
    } catch (error) {
        console.error('Error fetching inventory:', error);
    }
    
    // Size selector with inventory
    const sizeContainer = content.querySelector('.size-selector');
    if (sizeContainer) {
        sizeContainer.innerHTML = '';
        product.sizes.forEach(size => {
            const sizeBtn = document.createElement('button');
            sizeBtn.className = 'size-btn';
            const sizeStr = size.toString();
            const inv = inventoryMap[sizeStr];
            
            // Check if out of stock
            const isOutOfStock = inv && inv.available <= 0;
            const isLowStock = inv && inv.available > 0 && inv.available <= 5;
            
            if (isOutOfStock) {
                sizeBtn.className = 'size-btn out-of-stock';
                sizeBtn.disabled = true;
                sizeBtn.textContent = size;
                sizeBtn.title = 'Out of stock';
            } else {
                sizeBtn.textContent = size;
                if (isLowStock) {
                    sizeBtn.className = 'size-btn low-stock';
                    sizeBtn.title = `Only ${inv.available} left`;
                }
            }
            
            sizeBtn.setAttribute('data-size', size);
            sizeBtn.setAttribute('data-available', inv ? inv.available : 999);
            
            if (!isOutOfStock) {
                sizeBtn.addEventListener('click', () => handleSizeSelect(size, inv ? inv.available : 999));
            }
            
            sizeContainer.appendChild(sizeBtn);
        });
    }
    
    // Reset size selection
    selectedSize = null;
    updateSizeButtons();
    hideSizeError();
}

// Handle size selection
function handleSizeSelect(size, available) {
    selectedSize = size;
    updateSizeButtons();
    hideSizeError();
    
    // Show stock availability message if low
    if (available && available <= 5) {
        showToast(`Only ${available} left in stock!`);
    }
}

// Update size button states
function updateSizeButtons() {
    const sizeButtons = document.querySelectorAll('.size-btn');
    sizeButtons.forEach(btn => {
        const btnSize = parseInt(btn.getAttribute('data-size'));
        if (btnSize === selectedSize) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

// Show size error message
function showSizeError() {
    const errorEl = document.querySelector('.size-error');
    if (errorEl) {
        errorEl.style.display = 'block';
    }
}

// Hide size error message
function hideSizeError() {
    const errorEl = document.querySelector('.size-error');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

// Validate and handle add to cart
function validateAddToCart() {
    if (!selectedSize) {
        showSizeError();
        return false;
    }
    
    // Add to cart using cart system
    if (currentProduct) {
        addToCart(currentProduct, selectedSize);
        showToast('Added to Cart');
        updateCartCount();
        // Optionally close modal after adding
        // closeProductDetail();
    }
    
    return true;
}

// Load product detail by ID (for URL-based navigation)
function loadProductDetail(productId) {
    openProductDetail(productId);
}

// ============================================
// CART SYSTEM - LOCALSTORAGE BASED
// ============================================

// Add product to cart
function addToCart(product, selectedSize) {
    const cart = getCart();
    
    // Create unique ID for product + size combination
    const cartItemId = `${product.brand}-${product.name}-${selectedSize}`.replace(/\s+/g, '-').toLowerCase();
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => 
        item.id === cartItemId || 
        (item.name === product.name && item.brand === product.brand && item.size === selectedSize)
    );
    
    if (existingItemIndex !== -1) {
        // Increase quantity if item exists
        cart[existingItemIndex].quantity += 1;
    } else {
        // Add new item to cart
        const cartItem = {
            id: cartItemId,
            name: product.name,
            brand: product.brand,
            price: product.price,
            size: selectedSize,
            quantity: 1,
            image: (product.images && product.images.length > 0) ? product.images[0] : `assets/${product.brand.toLowerCase()}-${product.name.toLowerCase().replace(/\s+/g, '-')}.jpg`
        };
        cart.push(cartItem);
    }
    
    saveCart(cart);
}

// Get cart from localStorage
function getCart() {
    try {
        const cartJson = localStorage.getItem('soultouch_cart');
        return cartJson ? JSON.parse(cartJson) : [];
    } catch (error) {
        console.error('Error reading cart from localStorage:', error);
        return [];
    }
}

// Save cart to localStorage
function saveCart(cart) {
    try {
        localStorage.setItem('soultouch_cart', JSON.stringify(cart));
    } catch (error) {
        console.error('Error saving cart to localStorage:', error);
    }
}

// Render cart items on cart page
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCartDiv = document.getElementById('emptyCart');
    const cart = getCart();
    
    if (!cartItemsContainer) return; // Not on cart page
    
    // Clear existing items
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        // Show empty cart message
        if (emptyCartDiv) {
            emptyCartDiv.style.display = 'flex';
        }
        cartItemsContainer.style.display = 'none';
        calculateTotals(); // Update totals to show R100 (shipping only)
        return;
    }
    
    // Hide empty cart message
    if (emptyCartDiv) {
        emptyCartDiv.style.display = 'none';
    }
    cartItemsContainer.style.display = 'block';
    
    // Render each cart item
    cart.forEach((item, index) => {
        const cartItem = createCartItemElement(item, index);
        cartItemsContainer.appendChild(cartItem);
    });
    
    // Update totals
    calculateTotals();
}

// Create cart item element
function createCartItemElement(item, index) {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.setAttribute('data-index', index);
    
    cartItem.innerHTML = `
        <div class="cart-item-image" data-brand="${item.brand}">
            ${item.name}
        </div>
        <div class="cart-item-details">
            <div class="cart-item-brand">${item.brand}</div>
            <h3 class="cart-item-name">${item.name}</h3>
            <div class="cart-item-size">Size: ${item.size}</div>
            <div class="cart-item-price">R${item.price}</div>
        </div>
        <div class="cart-item-controls">
            <div class="quantity-controls">
                <button class="quantity-btn minus-btn" data-action="decrease" aria-label="Decrease quantity">−</button>
                <span class="quantity-value">${item.quantity}</span>
                <button class="quantity-btn plus-btn" data-action="increase" aria-label="Increase quantity">+</button>
            </div>
            <button class="remove-item-btn" aria-label="Remove item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    `;
    
    // Add event listeners
    const minusBtn = cartItem.querySelector('.minus-btn');
    const plusBtn = cartItem.querySelector('.plus-btn');
    const removeBtn = cartItem.querySelector('.remove-item-btn');
    
    minusBtn.addEventListener('click', () => {
        updateQuantity(item.id, item.size, 'decrease');
    });
    
    plusBtn.addEventListener('click', () => {
        updateQuantity(item.id, item.size, 'increase');
    });
    
    removeBtn.addEventListener('click', () => {
        removeFromCart(item.id, item.size);
    });
    
    return cartItem;
}

// Update item quantity
function updateQuantity(productId, size, action) {
    const cart = getCart();
    const itemIndex = cart.findIndex(item => 
        item.id === productId && item.size === size
    );
    
    if (itemIndex === -1) return;
    
    if (action === 'increase') {
        cart[itemIndex].quantity += 1;
    } else if (action === 'decrease') {
        cart[itemIndex].quantity -= 1;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
    }
    
    saveCart(cart);
    renderCartItems();
    updateCartCount();
    showToast('Quantity updated');
}

// Remove item from cart
function removeFromCart(productId, size) {
    const cart = getCart();
    const filteredCart = cart.filter(item => 
        !(item.id === productId && item.size === size)
    );
    
    saveCart(filteredCart);
    renderCartItems();
    updateCartCount();
    showToast('Item removed from cart');
}

// Calculate cart totals
function calculateTotals() {
    const cart = getCart();
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');
    
    if (!subtotalEl || !totalEl) return; // Not on cart page
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 100;
    const total = subtotal + shipping;
    
    subtotalEl.textContent = `R${subtotal}`;
    totalEl.textContent = `R${total}`;
}

// Update cart count badge in navbar
function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(el => {
        el.textContent = totalItems;
        if (totalItems > 0) {
            el.style.display = 'flex';
        } else {
            el.style.display = 'none';
        }
    });
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.querySelector('.toast-message');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Load all products
    loadProducts();
    
    // Load trending section
    loadTrending();
    
    // Initialize filters
    initFilters();
    
    // Initialize smooth scroll
    initSmoothScroll();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize product detail modal
    const modal = document.getElementById('productDetailModal');
    const closeBtn = document.querySelector('.product-detail-close');
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    const modalOverlay = document.querySelector('.modal-overlay');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeProductDetail);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeProductDetail();
            }
        });
    }
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', validateAddToCart);
    }
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeProductDetail();
        }
    });
    
    // Update cart count on page load
    updateCartCount();
    
    console.log('Soultouch ZA - Sneaker Resale Demo Loaded');
    console.log(`Total Products: ${products.length}`);
});

