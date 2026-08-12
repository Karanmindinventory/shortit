const express = require('express');
const { initializeShards } = require('./db/shardingManager');
const { sequelizeConnection } = require('./db/config');
const { shortenUrl, redirectUrl } = require('./controllers/urlController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/shorten', shortenUrl);
app.get('/:code', redirectUrl);

async function startServer() {
    try {
        await sequelizeConnection.authenticate();
        console.log("SQL IS CONNECTED SUCCESSFULLY");

        await initializeShards();
        console.log("Sharding metadata and tables initialized");

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();