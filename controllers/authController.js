const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate university domain
        if (!email || !email.endsWith("@student.westminster.ac.uk")) {
            return res.status(400).json({
                message: "Only @student.westminster.ac.uk email addresses are allowed.",
            });
        }

        // Check for duplicate email
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                message: "An account with this email already exists.",
            });
        }

        // Hash password and create user
        const password_hash = await bcrypt.hash(password, 10);
        const newUser = await User.create({ email, password_hash });

        return res.status(201).json({
            message: "User registered successfully.",
            user: { id: newUser.id, email: newUser.email },
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        return res.status(200).json({
            message: "Login successful.",
            token,
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = { register, login };
