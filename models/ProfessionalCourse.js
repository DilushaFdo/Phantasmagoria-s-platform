const sequelize = require("../db");
const { DataTypes } = require("sequelize");

const ProfessionalCourse = sequelize.define("ProfessionalCourse", {
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
        allowNull: true,
    },
    completion_date: {
        type: DataTypes.DATE,
    },
});

module.exports = ProfessionalCourse;
