const sequelize = require("../db");
const { DataTypes } = require("sequelize");

const LoginLog = sequelize.define("LoginLog", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    user_agent: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    login_time: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
});

module.exports = LoginLog;
