require('dotenv').config();
const mongoose = require('mongoose');

const connectMongo = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }
        await mongoose.connect(mongoUri);
        console.log("MongoDB IS CONNECTED SUCCESSFULLY");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
};

const analyticsSchema = new mongoose.Schema({
    code: { type: String, required: true },
    ip: String,
    browser: String,
    latency_ms: Number,
    createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

const modelsCache = {};

function getAnalyticsModel(table_id) {
    if (modelsCache[table_id]) {
        return modelsCache[table_id];
    }

    // Create model dynamically for the specific table/shard
    const model = mongoose.model(`Analytics_${table_id}`, analyticsSchema, table_id);
    modelsCache[table_id] = model;
    return model;
}

module.exports = {
    connectMongo,
    getAnalyticsModel
};
