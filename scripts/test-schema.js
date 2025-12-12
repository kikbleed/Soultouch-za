require("dotenv").config();

const { init } = require("@instantdb/admin");

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

// Try to create a test product to see if schema exists
async function testSchema() {
    try {
        // Try to query products to see if schema exists
        const { data, error } = await db.query({
            products: {},
        });
        
        if (error) {
            console.log("Schema might not exist yet. Error:", error.message);
            console.log("You may need to push the schema first using: npx instant-cli push schema");
        } else {
            console.log("Schema exists! Found", data?.products?.length || 0, "products");
        }
    } catch (err) {
        console.error("Error testing schema:", err);
    }
}

testSchema();

