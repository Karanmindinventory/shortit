const express = require('express');
const cluster = require('cluster');
const { initializeShards } = require('./db/shardingManager');
const { sequelizeConnection } = require('./db/config');
const { shortenUrl, redirectUrl } = require('./controllers/urlController');
const { registerUser, loginUser } = require('./controllers/authController');
const { requireAuth } = require('./middleware/auth');
const { syncModels } = require('./db/models');

const PORT = process.env.PORT || 3000;
const NUM_WORKERS = 2;

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
            const app = express();
            app.use(express.json());

            app.post('/register', registerUser);
            app.post('/login', loginUser);

            app.post('/shorten', requireAuth, shortenUrl);
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