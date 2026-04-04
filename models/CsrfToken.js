const { DataTypes } = require("sequelize");
const sequelize = require("../db");

/**
 * Model for storing active CSRF tokens.
 * This ensures tokens persist across server restarts and works in scaled environments.
 */
const CsrfToken = sequelize.define("CsrfToken", {
    token: {
        type: DataTypes.STRING(128),
        primaryKey: true,
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
