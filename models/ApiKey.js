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
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Default Key",
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "active", // Can be 'active' or 'revoked'
    },
    scopes: {
        type: DataTypes.STRING,
        defaultValue: "read:alumni", // Comma-separated list (e.g., 'read:alumni,read:analytics')
    },
});

module.exports = ApiKey;
