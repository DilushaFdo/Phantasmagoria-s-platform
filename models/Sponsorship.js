const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Sponsorship = sequelize.define("Sponsorship", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    SponsorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    offer_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
        defaultValue: 'pending',
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    responded_at: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    validate: {
        eitherCertOrLicence() {
            if ((this.CertificationId === null && this.LicenceId === null) || 
                (this.CertificationId !== null && this.LicenceId !== null)) {
                throw new Error('A Sponsorship must reference either a Certification or a Licence, but not both.');
            }
        }
    }
});

module.exports = Sponsorship;
