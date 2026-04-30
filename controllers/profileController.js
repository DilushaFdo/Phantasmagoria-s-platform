const { Profile, Degree, Certification, Licence, ProfessionalCourse, EmploymentHistory } = require('../models');

// Profile controller handles all the student profile data

// Change bio, LinkedIn, and profile picture
const updateBaseProfile = async (req, res) => {
    try {
        const userId = req.user;
        const { first_name, last_name, biography, linkedin_url, profile_image_path } = req.body;

        // Basic validation for names if provided
        const nameRegex = /^[A-Za-z\s]+$/;
        if (first_name && (!nameRegex.test(first_name) || first_name.length > 50)) {
            return res.status(400).json({ success: false, error: 'INVALID_NAME', message: 'First name must contain only letters and spaces, and be max 50 characters.' });
        }
        if (last_name && (!nameRegex.test(last_name) || last_name.length > 50)) {
            return res.status(400).json({ success: false, error: 'INVALID_NAME', message: 'Last name must contain only letters and spaces, and be max 50 characters.' });
        }

        let [profile, created] = await Profile.findOrCreate({
            where: { UserId: userId },
            defaults: { first_name, last_name, biography, linkedin_url, profile_image_path }
        });

        if (!created) {
            if (first_name !== undefined) profile.first_name = first_name;
            if (last_name !== undefined) profile.last_name = last_name;
            if (biography !== undefined) profile.biography = biography;
            if (linkedin_url !== undefined) profile.linkedin_url = linkedin_url;
            if (profile_image_path !== undefined) profile.profile_image_path = profile_image_path;
            await profile.save();
        }

        return res.status(200).json({ success: true, message: 'Base profile updated successfully', data: { profile } });
    } catch (error) {
        console.error("Error updating base profile:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' });
    }
};

// Check if the user owns the record they want to change
const verifyOwnership = async (Model, recordId, userId) => {
    const record = await Model.findByPk(recordId, {
        include: [{ model: Profile }]
    });
    if (!record || record.Profile.UserId !== userId) {
        return null;
    }
    return record;
};

// Degrees
const addDegree = async (req, res) => {
    try {
        const userId = req.user;
        const { title, url, completion_date } = req.body;

        let profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) profile = await Profile.create({ UserId: userId });

        const newDegree = await Degree.create({ title, url, completion_date, ProfileId: profile.id });
        return res.status(201).json({ success: true, message: 'Degree added successfully', data: { degree: newDegree } });
    } catch (error) {
        console.error("Error adding degree:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' });
    }
};

const updateDegree = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, url, completion_date } = req.body;
        const record = await verifyOwnership(Degree, id, req.user);
        if (!record) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Degree not found or unauthorized.' });

        if (title !== undefined) record.title = title;
        if (url !== undefined) record.url = url;
        if (completion_date !== undefined) record.completion_date = completion_date;
        await record.save();

        return res.status(200).json({ success: true, message: 'Degree updated successfully', data: { degree: record } });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' });
    }
};

const deleteDegree = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await verifyOwnership(Degree, id, req.user);
        if (!record) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Degree not found or unauthorized.' });
        await record.destroy();
        return res.status(200).json({ success: true, message: 'Degree deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' });
    }
};

// Certifications
const addCertification = async (req, res) => {
    try {
        const userId = req.user;
        const { title, url, completion_date } = req.body;

        let profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) profile = await Profile.create({ UserId: userId });

        const newCertification = await Certification.create({ title, url, completion_date, ProfileId: profile.id });
        return res.status(201).json({ success: true, message: 'Certification added successfully', data: { certification: newCertification } });
    } catch (error) {
        console.error("Error adding certification:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' });
    }
};

const updateCertification = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, url, completion_date } = req.body;
        const record = await verifyOwnership(Certification, id, req.user);
        if (!record) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Certification not found or unauthorized.' });

        if (title !== undefined) record.title = title;
        if (url !== undefined) record.url = url;
        if (completion_date !== undefined) record.completion_date = completion_date;
        await record.save();
        return res.status(200).json({ success: true, message: 'Certification updated successfully', data: { certification: record } });
    } catch (error) { return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' }); }
};

const deleteCertification = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await verifyOwnership(Certification, id, req.user);
        if (!record) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Certification not found or unauthorized.' });
        await record.destroy();
        return res.status(200).json({ success: true, message: 'Certification deleted successfully' });
    } catch (error) { return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' }); }
};

// Licences
const addLicence = async (req, res) => {
    try {
        const userId = req.user;
        const { title, url, completion_date } = req.body;

        let profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) profile = await Profile.create({ UserId: userId });

        const newLicence = await Licence.create({ title, url, completion_date, ProfileId: profile.id });
        return res.status(201).json({ success: true, message: 'Licence added successfully', data: { licence: newLicence } });
    } catch (error) {
        console.error("Error adding licence:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' });
    }
};

const updateLicence = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, url, completion_date } = req.body;
        const record = await verifyOwnership(Licence, id, req.user);
        if (!record) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Licence not found or unauthorized.' });

        if (title !== undefined) record.title = title;
        if (url !== undefined) record.url = url;
        if (completion_date !== undefined) record.completion_date = completion_date;
        await record.save();
        return res.status(200).json({ success: true, message: 'Licence updated successfully', data: { licence: record } });
    } catch (error) { return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' }); }
};

const deleteLicence = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await verifyOwnership(Licence, id, req.user);
        if (!record) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Licence not found or unauthorized.' });
        await record.destroy();
        return res.status(200).json({ success: true, message: 'Licence deleted successfully' });
    } catch (error) { return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' }); }
};

// Professional Courses
const addProfessionalCourse = async (req, res) => {
    try {
        const userId = req.user;
        const { title, url, completion_date } = req.body;

        let profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) profile = await Profile.create({ UserId: userId });

        const newCourse = await ProfessionalCourse.create({ title, url, completion_date, ProfileId: profile.id });
        return res.status(201).json({ success: true, message: 'Professional course added successfully', data: { course: newCourse } });
    } catch (error) {
        console.error("Error adding professional course:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' });
    }
};

const updateProfessionalCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, url, completion_date } = req.body;
        const record = await verifyOwnership(ProfessionalCourse, id, req.user);
        if (!record) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Course not found or unauthorized.' });

        if (title !== undefined) record.title = title;
        if (url !== undefined) record.url = url;
        if (completion_date !== undefined) record.completion_date = completion_date;
        await record.save();
        return res.status(200).json({ success: true, message: 'Course updated successfully', data: { course: record } });
    } catch (error) { return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' }); }
};

const deleteProfessionalCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await verifyOwnership(ProfessionalCourse, id, req.user);
        if (!record) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Course not found or unauthorized.' });
        await record.destroy();
        return res.status(200).json({ success: true, message: 'Course deleted successfully' });
    } catch (error) { return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' }); }
};

// Employment History
const addEmploymentHistory = async (req, res) => {
    try {
        const userId = req.user;
        const { job_title, company, start_date, end_date } = req.body;
        if (!job_title || !company || !start_date) return res.status(400).json({ success: false, error: 'MISSING_DATA', message: 'Job title, company, and start date are required' });

        let profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) profile = await Profile.create({ UserId: userId });

        const newEmployment = await EmploymentHistory.create({ job_title, company, start_date, end_date, ProfileId: profile.id });
        return res.status(201).json({ success: true, message: 'Employment history added successfully', data: { employment: newEmployment } });
    } catch (error) {
        console.error("Error adding employment history:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' });
    }
};

const updateEmploymentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { job_title, company, start_date, end_date } = req.body;
        const record = await verifyOwnership(EmploymentHistory, id, req.user);
        if (!record) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Employment record not found or unauthorized.' });

        if (job_title !== undefined) record.job_title = job_title;
        if (company !== undefined) record.company = company;
        if (start_date !== undefined) record.start_date = start_date;
        if (end_date !== undefined) record.end_date = end_date;
        await record.save();
        return res.status(200).json({ success: true, message: 'Employment history updated successfully', data: { employment: record } });
    } catch (error) { return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' }); }
};

const deleteEmploymentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await verifyOwnership(EmploymentHistory, id, req.user);
        if (!record) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Employment record not found or unauthorized.' });
        await record.destroy();
        return res.status(200).json({ success: true, message: 'Employment record deleted successfully' });
    } catch (error) { return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' }); }
};

// Get the path to the profile image
const getProfileImage = async (req, res) => {
    try {
        const userId = req.user;
        const profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile || !profile.profile_image_path) {
            return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Profile image not found' });
        }
        return res.status(200).json({ success: true, data: { profile_image_path: profile.profile_image_path } });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' });
    }
};

// Update the profile image path
const updateProfileImage = async (req, res) => {
    try {
        const userId = req.user;
        const { profile_image_path } = req.body;

        if (!profile_image_path) {
            return res.status(400).json({ success: false, error: 'MISSING_DATA', message: 'profile_image_path is required' });
        }

        // Just basic validation, accepting any string as requested
        let profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) {
            profile = await Profile.create({ UserId: userId, profile_image_path });
        } else {
            profile.profile_image_path = profile_image_path;
            await profile.save();
        }

        return res.status(200).json({ success: true, message: 'Profile image updated successfully', data: { profile_image_path: profile.profile_image_path } });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' });
    }
};

// Clear the profile image
const deleteProfileImage = async (req, res) => {
    try {
        const userId = req.user;
        const profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Profile not found' });

        profile.profile_image_path = null;
        await profile.save();

        return res.status(200).json({ success: true, message: 'Profile image deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' });
    }
};

// Get the whole profile with everything included
const getProfile = async (req, res) => {
    try {
        // If an id is provided in params, use it (public view), otherwise use the session user (private view)
        const userId = req.params.id || req.user;
        
        const { User } = require('../models');
        const profile = await Profile.findOne({
            where: { UserId: userId },
            include: [
                { model: User, attributes: ['email'] },
                { model: Degree },
                { model: Certification },
                { model: Licence },
                { model: ProfessionalCourse },
                { model: EmploymentHistory }
            ]
        });
        if (!profile) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Profile not found' });

        // Calculate how many bids are left for the month
        const maxWins = profile.attended_university_event ? 4 : 3;
        const remainingSlots = Math.max(0, maxWins - profile.monthly_win_count);

        return res.status(200).json({
            success: true,
            data: {
                ...profile.get({ plain: true }),
                wallet_balance: profile.wallet_balance,
                max_monthly_wins: maxWins,
                remaining_monthly_slots: remainingSlots
            }
        });
    } catch (error) {
        console.error("Error retrieving profile:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' });
    }
};

module.exports = {
    updateBaseProfile,
    addDegree, updateDegree, deleteDegree,
    addCertification, updateCertification, deleteCertification,
    addLicence, updateLicence, deleteLicence,
    addProfessionalCourse, updateProfessionalCourse, deleteProfessionalCourse,
    addEmploymentHistory, updateEmploymentHistory, deleteEmploymentHistory,
    getProfile,
    getProfileImage, updateProfileImage, deleteProfileImage
};
