const sequelize = require("../db");
const { DataTypes } = require("sequelize");

const Certification = sequelize.define("Certification", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    completion_date: {
        type: DataTypes.DATE,
    },
});

module.exports = Certification;