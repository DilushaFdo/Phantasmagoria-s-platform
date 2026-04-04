const crypto = require("crypto");
const { ApiKey, ApiUsageLog, LoginLog } = require("../models");
const sequelize = require("../db");

const ALLOWED_SCOPES = ["public:read", "stats:read"];

// Generate a new secure API key with optional scoping
const generateKey = async (req, res) => {
    try {
        const { scopes } = req.body; // Expecting an array of strings
        let finalScopes = "public:read"; // Default scope

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

        const keyString = crypto.randomBytes(32).toString("hex");

        // Create the new API key in the database with the requested scopes
        const newKey = await ApiKey.create({
            key_string: keyString,
            UserId: req.user.id,
            status: "active",
            scopes: finalScopes
        });

        res.status(201).json({
            message: "API key generated successfully",
            key: newKey,
        });
    } catch (error) {
        console.error("Error generating API key:", error);
        res.status(500).json({ error: "Failed to generate API key" });
    }
};

// Revoke an API key by its database ID
const revokeKey = async (req, res) => {
    try {
        const { keyId } = req.params;

        const key = await ApiKey.findOne({
            where: {
                id: keyId,
                UserId: req.user.id,
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

// Fetch usage statistics for the developer's keys
const getUsageStats = async (req, res) => {
    try {
        // Find all keys belonging to the user
        const keys = await ApiKey.findAll({
            where: { UserId: req.user.id }
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

// Gets a summary for the developer dashboard, including login counts and API usage info
const getDashboardSummary = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Login statistics
        const totalLogins = await LoginLog.count({ where: { UserId: userId } });
        const recentLogins = await LoginLog.findAll({
            where: { UserId: userId },
            order: [["login_time", "DESC"]],
            limit: 10,
        });

        // 2. API key overview
        const keys = await ApiKey.findAll({ where: { UserId: userId } });
        const activeKeys = keys.filter(k => k.status === "active").length;
        const revokedKeys = keys.filter(k => k.status === "revoked").length;
        const keyIds = keys.map(k => k.id);

        // 3. Endpoint usage breakdown
        let endpointBreakdown = [];
        let totalApiHits = 0;

        if (keyIds.length > 0) {
            totalApiHits = await ApiUsageLog.count({ where: { ApiKeyId: keyIds } });

            // Counting which endpoints are accessed the most
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
    revokeKey,
    getUsageStats,
    getDashboardSummary,
};
