const { Profile, Degree, Certification, Licence, ProfessionalCourse, EmploymentHistory } = require('../models');

// Validates whether the given string is a valid LinkedIn URL
const isValidLinkedInUrl = (url) => {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname === 'linkedin.com' || parsedUrl.hostname === 'www.linkedin.com';
    } catch (error) {
        return false;
    }
};

// Generic URL validator for degrees, certifications, etc.
const isValidUrl = (urlString) => {
    try {
        const url = new URL(urlString);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (e) {
        return false;
    }
};

// Updates the basic profile info like bio, image, and LinkedIn URL
const updateBaseProfile = async (req, res) => {
    try {
        const userId = req.user;
        const { biography, linkedin_url, profile_image_path } = req.body;

        if (linkedin_url && !isValidLinkedInUrl(linkedin_url)) {
            return res.status(400).json({ error: 'Invalid LinkedIn URL format. It must be a valid linkedin.com URL.' });
        }

        if (profile_image_path && !isValidUrl(profile_image_path)) {
            return res.status(400).json({ error: 'Invalid Image URL format.' });
        }

        let [profile, created] = await Profile.findOrCreate({
            where: { UserId: userId },
            defaults: { biography, linkedin_url, profile_image_path }
        });

        if (!created) {
            if (biography !== undefined) profile.biography = biography;
            if (linkedin_url !== undefined) profile.linkedin_url = linkedin_url;
            if (profile_image_path !== undefined) profile.profile_image_path = profile_image_path;
            await profile.save();
        }

        return res.status(200).json({ message: 'Base profile updated successfully', profile });
    } catch (error) {
        console.error("Error updating base profile:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Helper function to check if the current user actually owns the record they are trying to edit
const verifyOwnership = async (Model, recordId, userId) => {
    const record = await Model.findByPk(recordId, {
        include: [{ model: Profile }]
    });
    if (!record || record.Profile.UserId !== userId) {
        return null;
    }
    return record;
};

// CRUD operations for Degrees
const addDegree = async (req, res) => {
    try {
        const userId = req.user;
        const { title, url, completion_date } = req.body;

        if (url && !isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL format.' });

        let profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) profile = await Profile.create({ UserId: userId });

        const newDegree = await Degree.create({ title, url, completion_date, ProfileId: profile.id });
        return res.status(201).json({ message: 'Degree added successfully', degree: newDegree });
    } catch (error) {
        console.error("Error adding degree:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const updateDegree = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, url, completion_date } = req.body;
        const record = await verifyOwnership(Degree, id, req.user);
        if (!record) return res.status(404).json({ error: 'Degree not found or unauthorized.' });

        if (url && !isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL format.' });

        if (title !== undefined) record.title = title;
        if (url !== undefined) record.url = url;
        if (completion_date !== undefined) record.completion_date = completion_date;
        await record.save();

        return res.status(200).json({ message: 'Degree updated successfully', degree: record });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteDegree = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await verifyOwnership(Degree, id, req.user);
        if (!record) return res.status(404).json({ error: 'Degree not found or unauthorized.' });
        await record.destroy();
        return res.status(200).json({ message: 'Degree deleted successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// CRUD operations for Certifications
const addCertification = async (req, res) => {
    try {
        const userId = req.user;
        const { title, url, completion_date } = req.body;
        if (url && !isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL format.' });

        let profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) profile = await Profile.create({ UserId: userId });

        const newCertification = await Certification.create({ title, url, completion_date, ProfileId: profile.id });
        return res.status(201).json({ message: 'Certification added successfully', certification: newCertification });
    } catch (error) {
        console.error("Error adding certification:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const updateCertification = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, url, completion_date } = req.body;
        const record = await verifyOwnership(Certification, id, req.user);
        if (!record) return res.status(404).json({ error: 'Certification not found or unauthorized.' });
        if (url && !isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL format.' });

        if (title !== undefined) record.title = title;
        if (url !== undefined) record.url = url;
        if (completion_date !== undefined) record.completion_date = completion_date;
        await record.save();
        return res.status(200).json({ message: 'Certification updated successfully', certification: record });
    } catch (error) { return res.status(500).json({ error: 'Internal server error' }); }
};

const deleteCertification = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await verifyOwnership(Certification, id, req.user);
        if (!record) return res.status(404).json({ error: 'Certification not found or unauthorized.' });
        await record.destroy();
        return res.status(200).json({ message: 'Certification deleted successfully' });
    } catch (error) { return res.status(500).json({ error: 'Internal server error' }); }
};

// CRUD operations for Licences
const addLicence = async (req, res) => {
    try {
        const userId = req.user;
        const { title, url, completion_date } = req.body;
        if (url && !isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL format.' });

        let profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) profile = await Profile.create({ UserId: userId });

        const newLicence = await Licence.create({ title, url, completion_date, ProfileId: profile.id });
        return res.status(201).json({ message: 'Licence added successfully', licence: newLicence });
    } catch (error) {
        console.error("Error adding licence:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const updateLicence = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, url, completion_date } = req.body;
        const record = await verifyOwnership(Licence, id, req.user);
        if (!record) return res.status(404).json({ error: 'Licence not found or unauthorized.' });
        if (url && !isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL format.' });

        if (title !== undefined) record.title = title;
        if (url !== undefined) record.url = url;
        if (completion_date !== undefined) record.completion_date = completion_date;
        await record.save();
        return res.status(200).json({ message: 'Licence updated successfully', licence: record });
    } catch (error) { return res.status(500).json({ error: 'Internal server error' }); }
};

const deleteLicence = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await verifyOwnership(Licence, id, req.user);
        if (!record) return res.status(404).json({ error: 'Licence not found or unauthorized.' });
        await record.destroy();
        return res.status(200).json({ message: 'Licence deleted successfully' });
    } catch (error) { return res.status(500).json({ error: 'Internal server error' }); }
};

// CRUD operations for Professional Courses
const addProfessionalCourse = async (req, res) => {
    try {
        const userId = req.user;
        const { title, url, completion_date } = req.body;
        if (url && !isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL format.' });

        let profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) profile = await Profile.create({ UserId: userId });

        const newCourse = await ProfessionalCourse.create({ title, url, completion_date, ProfileId: profile.id });
        return res.status(201).json({ message: 'Professional course added successfully', course: newCourse });
    } catch (error) {
        console.error("Error adding professional course:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const updateProfessionalCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, url, completion_date } = req.body;
        const record = await verifyOwnership(ProfessionalCourse, id, req.user);
        if (!record) return res.status(404).json({ error: 'Course not found or unauthorized.' });
        if (url && !isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL format.' });

        if (title !== undefined) record.title = title;
        if (url !== undefined) record.url = url;
        if (completion_date !== undefined) record.completion_date = completion_date;
        await record.save();
        return res.status(200).json({ message: 'Course updated successfully', course: record });
    } catch (error) { return res.status(500).json({ error: 'Internal server error' }); }
};

const deleteProfessionalCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await verifyOwnership(ProfessionalCourse, id, req.user);
        if (!record) return res.status(404).json({ error: 'Course not found or unauthorized.' });
        await record.destroy();
        return res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) { return res.status(500).json({ error: 'Internal server error' }); }
};

// CRUD operations for Employment History
const addEmploymentHistory = async (req, res) => {
    try {
        const userId = req.user;
        const { job_title, company, start_date, end_date } = req.body;
        if (!job_title || !company || !start_date) return res.status(400).json({ error: 'Job title, company, and start date are required' });

        let profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) profile = await Profile.create({ UserId: userId });

        const newEmployment = await EmploymentHistory.create({ job_title, company, start_date, end_date, ProfileId: profile.id });
        return res.status(201).json({ message: 'Employment history added successfully', employment: newEmployment });
    } catch (error) {
        console.error("Error adding employment history:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const updateEmploymentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { job_title, company, start_date, end_date } = req.body;
        const record = await verifyOwnership(EmploymentHistory, id, req.user);
        if (!record) return res.status(404).json({ error: 'Employment record not found or unauthorized.' });

        if (job_title !== undefined) record.job_title = job_title;
        if (company !== undefined) record.company = company;
        if (start_date !== undefined) record.start_date = start_date;
        if (end_date !== undefined) record.end_date = end_date;
        await record.save();
        return res.status(200).json({ message: 'Employment history updated successfully', employment: record });
    } catch (error) { return res.status(500).json({ error: 'Internal server error' }); }
};

const deleteEmploymentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await verifyOwnership(EmploymentHistory, id, req.user);
        if (!record) return res.status(404).json({ error: 'Employment record not found or unauthorized.' });
        await record.destroy();
        return res.status(200).json({ message: 'Employment record deleted successfully' });
    } catch (error) { return res.status(500).json({ error: 'Internal server error' }); }
};

// Gets the full profile for the current user, including all their degrees and certificates
const getProfile = async (req, res) => {
    try {
        const userId = req.user;
        const profile = await Profile.findOne({
            where: { UserId: userId },
            include: [
                { model: Degree },
                { model: Certification },
                { model: Licence },
                { model: ProfessionalCourse },
                { model: EmploymentHistory }
            ]
        });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        return res.status(200).json(profile);
    } catch (error) {
        console.error("Error retrieving profile:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    updateBaseProfile,
    addDegree, updateDegree, deleteDegree,
    addCertification, updateCertification, deleteCertification,
    addLicence, updateLicence, deleteLicence,
    addProfessionalCourse, updateProfessionalCourse, deleteProfessionalCourse,
    addEmploymentHistory, updateEmploymentHistory, deleteEmploymentHistory,
    getProfile
};
