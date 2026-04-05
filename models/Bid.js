const sequelize = require("../db");
const { DataTypes } = require("sequelize");

const Bid = sequelize.define("Bid", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    bid_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    target_date: {
        type: DataTypes.DATE,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
    },
}, {
    indexes: [
        {
            fields: ['target_date']
        }
    ]
});

module.exports = Bid;
