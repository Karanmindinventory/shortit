const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../db/models");
const { JWT_SECRET } = require("../middleware/auth");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;

const isValidEmail = (email) => {
    return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
};

const isValidPassword = (password) => {
    return typeof password === 'string' && PASSWORD_REGEX.test(password);
};

const registerUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const cleanEmail = email.toLowerCase().trim();
        if (!isValidEmail(cleanEmail)) {
            return res.status(400).json({ error: "Please enter a valid email address" });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({
                error: "Password must be at least 6 characters long and contain both letters and numbers"
            });
        }

        const existingUser = await User.findOne({ where: { email: cleanEmail } });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email: cleanEmail, password: hashedPassword });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const cleanEmail = email.toLowerCase().trim();
        if (!isValidEmail(cleanEmail)) {
            return res.status(400).json({ error: "Please enter a valid email address" });
        }

        const user = await User.findOne({ where: { email: cleanEmail } });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({ token, user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    registerUser,
    loginUser
};
