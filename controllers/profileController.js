const { Profile, Degree, Certification, EmploymentHistory } = require('../models');

// Validates whether the given string is a valid LinkedIn URL
const isValidLinkedInUrl = (url) => {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname === 'linkedin.com' || parsedUrl.hostname === 'www.linkedin.com';
    } catch (error) {
        return false;
    }
};

/**
 * 1. updateBaseProfile: Saves biography and LinkedIn URL.
 * Includes validation for the LinkedIn URL string format.
 */
const updateBaseProfile = async (req, res) => {
    try {
        const userId = req.user; // Retrieved from the auth middleware
        const { biography, linkedin_url } = req.body;

        // Validation for the linkedin URL format (Rubric requirement)
        if (linkedin_url) {
            if (!isValidLinkedInUrl(linkedin_url)) {
                return res.status(400).json({ error: 'Invalid LinkedIn URL format. It must be a valid linkedin.com URL.' });
            }
        }

        // Find existing profile or create a new one for this user
        let [profile, created] = await Profile.findOrCreate({
            where: { UserId: userId },
            defaults: { biography, linkedin_url }
        });

        // If it already existed, update the specific fields provided
        if (!created) {
            if (biography !== undefined) profile.biography = biography;
            if (linkedin_url !== undefined) profile.linkedin_url = linkedin_url;
            await profile.save();
        }

        return res.status(200).json({ message: 'Base profile updated successfully', profile });
    } catch (error) {
        console.error("Error updating base profile:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * 2. addDegree: Takes degree title, URL, and completion date,
 * and saves it to the Degrees table using the user's ID
 */
const addDegree = async (req, res) => {
    try {
        const userId = req.user;
        const { title, url, completion_date } = req.body;

        // Ensure user has a profile record to link the degree to
        let profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) {
            profile = await Profile.create({ UserId: userId });
        }

        const newDegree = await Degree.create({
            title,
            url,
            completion_date,
            ProfileId: profile.id // Link the degree to the found/created profile
        });

        return res.status(201).json({ message: 'Degree added successfully', degree: newDegree });
    } catch (error) {
        console.error("Error adding degree:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * 3. addCertification: Takes certification title, URL, and completion date,
 * and saves it to the Certifications table
 */
const addCertification = async (req, res) => {
    try {
        const userId = req.user;
        const { title, url, completion_date } = req.body;

        let profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) {
            profile = await Profile.create({ UserId: userId });
        }

        const newCertification = await Certification.create({
            title,
            url,
            completion_date,
            ProfileId: profile.id
        });

        return res.status(201).json({ message: 'Certification added successfully', certification: newCertification });
    } catch (error) {
        console.error("Error adding certification:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * 4. getProfile: Queries the database, retrieves the user's base profile,
 * and uses Sequelize's include feature to pull associated tables.
 */
const getProfile = async (req, res) => {
    try {
        const userId = req.user;

        const profile = await Profile.findOne({
            where: { UserId: userId },
            include: [
                { model: Degree },
                { model: Certification },
                { model: EmploymentHistory }
            ]
        });

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        return res.status(200).json(profile);
    } catch (error) {
        console.error("Error retrieving profile:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    updateBaseProfile,
    addDegree,
    addCertification,
    getProfile
};
