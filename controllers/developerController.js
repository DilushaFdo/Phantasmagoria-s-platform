const crypto = require("crypto");
const { ApiKey, ApiUsageLog, LoginLog } = require("../models");
const sequelize = require("../db");

// NOTE: Scopes updated for CW2. Any existing API keys with old scope names
// (public:read, stats:read) will need to be regenerated with the new scopes.
const ALLOWED_SCOPES = ["read:alumni", "read:analytics", "read:alumni_of_day"];

// Create a new API key for a developer
const generateKey = async (req, res) => {
    try {
        const { scopes, name } = req.body; // Expecting an array of strings and a name
        let finalScopes = "read:alumni"; // Default scope

        if (scopes && Array.isArray(scopes)) {
            // Validate all provided scopes
            const isValid = scopes.every(s => ALLOWED_SCOPES.includes(s));
            if (!isValid) {
                return res.status(400).json({ 
                    error: `Invalid scope(s) provided. Allowed: ${ALLOWED_SCOPES.join(", ")}` 
                });
            }
            finalScopes = scopes.join(",");
        }

        const rawKey = crypto.randomBytes(32).toString("hex");

        // Use SHA-256 to hash the key so we don't store the raw one in the DB
        const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");

        // Create the new API key in the database with the hashed version
        const newKey = await ApiKey.create({
            key_string: hashedKey,
            UserId: req.user,
            status: "active",
            scopes: finalScopes,
            name: name || "Default Key"
        });

        res.status(201).json({
            message: "API key generated successfully. IMPORTANT: This is the ONLY time you will see this key. Store it securely.",
            id: newKey.id,
            raw_key: rawKey,
            scopes: newKey.scopes,
            status: newKey.status,
            name: newKey.name
        });
    } catch (error) {
        console.error("Error generating API key:", error);
        res.status(500).json({ error: "Failed to generate API key" });
    }
};

// List all API keys for the current user
const listKeys = async (req, res) => {
    try {
        const keys = await ApiKey.findAll({
            where: { UserId: req.user },
            attributes: ['id', 'name', 'scopes', 'status', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        // For each key, get the last usage timestamp
        const keysWithUsage = await Promise.all(keys.map(async (key) => {
            const lastUsage = await ApiUsageLog.findOne({
                where: { ApiKeyId: key.id },
                order: [['timestamp', 'DESC']],
                attributes: ['timestamp']
            });

            return {
                ...key.toJSON(),
                last_used: lastUsage ? lastUsage.timestamp : null
            };
        }));

        res.status(200).json({ keys: keysWithUsage });
    } catch (error) {
        console.error("Error listing API keys:", error);
        res.status(500).json({ error: "Failed to list API keys" });
    }
};

// Revoke an API key so it can't be used anymore
const revokeKey = async (req, res) => {
    try {
        const { keyId } = req.params;

        const key = await ApiKey.findOne({
            where: {
                id: keyId,
                UserId: req.user,
            },
        });

        if (!key) {
            return res.status(404).json({ error: "API key not found" });
        }

        key.status = "revoked";
        await key.save();

        res.status(200).json({ message: "API key revoked successfully", key });
    } catch (error) {
        console.error("Error revoking API key:", error);
        res.status(500).json({ error: "Failed to revoke API key" });
    }
};

// Get stats on how the developer's keys are being used
const getUsageStats = async (req, res) => {
    try {
        // Find all keys belonging to the user
        const keys = await ApiKey.findAll({
            where: { UserId: req.user }
        });

        const keyIds = keys.map(k => k.id);

        if (keyIds.length === 0) {
            return res.status(200).json({ usageLogs: [] });
        }

        const logs = await ApiUsageLog.findAll({
            where: { ApiKeyId: keyIds },
            order: [["timestamp", "DESC"]]
        });

        res.status(200).json({
            total_keys: keys.length,
            total_requests: logs.length,
            usageLogs: logs,
        });
    } catch (error) {
        console.error("Error fetching usage statistics:", error);
        res.status(500).json({ error: "Failed to fetch usage statistics" });
    }
};

// Get all the stats for the developer dashboard summary
const getDashboardSummary = async (req, res) => {
    try {
        const userId = req.user;

        // Get login stats
        const totalLogins = await LoginLog.count({ where: { UserId: userId } });
        const recentLogins = await LoginLog.findAll({
            where: { UserId: userId },
            order: [["login_time", "DESC"]],
            limit: 10,
        });

        // Get API key overview
        const keys = await ApiKey.findAll({ where: { UserId: userId } });
        const activeKeys = keys.filter(k => k.status === "active").length;
        const revokedKeys = keys.filter(k => k.status === "revoked").length;
        const keyIds = keys.map(k => k.id);

        // Breakdown which endpoints were used
        let endpointBreakdown = [];
        let totalApiHits = 0;

        if (keyIds.length > 0) {
            totalApiHits = await ApiUsageLog.count({ where: { ApiKeyId: keyIds } });

            // Count hits for each endpoint
            endpointBreakdown = await ApiUsageLog.findAll({
                attributes: [
                    "endpoint_accessed",
                    [sequelize.fn("COUNT", sequelize.col("endpoint_accessed")), "hit_count"]
                ],
                where: { ApiKeyId: keyIds },
                group: ["endpoint_accessed"],
                order: [[sequelize.fn("COUNT", sequelize.col("endpoint_accessed")), "DESC"]],
                limit: 10,
                raw: true,
            });
        }

        return res.status(200).json({
            login_statistics: {
                total_logins: totalLogins,
                recent_logins: recentLogins,
            },
            api_key_overview: {
                total_keys: keys.length,
                active_keys: activeKeys,
                revoked_keys: revokedKeys,
            },
            api_usage: {
                total_api_hits: totalApiHits,
                top_endpoints: endpointBreakdown,
            },
        });
    } catch (error) {
        console.error("Error fetching dashboard summary:", error);
        return res.status(500).json({ error: "Failed to fetch dashboard summary" });
    }
};

module.exports = {
    generateKey,
    listKeys,
    revokeKey,
    getUsageStats,
    getDashboardSummary
};
