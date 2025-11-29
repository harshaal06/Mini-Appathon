const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
    try {
        let mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-auction';

        try {
            await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
            console.log('MongoDB Connected (Local)');
        } catch (localErr) {
            console.log('Local MongoDB not found, starting in-memory instance...');
            const mongod = await MongoMemoryServer.create();
            mongoUri = mongod.getUri();
            await mongoose.connect(mongoUri);
            console.log(`MongoDB Connected (In-Memory): ${mongoUri}`);
        }

    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
