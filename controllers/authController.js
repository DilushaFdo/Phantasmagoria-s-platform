const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User, LoginLog, Session } = require("../models");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../lib/emailService");
const { Op } = require("sequelize");

// Function to check if the password is strong enough (12+ chars, mixed case, numbers, special characters)
const isPasswordStrong = (password) => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    return strongPasswordRegex.test(password);
};

// Registration controller: hashes password and sends verification email
const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate the Westminster university domain (Mandatory requirement)
        if (!email || !email.endsWith("@my.westminster.ac.uk")) {
            return res.status(400).json({
                message: "Only @my.westminster.ac.uk email addresses are allowed.",
            });
        }

        // Check if the password meets our security rules
        if (!password || !isPasswordStrong(password)) {
            return res.status(400).json({
                message: "Password must be at least 12 characters long and include uppercase, lowercase, a number, and a special character.",
            });
        }

        // 3. Check for duplicate email
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                message: "An account with this email already exists.",
            });
        }

        // Hash the password using Bcrypt as required
        const password_hash = await bcrypt.hash(password, 10);

        // 4. Generate a secure 64-character verification token
        const verification_token = crypto.randomBytes(32).toString("hex");

        // 5. Create user in database (Unverified by default, token expires in 24 hours)
        const newUser = await User.create({
            email,
            password_hash,
            verification_token,
            verification_token_expiry: Date.now() + 24 * 60 * 60 * 1000,
            is_verified: false
        });

        // 6. Send Real Verification Email
        await sendVerificationEmail(email, verification_token);

        return res.status(201).json({
            message: "User registered successfully. Please check your email to verify your account.",
            user: { id: newUser.id, email: newUser.email },
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// Verifies the user's email using the token sent in the link
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: "Verification token is required." });
        }

        // Find user by verification token
        const user = await User.findOne({ where: { verification_token: token } });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired verification token." });
        }

        // Check if the verification token has expired (24-hour window)
        if (user.verification_token_expiry && Date.now() > new Date(user.verification_token_expiry).getTime()) {
            return res.status(400).json({ message: "Verification token has expired. Please register again." });
        }

        // Update user status
        user.is_verified = true;
        user.verification_token = null;
        user.verification_token_expiry = null;
        await user.save();

        return res.status(200).json({ message: "Email verified successfully. You can now log in." });
    } catch (error) {
        console.error("Email verification error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// Login controller: checks credentials and gives a JWT cookie if verified
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        // 2. Just-in-time cleanup of already expired sessions for this user
        await Session.destroy({
            where: {
                UserId: user.id,
                expires_at: { [Op.lt]: new Date() }
            }
        });

        // Users must verify their email before they can log in
        if (!user.is_verified) {
            return res.status(401).json({
                message: "Please verify your email address before logging in.",
            });
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

        // Log the successful login event
        await LoginLog.create({
            UserId: user.id,
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.headers["user-agent"] || "Unknown",
        });

        // Store the session in the database (server-side session management)
        await Session.create({
            token,
            UserId: user.id,
            expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.headers["user-agent"] || "Unknown",
        });

        // Set secure httpOnly cookie (Session management)
        res.cookie("jwt", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Secure only in production
            sameSite: "strict", // MITIGATES CSRF
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        return res.status(200).json({
            message: "Login successful.",
            user: { id: user.id, email: user.email }
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// Forgot password: sends a reset link to the email if it exists
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            // Standard security message so we don't leak which emails are registered
            return res.status(200).json({ message: "If an account exists with that email, a reset link has been sent." });
        }

        // Generate secure reset token and 1-hour expiry
        const reset_token = crypto.randomBytes(32).toString("hex");
        const reset_token_expiry = Date.now() + 3600000; // 1 hour

        user.reset_token = reset_token;
        user.reset_token_expiry = reset_token_expiry;
        await user.save();

        // Send real reset email
        await sendPasswordResetEmail(email, reset_token);

        return res.status(200).json({ message: "If an account exists with that email, a reset link has been sent." });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// Reset password: uses the token from the email to set a new password
const resetPassword = async (req, res) => {
    try {
        const { token } = req.query;
        const { newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token and new password are required." });
        }

        // Find user by token and ensure it hasn't expired
        const user = await User.findOne({
            where: {
                reset_token: token,
                reset_token_expiry: { [Op.gt]: Date.now() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token." });
        }

        // Make sure the new password is also strong
        if (!newPassword || !isPasswordStrong(newPassword)) {
            return res.status(400).json({
                message: "New password must be at least 12 characters long and include uppercase, lowercase, a number, and a special character.",
            });
        }

        // Update password and clear reset fields
        user.password_hash = await bcrypt.hash(newPassword, 10);
        user.reset_token = null;
        user.reset_token_expiry = null;
        await user.save();

        // Destroy all active sessions for this user (force logout everywhere)
        await Session.destroy({ where: { UserId: user.id } });

        return res.status(200).json({ message: "Password reset successful. All active sessions have been terminated. Please log in with your new password." });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// Logout: clears the cookie and removes the session from the DB
const logout = async (req, res) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No active session." });
        }
        
        // Clear the cookie
        res.clearCookie("jwt");
        
        // Delete this specific session from the database
        const destroyed = await Session.destroy({ where: { token } });

        if (destroyed) {
            return res.status(200).json({ message: "Logged out successfully. Session has been terminated." });
        } else {
            return res.status(401).json({ message: "Unauthorized: Session already terminated or invalid." });
        }
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = {
    register,
    verifyEmail,
    login,
    forgotPassword,
    resetPassword,
    logout
};
