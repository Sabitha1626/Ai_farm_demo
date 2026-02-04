const mongoose = require('mongoose');
const schemas = require('../models/TenantSchemas');

const connections = {};

/**
 * Get or create a connection for a specific tenant (user)
 */
const getTenantConnection = async (userId) => {
    const idStr = userId.toString();

    if (connections[idStr]) {
        return connections[idStr];
    }

    // Use a promise-based cache to avoid race conditions
    if (connections[idStr] instanceof Promise) {
        return await connections[idStr];
    }

    connections[idStr] = (async () => {
        try {
            // Initialize User model if not already done
            const User = require('../models/User');
            const user = await User.findById(idStr);

            // Determine database name: use tenantDbName if set, else fallback to old ID-based name
            const dbIdentifier = (user && user.tenantDbName) ? user.tenantDbName : `AI_FARM_user_${idStr}`;
            const dbName = dbIdentifier.startsWith('AI_FARM_user_') ? dbIdentifier : `AI_FARM_user_${dbIdentifier}`;

            // Extract base URI (host and port) from MONGO_URI
            const url = new URL(process.env.MONGO_URI);
            url.pathname = `/${dbName}`;
            const uri = url.toString();

            console.log(`[Multi-Tenant] Connecting to: ${uri.replace(/:([^:@]+)@/, ':****@')}`); // log URI with hidden password

            const conn = await mongoose.createConnection(uri).asPromise();
            console.log(`[Multi-Tenant] Successfully connected to ${dbName}`);

            // Register all schemas on this connection
            for (const modelName of Object.keys(schemas)) {
                conn.model(modelName, schemas[modelName]);

                // Force collection creation so it shows up in GUI tools even if empty
                const collectionName = mongoose.pluralize() ? mongoose.pluralize()(modelName) : `${modelName.toLowerCase()}s`;
                await conn.db.createCollection(collectionName).catch(() => { }); // Ignore if already exists
            }

            connections[idStr] = conn;
            return conn;
        } catch (err) {
            console.error(`[Multi-Tenant] Connection Error for user ${idStr}:`, err);
            delete connections[idStr]; // Remove failed promise from cache
            throw err;
        }
    })();

    return await connections[idStr];
};

module.exports = {
    getTenantConnection
};
