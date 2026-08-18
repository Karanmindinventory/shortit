require('dotenv').config();
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "HERE_IM_G0NNA_STORE_SUPER_SECRET_KEY_DONT_STALL_IT_GONNA_FALL";

const authenticate = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
        return next();
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

const requireAuth = (req, res, next) => {
    authenticate(req, res, () => {
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }
        next();
    });
};

module.exports = {
    authenticate,
    requireAuth,
    JWT_SECRET
};
