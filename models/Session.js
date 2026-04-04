const sequelize = require("../db");
const { DataTypes } = require("sequelize");

const Session = sequelize.define("Session", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    token: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    user_agent: {
        type: DataTypes.STRING,
        allowNull: true,
    },
});

module.exports = Session;
