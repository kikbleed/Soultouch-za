// Client-side InstantDB setup
// Single DB instance shared across all pages
// No environment variables - hardcoded app ID for browser

console.log("client-db.js loaded");

// App ID for InstantDB
const APP_ID = '7b3c4eaf-7914-416d-9b78-753ca48d2a6a';

let db = null;
let initPromise = null;

// Initialize InstantDB once
async function initDB() {
    if (db) {
        return db;
    }

    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        try {
            console.log('Importing InstantDB from CDN...');
            
            // Import from ESM CDN
            const { init, id, tx } = await import('https://esm.sh/@instantdb/react');
            
            console.log('InstantDB module loaded, initializing...');
            
            if (!init) {
                throw new Error('init function not found in InstantDB module');
            }
            
            // Initialize with app ID
            db = init({ appId: APP_ID });
            
            if (!db) {
                throw new Error('init returned null or undefined');
            }
            
            // Attach helper methods
            db.id = id;
            db.tx = tx;
            
            console.log(`InstantDB initialized successfully with appId: ${APP_ID}`);
            
            // Make db available globally
            window.db = db;
            
            return db;
        } catch (error) {
            console.error('Failed to initialize InstantDB:', error);
            throw error;
        }
    })();

    return initPromise;
}

// Export initialization function
window.initDB = initDB;

// Auto-initialize
initDB().catch(err => {
    console.error('Auto-init failed:', err);
});
