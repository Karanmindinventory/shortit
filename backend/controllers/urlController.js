const { insertUrl, getUrl, updateUrl, deleteUrl } = require("../db/shardingManager");
const { encryptorFunction, decryptFunction } = require("../encryptor/encryptorFunction");
const { Metadata } = require("../db/models");
const useragent = require("express-useragent");
const { getAnalyticsModel } = require("../db/mongoConfig");

function validateAndNormalizeUrl(input) {
    if (!input || typeof input !== 'string' || !input.trim()) {
        return null;
    }
    let trimmed = input.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
        trimmed = 'http://' + trimmed;
    }
    try {
        const parsed = new URL(trimmed);
        if (parsed.hostname && parsed.hostname.includes('.') && parsed.hostname.length > 3) {
            return parsed.toString();
        }
    } catch (_) {}
    return null;
}

async function shortenUrl(req, res) {
    try {
        const { url } = req.body;
        const normalizedUrl = validateAndNormalizeUrl(url);
        if (!normalizedUrl) {
            return res.status(400).json({ error: "Invalid URL format. Please enter a valid URL (e.g. https://example.com)." });
        }
        const { table_id, id } = await insertUrl(normalizedUrl);
        const shortCode = encryptorFunction(table_id, id);

        if (req.user && req.user.id) {
            await Metadata.create({
                user_id: req.user.id,
                short_code: shortCode,
                original_url: normalizedUrl
            });
        }

        res.json({
            original_url: normalizedUrl,
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

async function updateUserUrl(req, res) {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { id } = req.params;
        const { original_url } = req.body;

        const normalizedUrl = validateAndNormalizeUrl(original_url);
        if (!normalizedUrl) {
            return res.status(400).json({ error: "Invalid URL format. Please enter a valid URL (e.g. https://example.com)." });
        }

        const urlRecord = await Metadata.findOne({
            where: { id, user_id: req.user.id }
        });

        if (!urlRecord) {
            return res.status(404).json({ error: "URL record not found" });
        }

        await urlRecord.update({ original_url: normalizedUrl });

        const { table_id, id: shardId } = decryptFunction(urlRecord.short_code);
        if (table_id && shardId && table_id !== 'undefined') {
            await updateUrl(table_id, shardId, normalizedUrl);
        }

        res.json(urlRecord);
    } catch (error) {
        console.error("Error updating URL:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function removeUserUrl(req, res) {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { id } = req.params;
        const urlRecord = await Metadata.findOne({
            where: { id, user_id: req.user.id }
        });

        if (!urlRecord) {
            return res.status(404).json({ error: "URL record not found" });
        }

        await urlRecord.destroy();

        res.json({ message: "URL removed from user dashboard" });
    } catch (error) {
        console.error("Error removing URL:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function deleteUserUrl(req, res) {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { id } = req.params;
        const urlRecord = await Metadata.findOne({
            where: { id, user_id: req.user.id }
        });

        if (!urlRecord) {
            return res.status(404).json({ error: "URL record not found" });
        }

        const { table_id, id: shardId } = decryptFunction(urlRecord.short_code);
        if (table_id && shardId && table_id !== 'undefined') {
            await deleteUrl(table_id, shardId);
        }

        await urlRecord.destroy();

        res.json({ message: "URL deleted permanently from both metadata and sharded storage" });
    } catch (error) {
        console.error("Error deleting URL:", error);
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
    updateUserUrl,
    removeUserUrl,
    deleteUserUrl,
    getAnalytics
};
