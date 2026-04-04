const crypto = require("crypto");
const { CsrfToken } = require("../models");

// CSRF Protection Middleware
// Required to prevent cross-site request forgery attacks on state-changing requests.

// CSRF token validity duration: 2 hours
const TOKEN_TTL = 2 * 60 * 60 * 1000;

// Creates a new CSRF token and saves it in the DB
const generateCsrfToken = async (req, res) => {
    try {
        const token = crypto.randomBytes(32).toString("hex");
        const expires_at = new Date(Date.now() + TOKEN_TTL);

        await CsrfToken.create({ token, expires_at });

        // Periodically clean expired tokens (asynchronously)
        cleanupExpiredTokens();

        return res.status(200).json({ csrfToken: token });
    } catch (error) {
        console.error("Error generating CSRF token:", error);
        return res.status(500).json({ error: "Failed to generate CSRF token." });
    }
};

// Middleware to check for a valid CSRF token on POST/PUT/DELETE requests
const validateCsrfToken = async (req, res, next) => {
    // Skip validation for safe HTTP methods
    const safeMethods = ["GET", "HEAD", "OPTIONS"];
    if (safeMethods.includes(req.method)) {
        return next();
    }

    // Robust header extraction (handles different casing/formatting)
    const token = req.headers["x-csrf-token"];
    
    if (!token) {
        console.warn(`[CSRF] Missing token for ${req.method} ${req.originalUrl} from ${req.ip}`);
        return res.status(403).json({ error: "CSRF token missing. Include X-CSRF-TOKEN header." });
    }

    try {
        const storedToken = await CsrfToken.findByPk(token);

        if (!storedToken) {
            console.warn(`[CSRF] Invalid token: ${token.substring(0, 8)}...`);
            return res.status(403).json({ error: "Invalid CSRF token." });
        }

        if (new Date() > new Date(storedToken.expires_at)) {
            await CsrfToken.destroy({ where: { token } });
            console.warn(`[CSRF] Expired token: ${token.substring(0, 8)}...`);
            return res.status(403).json({ error: "CSRF token expired. Request a new one." });
        }

        // Token is valid — proceed
        next();
    } catch (error) {
        console.error("Error validating CSRF token:", error);
        return res.status(500).json({ error: "Internal server error during CSRF validation." });
    }
};

// Clean up any old tokens from the database
const cleanupExpiredTokens = async () => {
    try {
        const { Op } = require("sequelize");
        await CsrfToken.destroy({
            where: {
                expires_at: {
                    [Op.lt]: new Date()
                }
            }
        });
    } catch (error) {
        console.error("Error cleaning up expired CSRF tokens:", error);
    }
};

module.exports = { generateCsrfToken, validateCsrfToken };
