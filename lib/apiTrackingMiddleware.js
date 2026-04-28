const crypto = require("crypto");
const { ApiKey, ApiUsageLog } = require("../models");

// Middleware to track API usage and check if the key has the right permissions (scopes)
const apiTrackingMiddleware = (requiredScope) => {
    return async (req, res, next) => {
        // Check header for 'x-api-key' or 'Authorization: Bearer <token>'
        let keyString = req.headers['x-api-key'];

        if (!keyString && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            keyString = req.headers.authorization.split(" ")[1];
        }

        // FALLBACK: If no API key is found, check for a valid session (JWT in cookie)
        if (!keyString || keyString === "undefined" || keyString === "null") {
            const token = req.cookies.jwt;
            if (token) {
                try {
                    const jwt = require("jsonwebtoken");
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    if (decoded && decoded.id) {
                        // User is authenticated via session, allow access
                        return next();
                    }
                } catch (jwtErr) {
                    // Invalid token, continue to API key check which will fail
                }
            }
            return res.status(401).json({ error: "Unauthorized: API key or valid session is missing" });
        }

        try {
            // Hash the incoming key to compare with the stored SHA-256 version
            const hashedIncomingKey = crypto.createHash("sha256").update(keyString).digest("hex");

            const apiKeyRecord = await ApiKey.findOne({
                where: { key_string: hashedIncomingKey }
            });

            if (!apiKeyRecord) {
                // Second check: maybe the "Authorization" header was actually a JWT?
                // This happens if the client sends the JWT in the Bearer header instead of cookie
                try {
                    const jwt = require("jsonwebtoken");
                    const decoded = jwt.verify(keyString, process.env.JWT_SECRET);
                    if (decoded && decoded.id) {
                        return next();
                    }
                } catch (e) {}

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
