const { ApiKey, ApiUsageLog } = require("../models");

// Middleware to track API usage and check if the key has the right permissions (scopes)
const apiTrackingMiddleware = (requiredScope) => {
    return async (req, res, next) => {
        // Check header for 'x-api-key' or 'Authorization: Bearer <token>'
        let keyString = req.headers['x-api-key'];

        if (!keyString && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            keyString = req.headers.authorization.split(" ")[1];
        }

        if (!keyString) {
            return res.status(401).json({ error: "Unauthorized: API key is missing" });
        }

        try {
            const apiKeyRecord = await ApiKey.findOne({
                where: { key_string: keyString }
            });

            if (!apiKeyRecord) {
                return res.status(401).json({ error: "Unauthorized: Invalid API key" });
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
