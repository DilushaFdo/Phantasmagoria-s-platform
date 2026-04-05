const { DataTypes } = require("sequelize");
const sequelize = require("../db");

// Model to store CSRF tokens so they persist
const CsrfToken = sequelize.define("CsrfToken", {
    token: {
        type: DataTypes.STRING(128),
        primaryKey: true,
    },
    UserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    user_agent: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: "csrf_tokens",
    timestamps: false,
});

module.exports = CsrfToken;
