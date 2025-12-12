require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const { PRODUCTS } = require("./products");
const { db, isConfigured: instantAvailable } = require("./instantdb");
const { sendOrderConfirmation, sendShippingNotification, sendDeliveryConfirmation } = require("./email-service");
const bcrypt = require("bcrypt");

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
    ? require("stripe")(process.env.STRIPE_SECRET_KEY)
    : null;

const app = express();
const port = process.env.PORT || 3000;

// CORS: adjust origin as needed for prod
app.use(
    cors({
        origin: true,
        credentials: true,
    })
);
// Stripe webhook needs raw body
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
    if (!stripe) {
        return res.status(503).json({ error: "Stripe not configured" });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error("Stripe webhook secret not configured");
        return res.status(500).json({ error: "Webhook not configured" });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        console.log("Payment succeeded:", paymentIntent.id);

        // Get order metadata
        const metadata = paymentIntent.metadata;
        
        if (metadata.orderId && instantAvailable) {
            try {
                // Update order status
                await db.transact([
                    db.tx.orders[metadata.orderId].update({
                        paymentStatus: 'succeeded',
                        paymentIntentId: paymentIntent.id,
                        orderStatus: 'payment-confirmed',
                        updatedAt: Date.now(),
                    })
                ]);

                // Commit inventory (reduce stock levels)
                const orderItems = JSON.parse(metadata.orderItems || '[]');
                await commitInventory(orderItems);

                // Fetch full order details for email
                const { data } = await db.query({
                    orders: {
                        $: {
                            where: { id: metadata.orderId }
                        },
                        items: {}
                    }
                });

                if (data.orders && data.orders.length > 0) {
                    const order = data.orders[0];
                    // Send order confirmation email
                    await sendOrderConfirmation({
                        orderNumber: order.orderNumber,
                        customerName: order.customerName,
                        customerEmail: order.customerEmail,
                        deliveryAddress: order.deliveryAddress,
                        deliveryCity: order.deliveryCity,
                        deliveryPostalCode: order.deliveryPostalCode,
                        deliveryMethod: order.deliveryMethod,
                        subtotal: order.subtotal,
                        deliveryCost: order.deliveryCost,
                        total: order.total,
                        items: order.items || []
                    });
                }

                console.log("Order updated and inventory committed");
            } catch (error) {
                console.error("Error processing successful payment:", error);
            }
        }
    } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        console.log("Payment failed:", paymentIntent.id);

        const metadata = paymentIntent.metadata;
        if (metadata.orderId && instantAvailable) {
            try {
                // Update order status
                await db.transact([
                    db.tx.orders[metadata.orderId].update({
                        paymentStatus: 'failed',
                        paymentIntentId: paymentIntent.id,
                        updatedAt: Date.now(),
                    })
                ]);

                // Release reserved inventory
                const orderItems = JSON.parse(metadata.orderItems || '[]');
                await releaseInventory(orderItems);

                console.log("Order marked as failed and inventory released");
            } catch (error) {
                console.error("Error processing failed payment:", error);
            }
        }
    }

    res.json({ received: true });
});

app.use(express.json());
app.use(cookieParser());

// Serve static files (HTML, CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname)));

// Serve index.html for root path
app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Health check
app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});

// Products endpoint (currently serves local data; will swap to InstantDB)
app.get("/api/products", async (_req, res) => {
    try {
        if (instantAvailable) {
            const { data, error } = await db.query({
                products: {},
            });

            if (error) {
                throw error;
            }

            const products = (data?.products || []).filter(
                (p) => p.active !== false
            ).map(p => ({
                ...p,
                images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
                sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes,
                tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags,
            }));
            return res.json({ products });
        }

        // Fallback to bundled data
        res.json({ products: PRODUCTS });
    } catch (err) {
        console.error("Failed to fetch products", err);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Get authentication status
app.get("/api/auth/status", async (_req, res) => {
    try {
        // Get auth token from cookie
        const token = _req.cookies.instant_token;
        
        if (!token) {
            return res.json({ user: null });
        }

        if (!instantAvailable) {
            return res.json({ user: null });
        }

        // Verify token and get user info
        // Note: InstantDB admin SDK doesn't have a direct "get user from token" method
        // We'll use the runtime auth API to verify the token
        const appId = process.env.INSTANTDB_APP_ID;
        const response = await fetch(`https://instantdb.com/runtime/auth/verify_refresh_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                app_id: appId,
                refresh_token: token
            })
        });

        if (response.ok) {
            const data = await response.json();
            return res.json({ user: data.user || { id: data.user_id } });
        } else {
            // Token invalid, clear cookie
            res.clearCookie('instant_token');
            return res.json({ user: null });
        }
    } catch (err) {
        console.error("Auth status error", err);
        res.json({ user: null });
    }
});

// Send magic code (sign in with email)
app.post("/api/auth/signin", async (_req, res) => {
    try {
        const { email } = _req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({ error: "Email is required" });
        }

        if (!instantAvailable) {
            return res.status(503).json({ error: "InstantDB not configured. Please set INSTANTDB_APP_ID and INSTANTDB_ADMIN_TOKEN in your .env file." });
        }

        const appId = process.env.INSTANTDB_APP_ID;
        const normalizedEmail = email.toLowerCase().trim();
        
        // Send magic code via InstantDB runtime auth API
        try {
            const response = await fetch(`https://instantdb.com/runtime/auth/send_magic_code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    app_id: appId,
                    email: normalizedEmail
                })
            });

            const data = await response.json();

            if (response.ok) {
                res.json({ 
                    message: "Magic code sent! Check your email.",
                    success: true 
                });
            } else {
                console.error("InstantDB API error:", data);
                res.status(response.status || 500).json({ 
                    error: data.error || data.message || "Failed to send magic code" 
                });
            }
        } catch (fetchError) {
            console.error("Network error calling InstantDB:", fetchError);
            res.status(500).json({ 
                error: "Failed to connect to InstantDB. Please check your configuration." 
            });
        }
    } catch (err) {
        console.error("Sign in error", err);
        res.status(500).json({ error: "Failed to send magic code" });
    }
});

// Verify magic code
app.post("/api/auth/verify", async (_req, res) => {
    try {
        const { email, code } = _req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({ error: "Email is required" });
        }

        if (!code || !code.trim()) {
            return res.status(400).json({ error: "Code is required" });
        }

        if (!instantAvailable) {
            return res.status(503).json({ error: "InstantDB not configured. Please set INSTANTDB_APP_ID and INSTANTDB_ADMIN_TOKEN in your .env file." });
        }

        const appId = process.env.INSTANTDB_APP_ID;
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedCode = code.trim();
        
        // Verify magic code via InstantDB runtime auth API
        try {
            const response = await fetch(`https://instantdb.com/runtime/auth/verify_magic_code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    app_id: appId,
                    email: normalizedEmail,
                    code: normalizedCode
                })
            });

            const data = await response.json();

            if (response.ok && data.refresh_token) {
                // Set refresh token as HTTP-only cookie
                res.cookie('instant_token', data.refresh_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
                });

                res.json({ 
                    user: { 
                        id: data.user_id || data.user?.id,
                        email: normalizedEmail
                    },
                    success: true 
                });
            } else {
                console.error("InstantDB verification error:", data);
                res.status(response.status || 401).json({ 
                    error: data.error || data.message || "Invalid code" 
                });
            }
        } catch (fetchError) {
            console.error("Network error calling InstantDB:", fetchError);
            res.status(500).json({ 
                error: "Failed to connect to InstantDB. Please check your configuration." 
            });
        }
    } catch (err) {
        console.error("Verify code error", err);
        res.status(500).json({ error: "Failed to verify code" });
    }
});

// Sign in as guest
app.post("/api/auth/guest", async (_req, res) => {
    try {
        if (!instantAvailable) {
            return res.status(503).json({ error: "InstantDB not configured. Please set INSTANTDB_APP_ID and INSTANTDB_ADMIN_TOKEN in your .env file." });
        }

        const appId = process.env.INSTANTDB_APP_ID;
        
        // Sign in as guest via InstantDB runtime auth API
        try {
            const response = await fetch(`https://instantdb.com/runtime/auth/sign_in_guest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    app_id: appId
                })
            });

            const data = await response.json();

            if (response.ok && data.refresh_token) {
                // Set refresh token as HTTP-only cookie
                res.cookie('instant_token', data.refresh_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
                });

                res.json({ 
                    user: { 
                        id: data.user_id || data.user?.id || 'guest'
                    },
                    success: true 
                });
            } else {
                console.error("InstantDB guest sign in error:", data);
                res.status(response.status || 500).json({ 
                    error: data.error || data.message || "Failed to sign in as guest" 
                });
            }
        } catch (fetchError) {
            console.error("Network error calling InstantDB:", fetchError);
            res.status(500).json({ 
                error: "Failed to connect to InstantDB. Please check your configuration." 
            });
        }
    } catch (err) {
        console.error("Guest sign in error", err);
        res.status(500).json({ error: "Failed to sign in as guest" });
    }
});

// Sign out
app.post("/api/auth/signout", async (_req, res) => {
    try {
        const token = _req.cookies.instant_token;
        
        // Clear cookie
        res.clearCookie('instant_token');

        // Optionally revoke token on InstantDB
        if (token && instantAvailable) {
            const appId = process.env.INSTANTDB_APP_ID;
            try {
                await fetch(`https://instantdb.com/runtime/signout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        app_id: appId,
                        refresh_token: token
                    })
                });
            } catch (err) {
                // Ignore errors when signing out
                console.log("Sign out API call failed (non-critical)", err);
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Sign out error", err);
        res.json({ success: true }); // Always return success for sign out
    }
});

// ============================================
// STRIPE PAYMENT ENDPOINTS
// ============================================

// Create payment intent
app.post("/api/checkout/create-payment-intent", async (req, res) => {
    try {
        if (!stripe) {
            return res.status(503).json({ error: "Stripe not configured. Please set STRIPE_SECRET_KEY in your .env file." });
        }

        if (!instantAvailable) {
            return res.status(503).json({ error: "InstantDB not configured" });
        }

        const { cart, customerInfo } = req.body;

        if (!cart || cart.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        // Validate customer info
        if (!customerInfo || !customerInfo.fullName || !customerInfo.email) {
            return res.status(400).json({ error: "Customer information is required" });
        }

        // Check inventory availability
        const inventoryCheck = await checkInventoryAvailability(cart);
        if (!inventoryCheck.available) {
            return res.status(400).json({ 
                error: "Some items are out of stock",
                unavailableItems: inventoryCheck.unavailableItems 
            });
        }

        // Calculate totals
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryCost = customerInfo.delivery === 'express' ? 180 : 100;
        const total = subtotal + deliveryCost;

        // Create order in database with pending status
        const orderNumber = `ST-${Date.now().toString().slice(-8)}`;
        const orderData = {
            orderNumber,
            userId: req.user?.id || null,
            customerName: customerInfo.fullName,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone,
            deliveryAddress: customerInfo.address,
            deliveryCity: customerInfo.city,
            deliveryPostalCode: customerInfo.postalCode,
            subtotal,
            deliveryCost,
            total,
            paymentStatus: 'pending',
            deliveryMethod: customerInfo.delivery,
            paymentMethod: customerInfo.payment,
            orderStatus: 'placed',
            createdAt: Date.now(),
        };

        const { data: orderResult } = await db.transact([
            db.tx.orders[db.id()].update(orderData)
        ]);

        const orderId = orderResult.orders[0].id;

        // Create order items
        const orderItemsTransactions = cart.map(item => {
            return db.tx.orderItems[db.id()].update({
                orderId,
                productId: item.id,
                productName: item.name,
                brand: item.brand,
                size: item.size,
                quantity: item.quantity,
                price: item.price,
                imageUrl: item.images ? item.images[0] : '',
            });
        });

        await db.transact(orderItemsTransactions);

        // Reserve inventory
        await reserveInventory(cart);

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(total * 100), // Convert to cents
            currency: 'zar',
            metadata: {
                orderId,
                orderNumber,
                orderItems: JSON.stringify(cart.map(item => ({
                    productId: item.id,
                    size: item.size,
                    quantity: item.quantity
                })))
            },
            description: `Order ${orderNumber} - Soultouch ZA`,
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            orderId,
            orderNumber,
        });
    } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ error: "Failed to create payment intent" });
    }
});

// ============================================
// ORDER MANAGEMENT ENDPOINTS
// ============================================

// Get user's orders
app.get("/api/orders", async (req, res) => {
    try {
        if (!instantAvailable) {
            return res.status(503).json({ error: "InstantDB not configured" });
        }

        // Get user from auth token
        const token = req.cookies.instant_token;
        if (!token) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        // Verify token and get user
        const appId = process.env.INSTANTDB_APP_ID;
        const authResponse = await fetch(`https://instantdb.com/runtime/auth/verify_refresh_token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ app_id: appId, refresh_token: token })
        });

        if (!authResponse.ok) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const authData = await authResponse.json();
        const userId = authData.user_id;

        // Fetch user's orders
        const { data, error } = await db.query({
            orders: {
                $: {
                    where: { userId }
                },
                items: {}
            }
        });

        if (error) {
            throw error;
        }

        res.json({ orders: data.orders || [] });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

// Get specific order details
app.get("/api/orders/:id", async (req, res) => {
    try {
        if (!instantAvailable) {
            return res.status(503).json({ error: "InstantDB not configured" });
        }

        const { id } = req.params;

        const { data, error } = await db.query({
            orders: {
                $: {
                    where: { id }
                },
                items: {}
            }
        });

        if (error) {
            throw error;
        }

        if (!data.orders || data.orders.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }

        res.json({ order: data.orders[0] });
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ error: "Failed to fetch order" });
    }
});

// Track order by order number
app.get("/api/orders/:orderNumber/track", async (req, res) => {
    try {
        if (!instantAvailable) {
            return res.status(503).json({ error: "InstantDB not configured" });
        }

        const { orderNumber } = req.params;

        const { data, error } = await db.query({
            orders: {
                $: {
                    where: { orderNumber }
                },
                items: {}
            }
        });

        if (error) {
            throw error;
        }

        if (!data.orders || data.orders.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }

        res.json({ order: data.orders[0] });
    } catch (error) {
        console.error("Error tracking order:", error);
        res.status(500).json({ error: "Failed to track order" });
    }
});

// Update order status (admin only)
app.patch("/api/orders/:id/status", async (req, res) => {
    try {
        if (!instantAvailable) {
            return res.status(503).json({ error: "InstantDB not configured" });
        }

        // Check admin authentication
        const isAdmin = await checkAdminAuth(req);
        if (!isAdmin) {
            return res.status(403).json({ error: "Admin access required" });
        }

        const { id } = req.params;
        const { orderStatus } = req.body;

        if (!orderStatus) {
            return res.status(400).json({ error: "Order status is required" });
        }

        // Update order
        await db.transact([
            db.tx.orders[id].update({
                orderStatus,
                updatedAt: Date.now(),
            })
        ]);

        // Fetch updated order for email
        const { data } = await db.query({
            orders: {
                $: {
                    where: { id }
                },
                items: {}
            }
        });

        if (data.orders && data.orders.length > 0) {
            const order = data.orders[0];
            
            // Send appropriate email based on status
            if (orderStatus === 'shipped') {
                await sendShippingNotification({
                    orderNumber: order.orderNumber,
                    customerName: order.customerName,
                    customerEmail: order.customerEmail,
                    deliveryAddress: order.deliveryAddress,
                    deliveryCity: order.deliveryCity,
                    deliveryPostalCode: order.deliveryPostalCode,
                });
            } else if (orderStatus === 'delivered') {
                await sendDeliveryConfirmation({
                    orderNumber: order.orderNumber,
                    customerName: order.customerName,
                    customerEmail: order.customerEmail,
                });
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ error: "Failed to update order status" });
    }
});

// ============================================
// INVENTORY MANAGEMENT ENDPOINTS
// ============================================

// Get inventory for a product
app.get("/api/inventory/:productId", async (req, res) => {
    try {
        if (!instantAvailable) {
            return res.status(503).json({ error: "InstantDB not configured" });
        }

        const { productId } = req.params;

        const { data, error } = await db.query({
            inventory: {
                $: {
                    where: { productId }
                }
            }
        });

        if (error) {
            throw error;
        }

        res.json({ inventory: data.inventory || [] });
    } catch (error) {
        console.error("Error fetching inventory:", error);
        res.status(500).json({ error: "Failed to fetch inventory" });
    }
});

// Bulk check inventory availability
app.post("/api/inventory/check", async (req, res) => {
    try {
        if (!instantAvailable) {
            return res.status(503).json({ error: "InstantDB not configured" });
        }

        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: "Items array is required" });
        }

        const result = await checkInventoryAvailability(items);
        res.json(result);
    } catch (error) {
        console.error("Error checking inventory:", error);
        res.status(500).json({ error: "Failed to check inventory" });
    }
});

// Update stock levels (admin only)
app.patch("/api/inventory/:id", async (req, res) => {
    try {
        if (!instantAvailable) {
            return res.status(503).json({ error: "InstantDB not configured" });
        }

        // Check admin authentication
        const isAdmin = await checkAdminAuth(req);
        if (!isAdmin) {
            return res.status(403).json({ error: "Admin access required" });
        }

        const { id } = req.params;
        const { stockLevel } = req.body;

        if (typeof stockLevel !== 'number' || stockLevel < 0) {
            return res.status(400).json({ error: "Valid stock level is required" });
        }

        // Get current inventory to calculate available
        const { data: currentData } = await db.query({
            inventory: {
                $: {
                    where: { id }
                }
            }
        });

        if (!currentData.inventory || currentData.inventory.length === 0) {
            return res.status(404).json({ error: "Inventory not found" });
        }

        const current = currentData.inventory[0];
        const available = stockLevel - (current.reserved || 0);

        await db.transact([
            db.tx.inventory[id].update({
                stockLevel,
                available: Math.max(0, available),
            })
        ]);

        res.json({ success: true });
    } catch (error) {
        console.error("Error updating inventory:", error);
        res.status(500).json({ error: "Failed to update inventory" });
    }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Admin login
app.post("/api/admin/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

        if (!adminPasswordHash) {
            return res.status(503).json({ error: "Admin credentials not configured" });
        }

        if (username !== adminUsername) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isValid = await bcrypt.compare(password, adminPasswordHash);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Set admin session cookie
        res.cookie('admin_session', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

// Admin logout
app.post("/api/admin/logout", (req, res) => {
    res.clearCookie('admin_session');
    res.json({ success: true });
});

// Get dashboard statistics
app.get("/api/admin/stats", async (req, res) => {
    try {
        if (!instantAvailable) {
            return res.status(503).json({ error: "InstantDB not configured" });
        }

        // Check admin authentication
        const isAdmin = await checkAdminAuth(req);
        if (!isAdmin) {
            return res.status(403).json({ error: "Admin access required" });
        }

        // Fetch all orders
        const { data, error } = await db.query({
            orders: {}
        });

        if (error) {
            throw error;
        }

        const orders = data.orders || [];

        // Calculate statistics
        const totalOrders = orders.length;
        const totalRevenue = orders
            .filter(o => o.paymentStatus === 'succeeded')
            .reduce((sum, o) => sum + o.total, 0);
        
        const pendingOrders = orders.filter(o => 
            o.orderStatus === 'placed' || o.orderStatus === 'payment-confirmed'
        ).length;

        const completedOrders = orders.filter(o => 
            o.orderStatus === 'delivered'
        ).length;

        // Recent orders (last 10)
        const recentOrders = orders
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 10);

        res.json({
            totalOrders,
            totalRevenue,
            pendingOrders,
            completedOrders,
            recentOrders,
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ error: "Failed to fetch statistics" });
    }
});

// Get all orders (admin)
app.get("/api/admin/orders", async (req, res) => {
    try {
        if (!instantAvailable) {
            return res.status(503).json({ error: "InstantDB not configured" });
        }

        // Check admin authentication
        const isAdmin = await checkAdminAuth(req);
        if (!isAdmin) {
            return res.status(403).json({ error: "Admin access required" });
        }

        const { data, error } = await db.query({
            orders: {
                items: {}
            }
        });

        if (error) {
            throw error;
        }

        res.json({ orders: data.orders || [] });
    } catch (error) {
        console.error("Error fetching admin orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

// Create/update product (admin)
app.post("/api/admin/products", async (req, res) => {
    try {
        if (!instantAvailable) {
            return res.status(503).json({ error: "InstantDB not configured" });
        }

        // Check admin authentication
        const isAdmin = await checkAdminAuth(req);
        if (!isAdmin) {
            return res.status(403).json({ error: "Admin access required" });
        }

        const { id, ...productData } = req.body;

        // Validate required fields
        if (!productData.name || !productData.brand || !productData.price) {
            return res.status(400).json({ error: "Name, brand, and price are required" });
        }

        // Convert arrays to JSON strings if needed
        if (Array.isArray(productData.images)) {
            productData.images = JSON.stringify(productData.images);
        }
        if (Array.isArray(productData.sizes)) {
            productData.sizes = JSON.stringify(productData.sizes);
        }
        if (Array.isArray(productData.tags)) {
            productData.tags = JSON.stringify(productData.tags);
        }

        const productId = id || db.id();
        await db.transact([
            db.tx.products[productId].update(productData)
        ]);

        res.json({ success: true, productId });
    } catch (error) {
        console.error("Error saving product:", error);
        res.status(500).json({ error: "Failed to save product" });
    }
});

// Bulk update inventory (admin)
app.patch("/api/admin/inventory", async (req, res) => {
    try {
        if (!instantAvailable) {
            return res.status(503).json({ error: "InstantDB not configured" });
        }

        // Check admin authentication
        const isAdmin = await checkAdminAuth(req);
        if (!isAdmin) {
            return res.status(403).json({ error: "Admin access required" });
        }

        const { updates } = req.body;

        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({ error: "Updates array is required" });
        }

        const transactions = updates.map(update => {
            const available = update.stockLevel - (update.reserved || 0);
            return db.tx.inventory[update.id].update({
                stockLevel: update.stockLevel,
                available: Math.max(0, available),
            });
        });

        await db.transact(transactions);

        res.json({ success: true });
    } catch (error) {
        console.error("Error bulk updating inventory:", error);
        res.status(500).json({ error: "Failed to update inventory" });
    }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function checkAdminAuth(req) {
    const adminSession = req.cookies.admin_session;
    return adminSession === 'authenticated';
}

async function checkInventoryAvailability(items) {
    if (!instantAvailable) {
        return { available: true, unavailableItems: [] };
    }

    try {
        const unavailableItems = [];

        for (const item of items) {
            const { data } = await db.query({
                inventory: {
                    $: {
                        where: {
                            productId: item.id,
                            size: item.size.toString()
                        }
                    }
                }
            });

            if (!data.inventory || data.inventory.length === 0) {
                // No inventory record, assume available
                continue;
            }

            const inv = data.inventory[0];
            if (inv.available < item.quantity) {
                unavailableItems.push({
                    productId: item.id,
                    productName: item.name,
                    size: item.size,
                    requested: item.quantity,
                    available: inv.available
                });
            }
        }

        return {
            available: unavailableItems.length === 0,
            unavailableItems
        };
    } catch (error) {
        console.error("Error checking inventory:", error);
        return { available: true, unavailableItems: [] };
    }
}

async function reserveInventory(items) {
    if (!instantAvailable) return;

    try {
        for (const item of items) {
            const { data } = await db.query({
                inventory: {
                    $: {
                        where: {
                            productId: item.id,
                            size: item.size.toString()
                        }
                    }
                }
            });

            if (data.inventory && data.inventory.length > 0) {
                const inv = data.inventory[0];
                await db.transact([
                    db.tx.inventory[inv.id].update({
                        reserved: (inv.reserved || 0) + item.quantity,
                        available: Math.max(0, inv.available - item.quantity)
                    })
                ]);
            }
        }
    } catch (error) {
        console.error("Error reserving inventory:", error);
    }
}

async function releaseInventory(items) {
    if (!instantAvailable) return;

    try {
        for (const item of items) {
            const { data } = await db.query({
                inventory: {
                    $: {
                        where: {
                            productId: item.productId,
                            size: item.size.toString()
                        }
                    }
                }
            });

            if (data.inventory && data.inventory.length > 0) {
                const inv = data.inventory[0];
                await db.transact([
                    db.tx.inventory[inv.id].update({
                        reserved: Math.max(0, (inv.reserved || 0) - item.quantity),
                        available: inv.available + item.quantity
                    })
                ]);
            }
        }
    } catch (error) {
        console.error("Error releasing inventory:", error);
    }
}

async function commitInventory(items) {
    if (!instantAvailable) return;

    try {
        for (const item of items) {
            const { data } = await db.query({
                inventory: {
                    $: {
                        where: {
                            productId: item.productId,
                            size: item.size.toString()
                        }
                    }
                }
            });

            if (data.inventory && data.inventory.length > 0) {
                const inv = data.inventory[0];
                await db.transact([
                    db.tx.inventory[inv.id].update({
                        stockLevel: Math.max(0, inv.stockLevel - item.quantity),
                        reserved: Math.max(0, (inv.reserved || 0) - item.quantity)
                    })
                ]);
            }
        }
    } catch (error) {
        console.error("Error committing inventory:", error);
    }
}

app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
    if (!stripe) {
        console.warn("⚠️  Stripe not configured. Set STRIPE_SECRET_KEY in .env to enable payments.");
    }
    if (!instantAvailable) {
        console.warn("⚠️  InstantDB not configured. Set INSTANTDB_APP_ID and INSTANTDB_ADMIN_TOKEN in .env.");
    }
});

