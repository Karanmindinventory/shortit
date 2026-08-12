const { insertUrl, getUrl } = require("../db/shardingManager");
const { encryptorFunction, decryptFunction } = require("../encryptor/encryptorFunction");

async function shortenUrl(req, res) {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }
        const { table_id, id } = await insertUrl(url);
        const shortCode = encryptorFunction(table_id, id);

        res.json({
            original_url: url,
            short_url: `http://${req.headers.host}/${shortCode}`,
            code: shortCode
        });
    } catch (error) {
        console.error("Error shortening URL:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function redirectUrl(req, res) {
    try {
        const { code } = req.params;
        const { table_id, id } = decryptFunction(code);

        if (!table_id || !id || table_id === 'undefined') {
            return res.status(400).json({ error: "Invalid short code" });
        }

        const originalUrl = await getUrl(table_id, id);

        if (originalUrl) {
            return res.redirect(originalUrl);
        } else {
            return res.status(404).json({ error: "URL not found" });
        }
    } catch (error) {
        console.error("Error redirecting URL:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = {
    shortenUrl,
    redirectUrl
};
