const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User, LoginLog, Session, CsrfToken, Profile } = require("../models");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../lib/emailService");
const { createTargetedCsrfToken } = require("../lib/csrfMiddleware");
const { Op } = require("sequelize");

// function for registering a new user
const register = async (req, res) => {
    try {
        const { email, password, role, company_name, first_name, last_name } = req.body;

        const assignedRole = role === 'sponsor' ? 'sponsor' : 'alumni';

        if (assignedRole === 'sponsor' && !company_name) {
            return res.status(400).json({ success: false, error: 'MISSING_COMPANY', message: "Company name is required for sponsors." });
        }

        if (assignedRole === 'alumni' && (!first_name || !last_name)) {
            return res.status(400).json({ success: false, error: 'MISSING_NAME', message: "First name and last name are required for alumni." });
        }

        // check if email already exists in db
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'DUPLICATE_EMAIL',
                message: "An account with this email already exists.",
            });
        }

        // hash password with bcrypt
        const password_hash = await bcrypt.hash(password, 10);

        // make a token for verifying email
        const verification_token = crypto.randomBytes(32).toString("hex");

        // save user to database
        const newUser = await User.create({
            email,
            password_hash,
            verification_token,
            verification_token_expiry: Date.now() + 24 * 60 * 60 * 1000,
            is_verified: false,
            role: assignedRole,
            company_name: assignedRole === 'sponsor' ? company_name : null
        });

        // Create empty profile with names for alumni
        if (assignedRole === 'alumni') {
            await Profile.create({
                UserId: newUser.id,
                first_name,
                last_name
            });
        }

        // send email to the user
        await sendVerificationEmail(email, verification_token);

        return res.status(201).json({
            success: true,
            message: "User registered successfully. Please check your email to verify your account.",
            data: { user: { id: newUser.id, email: newUser.email } },
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Internal server error." });
    }
};

// verify user email with the token
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ success: false, error: 'MISSING_TOKEN', message: "Verification token is required." });
        }

        // find user by token
        const user = await User.findOne({ where: { verification_token: token } });
        if (!user) {
            return res.status(400).json({ success: false, error: 'INVALID_TOKEN', message: "Invalid or expired verification token." });
        }

        // check if token is too old
        if (user.verification_token_expiry && Date.now() > new Date(user.verification_token_expiry).getTime()) {
            return res.status(400).json({ success: false, error: 'TOKEN_EXPIRED', message: "Verification token has expired. Please register again." });
        }

        // mark user as verified and clear tokens
        user.is_verified = true;
        user.verification_token = null;
        user.verification_token_expiry = null;
        await user.save();

        return res.status(200).json({ success: true, message: "Email verified successfully. You can now log in." });
    } catch (error) {
        console.error("Email verification error:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Internal server error." });
    }
};

// Handle login, check credentials, and set the JWT cookie
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Look up the user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, error: 'INVALID_CREDENTIALS', message: "Invalid email or password." });
        }

        // Clean up any old sessions or CSRF tokens for this user/IP
        await Session.destroy({
            where: {
                UserId: user.id,
                expires_at: { [Op.lt]: new Date() }
            }
        });

        await CsrfToken.destroy({
            where: {
                [Op.or]: [
                    { UserId: user.id },
                    { ip_address: req.ip || req.connection.remoteAddress }
                ]
            }
        });

        // Users must verify their email before they can log in
        if (!user.is_verified) {
            return res.status(401).json({
                success: false,
                error: 'EMAIL_UNVERIFIED',
                message: "Please verify your email address before logging in.",
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'INVALID_CREDENTIALS', message: "Invalid email or password." });
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

        // Create a new session in the database
        await Session.create({
            token,
            UserId: user.id,
            expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.headers["user-agent"] || "Unknown",
        });

        // Refresh the CSRF token for the new session
        const newCsrfToken = await createTargetedCsrfToken(req);

        // Set secure httpOnly cookie (Session management)
        res.cookie("jwt", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Secure only in production
            sameSite: "strict", // Helps prevent CSRF attacks
            maxAge: 60 * 60 * 1000, // 1 hour
            path: "/" // Make sure it's accessible across the whole site
        });

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            data: {
                user: { id: user.id, email: user.email, role: user.role },
                csrfToken: newCsrfToken
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Internal server error." });
    }
};

// Handle forgot password requests by sending a reset link
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            // Standard security message so we don't leak which emails are registered
            return res.status(200).json({ success: true, message: "If an account exists with that email, a reset link has been sent." });
        }

        // Generate a secure reset token that lasts for 1 hour
        const reset_token = crypto.randomBytes(32).toString("hex");
        const reset_token_expiry = Date.now() + 3600000; // 1 hour

        user.reset_token = reset_token;
        user.reset_token_expiry = reset_token_expiry;
        await user.save();

        // Send real reset email
        await sendPasswordResetEmail(email, reset_token);

        return res.status(200).json({ success: true, message: "If an account exists with that email, a reset link has been sent." });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Internal server error." });
    }
};

// Reset the password using the token from the email
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Note: Field presence and password strength are now handled by resetPasswordValidation middleware.

        // Find user by token and ensure it hasn't expired
        const user = await User.findOne({
            where: {
                reset_token: token,
                reset_token_expiry: { [Op.gt]: Date.now() }
            }
        });

        if (!user) {
            return res.status(400).json({ success: false, error: 'INVALID_TOKEN', message: "Invalid or expired reset token." });
        }

        // Update password and clear reset fields
        user.password_hash = await bcrypt.hash(newPassword, 10);
        user.reset_token = null;
        user.reset_token_expiry = null;
        await user.save();

        // Destroy all active sessions for this user (force logout everywhere)
        await Session.destroy({ where: { UserId: user.id } });

        return res.status(200).json({ success: true, message: "Password reset successful. All active sessions have been terminated. Please log in with your new password." });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Internal server error." });
    }
};

// Log the user out, clear cookies, and delete the session
const logout = async (req, res) => {
    try {
        const token = req.cookies.jwt;
        
        // Clear the cookie first regardless
        res.clearCookie("jwt", { path: "/" });

        if (token) {
            // Delete this specific session from the database
            await Session.destroy({ where: { token } });
        }

        // Also clear any CSRF tokens tied to this user/IP to prevent session fixation or leftovers
        await CsrfToken.destroy({
            where: {
                [Op.or]: [
                    { ip_address: req.ip || req.connection.remoteAddress }
                ]
            }
        });

        // Check if we should redirect or send JSON
        if (req.method === 'GET') {
            return res.redirect("/login");
        }

        // Rotate CSRF Token for the next session if it's an API call
        const newCsrfToken = await createTargetedCsrfToken(req);

        return res.status(200).json({ 
            success: true,
            message: "Logged out successfully.",
            data: { csrfToken: newCsrfToken }
        });
    } catch (error) {
        console.error("Logout error:", error);
        if (req.method === 'GET') {
            return res.redirect("/login");
        }
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Internal server error." });
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
