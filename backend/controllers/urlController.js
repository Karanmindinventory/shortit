const { insertUrl, getUrl } = require("../db/shardingManager");
const { encryptorFunction, decryptFunction } = require("../encryptor/encryptorFunction");
const { Metadata } = require("../db/models");
const useragent = require("express-useragent");
const { getAnalyticsModel } = require("../db/mongoConfig");

async function shortenUrl(req, res) {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }
        const { table_id, id } = await insertUrl(url);
        const shortCode = encryptorFunction(table_id, id);

        if (req.user && req.user.id) {
            await Metadata.create({
                user_id: req.user.id,
                short_code: shortCode,
                original_url: url
            });
        }

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
    const startTime = performance.now();
    try {
        const { code } = req.params;
        const { table_id, id } = decryptFunction(code);

        if (!table_id || !id || table_id === 'undefined') {
            return res.status(400).json({ error: "Invalid short code" });
        }

        const originalUrl = await getUrl(table_id, id);

        if (originalUrl) {
            res.redirect(originalUrl);
            const endTime = performance.now();

            setImmediate(async () => {
                try {
                    const latency_ms = endTime - startTime;
                    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

                    const uaString = req.headers['user-agent'] || '';
                    const parsedUa = useragent.default ? useragent.default.parse(uaString) : (useragent.parse ? useragent.parse(uaString) : null);
                    const browser = parsedUa ? parsedUa.browser : "Unknown";

                    const AnalyticsModel = getAnalyticsModel(table_id);
                    await AnalyticsModel.create({
                        code: code,
                        ip: ip,
                        browser: browser,
                        latency_ms: latency_ms
                    });
                } catch (trackError) {
                    console.error("Async Tracking Error:", trackError);
                }
            });

        } else {
            return res.status(404).json({ error: "URL not found" });
        }
    } catch (error) {
        console.error("Error redirecting URL:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function getUserUrls(req, res) {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const urls = await Metadata.findAll({
            where: { user_id: req.user.id },
            order: [['createdAt', 'DESC']]
        });

        res.json(urls);
    } catch (error) {
        console.error("Error fetching user URLs:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function getAnalytics(req, res) {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { code } = req.params;
        const { table_id } = decryptFunction(code);
        const AnalyticsModel = getAnalyticsModel(table_id);

        const stats = await AnalyticsModel.aggregate([
            { $match: { code: code } },
            {
                $group: {
                    _id: null,
                    totalClicks: { $sum: 1 },
                    avgLatency: { $avg: "$latency_ms" },
                    browsers: { $push: "$browser" }
                }
            }
        ]);

        if (stats.length === 0) {
            return res.json({ totalClicks: 0, avgLatency: 0, browserStats: [] });
        }

        const data = stats[0];

        const browserCounts = {};
        data.browsers.forEach(b => {
            browserCounts[b] = (browserCounts[b] || 0) + 1;
        });
        const browserStats = Object.keys(browserCounts).map(b => ({
            name: b,
            percentage: ((browserCounts[b] / data.totalClicks) * 100).toFixed(1)
        }));

        res.json({
            totalClicks: data.totalClicks,
            avgLatency: data.avgLatency ? data.avgLatency.toFixed(2) : 0,
            browserStats
        });

    } catch (error) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = {
    shortenUrl,
    redirectUrl,
    getUserUrls,
    getAnalytics
};
