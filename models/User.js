const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const User = sequelize.define("User", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: 'users_email_unique',
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    verification_token: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    verification_token_expiry: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    reset_token: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    reset_token_expiry: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    company_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('alumni', 'sponsor', 'developer', 'admin'),
        defaultValue: 'alumni',
        allowNull: false
    },
});

module.exports = User;
