const mongoose = require('mongoose');
require('dotenv').config();

async function renameMainDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/AI_FARM');
        console.log('Connected to MongoDB');


        const newDbName = 'AI_FARM_users';

        const oldDb = mongoose.connection.client.db(oldDbName);
        const newDb = mongoose.connection.client.db(newDbName);

        console.log(`Copying database: ${oldDbName} -> ${newDbName}`);

        // Get all collections from the old database
        const collections = await oldDb.listCollections().toArray();
        console.log(`Found ${collections.length} collections to copy`);

        for (const collInfo of collections) {
            const collName = collInfo.name;
            console.log(`  Copying collection: ${collName}`);

            const docs = await oldDb.collection(collName).find({}).toArray();

            if (docs.length > 0) {
                await newDb.collection(collName).insertMany(docs);
                console.log(`    Copied ${docs.length} documents`);
            } else {
                // Create empty collection to preserve schema
                await newDb.createCollection(collName);
                console.log(`    Created empty collection`);
            }
        }

        console.log(`\nSuccessfully copied all data to ${newDbName}`);
        console.log(`\nIMPORTANT: Update your .env file to use the new database name:`);
        console.log(`MONGO_URI=mongodb://127.0.0.1:27017/${newDbName}`);
        console.log(`\nAfter updating .env, you can drop the old database by running:`);
        console.log(`node -e "const m=require('mongoose');m.connect('mongodb://127.0.0.1:27017/punchbiz').then(()=>m.connection.db.dropDatabase()).then(()=>console.log('Old DB dropped')).then(()=>process.exit(0))"`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

renameMainDatabase();
