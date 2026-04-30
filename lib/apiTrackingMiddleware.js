const crypto = require("crypto");
const { ApiKey, ApiUsageLog } = require("../models");
const { extractToken } = require("./authMiddleware");
const jwt = require("jsonwebtoken");

// Middleware to track API usage and check if the key has the right permissions (scopes)
const apiTrackingMiddleware = (requiredScope) => {
    return async (req, res, next) => {
        // If authMiddleware already identified the user via session, allow access
        if (req.user) {
            return next();
        }

        // Check for 'x-api-key' or 'Authorization: Bearer <token>'
        let keyString = req.headers['x-api-key'];

        if (!keyString && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            keyString = req.headers.authorization.split(" ")[1];
        }

        // FALLBACK: Check if the Authorization header was actually a valid JWT session
        // This is useful if authMiddleware wasn't mounted or if we're in a "session OR API key" route
        if (keyString) {
            try {
                const decoded = jwt.verify(keyString, process.env.JWT_SECRET);
                if (decoded && decoded.id) {
                    req.user = decoded.id;
                    return next();
                }
            } catch (e) {
                // Not a JWT, continue to treat it as an API key
            }
        }

        // If no key found, and no session found above
        if (!keyString || keyString === "undefined" || keyString === "null") {
            return res.status(401).json({ error: "Unauthorized: API key or valid session is missing" });
        }

        try {
            // Hash the incoming key to compare with the stored SHA-256 version
            const hashedIncomingKey = crypto.createHash("sha256").update(keyString).digest("hex");

            const apiKeyRecord = await ApiKey.findOne({
                where: { key_string: hashedIncomingKey }
            });

            if (!apiKeyRecord) {
                return res.status(401).json({ error: "Unauthorized: Invalid API key or session token" });
            }

            if (apiKeyRecord.status !== "active") {
                return res.status(401).json({ error: "Unauthorized: API key has been revoked" });
            }

            // Checking if the API key has the right scope to access this specific endpoint
            const userScopes = apiKeyRecord.scopes ? apiKeyRecord.scopes.split(',') : [];
            if (!userScopes.includes(requiredScope)) {
                return res.status(403).json({
                    error: `Forbidden: This API key lacks the required scope: '${requiredScope}'`
                });
            }

            // Log the endpoint usage
            await ApiUsageLog.create({
                endpoint_accessed: req.originalUrl,
                ApiKeyId: apiKeyRecord.id
            });

            // Pass control to the specific route
            next();
        } catch (error) {
            console.error("Error in apiTrackingMiddleware:", error);
            return res.status(500).json({ error: "Internal server error during API key verification" });
        }
    };
};

module.exports = apiTrackingMiddleware;
