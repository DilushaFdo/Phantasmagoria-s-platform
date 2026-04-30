const crypto = require("crypto");
const { CsrfToken, User } = require("../models");

// Guard against CSRF attacks on POST/PUT/DELETE requests

// Tokens expire in 2 hours
const TOKEN_TTL = 2 * 60 * 60 * 1000;

const jwt = require("jsonwebtoken");

// Helper to make a new CSRF token
const createTargetedCsrfToken = async (req) => {
    const token = crypto.randomBytes(32).toString("hex");
    const expires_at = new Date(Date.now() + TOKEN_TTL);
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.headers["user-agent"] || "Unknown";

    // Try to identify the user from their JWT session cookie
    let UserId = null;
    const jwtToken = req.cookies.jwt;
    if (jwtToken) {
        try {
            const decodedToken = jwt.verify(jwtToken, process.env.JWT_SECRET);
            // Verify the user actually exists in the DB to avoid foreign key errors
            const userExists = await User.findByPk(decodedToken.id);
            if (userExists) {
                UserId = decodedToken.id;
            }
        } catch (err) {
            // If token is invalid or user doesn't exist, we just don't tie it to a user
        }
    }

    await CsrfToken.create({ 
        token, 
        expires_at,
        ip_address,
        user_agent,
        UserId
    });

    return token;
};

// API endpoint to get a fresh CSRF token
const generateCsrfToken = async (req, res) => {
    try {
        const token = await createTargetedCsrfToken(req);

        return res.status(200).json({ success: true, data: { csrfToken: token } });
    } catch (error) {
        console.error("Error generating CSRF token:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Failed to generate CSRF token." });
    }
};

// Middleware to validate the token on state-changing requests
const validateCsrfToken = async (req, res, next) => {
    // Skip validation for safe HTTP methods
    const safeMethods = ["GET", "HEAD", "OPTIONS"];
    if (safeMethods.includes(req.method)) {
        return next();
    }

    const token = req.headers["x-csrf-token"];
    
    if (!token) {
        return res.status(403).json({ success: false, error: 'MISSING_CSRF', message: "CSRF token missing. Include X-CSRF-TOKEN header." });
    }

    try {
        const storedToken = await CsrfToken.findByPk(token);

        if (!storedToken) {
            return res.status(403).json({ success: false, error: 'INVALID_CSRF', message: "Invalid CSRF token." });
        }

        // Check if it's expired
        if (new Date() > new Date(storedToken.expires_at)) {
            await CsrfToken.destroy({ where: { token } });
            return res.status(403).json({ success: false, error: 'EXPIRED_CSRF', message: "CSRF token expired. Request a new one." });
        }

        // Check if the IP address matches
        const currentIp = req.ip || req.connection.remoteAddress;
        if (storedToken.ip_address !== currentIp) {
            console.warn(`[Security Alert] CSRF IP mismatch for token ${token.substring(0, 8)}. Expected ${storedToken.ip_address}, got ${currentIp}`);
            return res.status(403).json({ success: false, error: 'IP_MISMATCH', message: "Unauthorized CSRF source. Tokens cannot be shared across different networks." });
        }

        // Check if the User ID matches if it was tied to one
        const jwtToken = req.cookies.jwt;
        let currentUserId = null;
        if (jwtToken) {
            try {
                const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
                currentUserId = decoded.id;
            } catch (e) {}
        }

        // If the token was for a specific user, make sure it's the same person
        if (storedToken.UserId && storedToken.UserId !== currentUserId) {
            console.warn(`[Security Alert] CSRF User mismatch for token ${token.substring(0, 8)}. Expected User ${storedToken.UserId}, got User ${currentUserId}`);
            return res.status(403).json({ success: false, error: 'USER_MISMATCH', message: "CSRF token mismatch. The token does not belong to the current session." });
        }

        // Token is valid and identity verified — proceed
        next();
    } catch (error) {
        console.error("Error validating CSRF token:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Internal server error during CSRF validation." });
    }
};



module.exports = { generateCsrfToken, validateCsrfToken, createTargetedCsrfToken };
