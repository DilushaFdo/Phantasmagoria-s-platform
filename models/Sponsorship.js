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
    },
    ProfileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    CertificationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    LicenceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
            const hasCert = this.CertificationId != null;
            const hasLic = this.LicenceId != null;
            if ((!hasCert && !hasLic) || (hasCert && hasLic)) {
                throw new Error('A Sponsorship must reference either a Certification or a Licence, but not both.');
            }
        }
    }
});

module.exports = Sponsorship;
