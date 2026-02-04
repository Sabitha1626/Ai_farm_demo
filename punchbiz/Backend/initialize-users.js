const mongoose = require('mongoose');
const schemas = require('./models/TenantSchemas');

const ATLAS_BASE_URI = 'mongodb+srv://naveenraj69205_db_user:KRq06YqGq5qilxS8@cluster0.sjh3hqm.mongodb.net';
const MAIN_DB_URI = `${ATLAS_BASE_URI}/AI_FARM_users?retryWrites=true&w=majority&appName=Cluster0`;

async function initializeAllUsers() {
    let mainConn;
    try {
        console.log('Connecting to Main Database (AI_FARM_users)...');
        mainConn = await mongoose.createConnection(MAIN_DB_URI).asPromise();
        const User = mainConn.model('User', new mongoose.Schema({
            tenantDbName: String,
            fullName: String
        }));

        const users = await User.find({});
        console.log(`Found ${users.length} users to initialize.`);

        for (const user of users) {
            const dbName = user.tenantDbName || `AI_FARM_user_${user._id}`;
            console.log(`\nInitializing Database for: ${user.fullName} (${dbName})`);

            const tenantUri = `${ATLAS_BASE_URI}/${dbName}?retryWrites=true&w=majority&appName=Cluster0`;
            const tenantConn = await mongoose.createConnection(tenantUri).asPromise();

            for (const modelName of Object.keys(schemas)) {
                const collectionName = mongoose.pluralize() ? mongoose.pluralize()(modelName) : `${modelName.toLowerCase()}s`;
                console.log(`  Ensuring collection: ${collectionName}`);
                await tenantConn.db.createCollection(collectionName).catch(() => {
                    // Ignore error if collection already exists
                });
            }

            await tenantConn.close();
            console.log(`  Done.`);
        }

        console.log('\n--- ALL USER DATABASES INITIALIZED ---');
    } catch (err) {
        console.error('Initialization failed:', err);
    } finally {
        if (mainConn) await mainConn.close();
        process.exit(0);
    }
}

initializeAllUsers();
