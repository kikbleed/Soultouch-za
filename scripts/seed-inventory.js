require("dotenv").config();
const { init } = require("@instantdb/admin");

const appId = process.env.INSTANTDB_APP_ID;
const adminToken = process.env.INSTANTDB_ADMIN_TOKEN;

if (!appId || !adminToken) {
    console.error("❌ InstantDB credentials not configured");
    console.error("Please set INSTANTDB_APP_ID and INSTANTDB_ADMIN_TOKEN in your .env file");
    process.exit(1);
}

const db = init({ appId, adminToken });

// Default stock levels for different sizes
const DEFAULT_STOCK_LEVELS = {
    6: 15,
    7: 20,
    8: 25,
    9: 25,
    10: 20,
    11: 15,
    12: 10,
};

async function seedInventory() {
    try {
        console.log("🔄 Fetching products from InstantDB...");
        
        // Fetch all products
        const { data, error } = await db.query({
            products: {}
        });

        if (error) {
            throw error;
        }

        const products = data.products || [];
        console.log(`📦 Found ${products.length} products`);

        if (products.length === 0) {
            console.log("⚠️  No products found. Please run seed-products.js first.");
            return;
        }

        console.log("🔄 Creating inventory records...");
        
        let inventoryCount = 0;
        const transactions = [];

        for (const product of products) {
            // Parse sizes
            let sizes = [];
            try {
                sizes = typeof product.sizes === 'string' 
                    ? JSON.parse(product.sizes) 
                    : product.sizes;
            } catch (e) {
                console.warn(`⚠️  Could not parse sizes for product ${product.id}`);
                continue;
            }

            if (!Array.isArray(sizes) || sizes.length === 0) {
                console.warn(`⚠️  No sizes found for product ${product.id}`);
                continue;
            }

            // Create inventory for each size
            for (const size of sizes) {
                const stockLevel = DEFAULT_STOCK_LEVELS[size] || 10;
                
                transactions.push(
                    db.tx.inventory[db.id()].update({
                        productId: product.id,
                        size: size.toString(),
                        stockLevel: stockLevel,
                        reserved: 0,
                        available: stockLevel,
                    })
                );

                inventoryCount++;
            }
        }

        // Execute all transactions
        if (transactions.length > 0) {
            console.log(`🔄 Inserting ${inventoryCount} inventory records...`);
            await db.transact(transactions);
            console.log(`✅ Successfully seeded ${inventoryCount} inventory records!`);
        } else {
            console.log("⚠️  No inventory records to create");
        }

        console.log("\n📊 Inventory Summary:");
        console.log(`   Products processed: ${products.length}`);
        console.log(`   Inventory records created: ${inventoryCount}`);
        console.log("\n✨ Inventory seeding complete!");

    } catch (error) {
        console.error("❌ Error seeding inventory:", error);
        process.exit(1);
    }
}

// Run the seed function
seedInventory();

