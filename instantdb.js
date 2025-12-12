const { init } = require("@instantdb/admin");

const appId = process.env.INSTANTDB_APP_ID;
const adminToken = process.env.INSTANTDB_ADMIN_TOKEN;

let db = null;

if (appId && adminToken) {
    db = init({
        appId,
        adminToken,
    });
} else {
    console.warn(
        "InstantDB not configured: set INSTANTDB_APP_ID and INSTANTDB_ADMIN_TOKEN"
    );
}

module.exports = {
    db,
    isConfigured: Boolean(db),
};

