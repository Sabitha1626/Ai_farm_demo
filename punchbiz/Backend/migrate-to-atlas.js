const mongoose = require('mongoose');

const LOCAL_BASE_URI = 'mongodb://127.0.0.1:27017';
const ATLAS_BASE_URI = 'mongodb+srv://naveenraj69205_db_user:KRq06YqGq5qilxS8@cluster0.sjh3hqm.mongodb.net';

async function migrateDatabase(dbName) {
    let localConn, atlasConn;
    try {
        console.log(`\n--- Migrating Database: ${dbName} ---`);
        localConn = await mongoose.createConnection(`${LOCAL_BASE_URI}/${dbName}`).asPromise();
        atlasConn = await mongoose.createConnection(`${ATLAS_BASE_URI}/${dbName}?retryWrites=true&w=majority&appName=Cluster0`).asPromise();

        const collections = await localConn.db.listCollections().toArray();
        for (const colInfo of collections) {
            const name = colInfo.name;
            if (name.startsWith('system.')) continue;

            console.log(`  Migrating collection: ${name}...`);
            const docs = await localConn.db.collection(name).find({}).toArray();

            if (docs.length > 0) {
                await atlasConn.db.collection(name).deleteMany({});
                await atlasConn.db.collection(name).insertMany(docs);
                console.log(`    Done! Migrated ${docs.length} documents.`);
            } else {
                console.log(`    Skipping (empty).`);
            }
        }
    } catch (err) {
        console.error(`  Migration failed for ${dbName}:`, err);
    } finally {
        if (localConn) await localConn.close();
        if (atlasConn) await atlasConn.close();
    }
}

async function startMigration() {
    let adminConn;
    try {
        console.log('Connecting to Local MongoDB to list databases...');
        adminConn = await mongoose.createConnection(`${LOCAL_BASE_URI}/admin`).asPromise();
        const result = await adminConn.db.admin().listDatabases();

        const dbsToMigrate = result.databases
            .map(db => db.name)
            .filter(name => name === 'AI_FARM_users' || name.startsWith('AI_FARM_user_') || name === 'punchbiz');

        console.log(`Found ${dbsToMigrate.length} databases to migrate: ${dbsToMigrate.join(', ')}`);

        for (const dbName of dbsToMigrate) {
            await migrateDatabase(dbName);
        }

        console.log('\n--- ALL MIGRATIONS COMPLETE ---');
    } catch (err) {
        console.error('Initial discovery failed:', err);
    } finally {
        if (adminConn) await adminConn.close();
        process.exit(0);
    }
}

startMigration();
