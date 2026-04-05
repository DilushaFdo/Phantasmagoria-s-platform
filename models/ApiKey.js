const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ApiKey = sequelize.define("ApiKey", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    key_string: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        // Store the SHA-256 hash of the API key for security
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "active", // Can be 'active' or 'revoked'
    },
    scopes: {
        type: DataTypes.STRING,
        defaultValue: "public:read", // Comma-separated list (e.g., 'public:read,stats:read')
    },
});

module.exports = ApiKey;
