require('dotenv').config();
const express = require('express');
const cluster = require('cluster');
const { initializeShards } = require('./db/shardingManager');
const { sequelizeConnection } = require('./db/config');
const { shortenUrl, redirectUrl, getUserUrls, updateUserUrl, removeUserUrl, deleteUserUrl, getAnalytics } = require('./controllers/urlController');
const { registerUser, loginUser } = require('./controllers/authController');
const { connectMongo } = require('./db/mongoConfig');
const cors = require('cors');
const { requireAuth } = require('./middleware/auth');
const { syncModels } = require('./db/models');

const PORT = process.env.PORT || 3000;
const NUM_WORKERS = parseInt(process.env.NUM_WORKERS || '2', 10);

const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : ['http://localhost:3001', 'http://localhost:3000'];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (
            process.env.CORS_ORIGIN === '*' ||
            allowedOrigins.includes('*') ||
            allowedOrigins.includes(origin) ||
            /\.vercel\.app$/i.test(new URL(origin).hostname) ||
            /\.netlify\.app$/i.test(new URL(origin).hostname)
        ) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true
};

async function startServer() {
    try {
        if (cluster.isPrimary) {
            await sequelizeConnection.authenticate();
            console.log("SQL IS CONNECTED SUCCESSFULLY");

            await syncModels();
            console.log("Auth models synchronized");

            await initializeShards();
            console.log("Sharding metadata and tables initialized");

            console.log(`Primary ${process.pid} is running. Forking ${NUM_WORKERS} workers...`);

            for (let i = 0; i < NUM_WORKERS; i++) {
                cluster.fork();
            }

            cluster.on('exit', (worker, code, signal) => {
                console.log(`Worker ${worker.process.pid} died. Forking a new one...`);
                cluster.fork();
            });
        } else {
            await connectMongo();

            const app = express();
            app.use(cors(corsOptions));
            app.use(express.json());

            app.post('/register', registerUser);
            app.post('/login', loginUser);

            app.post('/shorten', requireAuth, shortenUrl);
            app.get('/urls', requireAuth, getUserUrls);
            app.put('/urls/:id', requireAuth, updateUserUrl);
            app.delete('/urls/:id/remove', requireAuth, removeUserUrl);
            app.delete('/urls/:id/delete', requireAuth, deleteUserUrl);
            app.get('/analytics/:code', requireAuth, getAnalytics);
            app.get('/:code', redirectUrl);

            app.listen(PORT, () => {
                console.log(`Worker ${process.pid} started and listening on http://localhost:${PORT}`);
            });
        }
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();