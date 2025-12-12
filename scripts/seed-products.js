require("dotenv").config();

const { init, tx } = require("@instantdb/admin");
const { v4: uuidv4 } = require("uuid");
const { PRODUCTS } = require("../products");

const appId = process.env.INSTANTDB_APP_ID;
const adminToken = process.env.INSTANTDB_ADMIN_TOKEN;

if (!appId || !adminToken) {
    console.error("Missing INSTANTDB_APP_ID or INSTANTDB_ADMIN_TOKEN in env");
    process.exit(1);
}

const db = init({
    appId,
    adminToken,
});

async function seed() {
    console.log(`Seeding ${PRODUCTS.length} products to InstantDB...`);
    for (const product of PRODUCTS) {
        // Generate UUID for InstantDB (required format)
        const productId = uuidv4();
        const payload = {
            name: product.name,
            brand: product.brand,
            price: product.price,
            images: JSON.stringify(product.images), // Convert array to JSON string
            sizes: JSON.stringify(product.sizes), // Convert array to JSON string
            description: product.description,
            tags: JSON.stringify(product.tags || []), // Convert array to JSON string
            active: true,
            // Preserve numeric id as a field for easier reference
            legacyId: product.id,
        };

        try {
            await db.transact(tx.products[productId].update(payload));
            console.log(`✓ upserted product ${productId} (${product.name})`);
        } catch (err) {
            console.error(`✗ failed product ${productId}:`, err);
        }
    }
    console.log("Done seeding products.");
}

seed();

