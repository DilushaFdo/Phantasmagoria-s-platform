const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ApiUsageLog = sequelize.define("ApiUsageLog", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    endpoint_accessed: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
});

module.exports = ApiUsageLog;
