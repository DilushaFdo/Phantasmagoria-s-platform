const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Profile = sequelize.define("Profile", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    biography: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    linkedin_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    profile_image_path: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    monthly_win_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    attended_university_event: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    is_featured_today: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
});

Profile.prototype.getTotalSponsorshipAmount = async function() {
    const sponsorships = await sequelize.models.Sponsorship.findAll({
        where: {
            ProfileId: this.id,
            status: 'accepted'
        }
    });
    
    return sponsorships.reduce((total, sponsorship) => {
        return total + Number(sponsorship.offer_amount);
    }, 0);
};

module.exports = Profile;