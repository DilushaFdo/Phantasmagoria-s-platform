const { Profile, User, Degree, Certification, Licence, ProfessionalCourse, EmploymentHistory } = require("../models");

// Get the alumnus that's featured for today
const getFeaturedAlumnus = async (req, res) => {
    try {
        const featuredProfile = await Profile.findOne({
            where: { is_featured_today: true },
            include: [
                {
                    model: User,
                    attributes: ["id", "email"]
                },
                { model: Degree },
                { model: Certification },
                { model: Licence },
                { model: ProfessionalCourse },
                { model: EmploymentHistory }
            ]
        });

        if (!featuredProfile) {
            return res.status(404).json({ message: "No featured alumnus available for today." });
        }

        res.status(200).json(featuredProfile);
    } catch (error) {
        console.error("Error fetching featured alumnus:", error);
        res.status(500).json({ error: "Failed to fetch featured alumnus" });
    }
};

module.exports = {
    getFeaturedAlumnus
};
