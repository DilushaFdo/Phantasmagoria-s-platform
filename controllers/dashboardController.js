// Controller for rendering dashboard EJS views

const renderIndex = (req, res) => {
    res.render("dashboard/index", { user: req.user });
};

const renderAlumni = (req, res) => {
    res.render("dashboard/alumni", { user: req.user });
};

const renderSkillsGap = (req, res) => {
    res.render("dashboard/charts/skills-gap", { user: req.user });
};

const renderEmployment = (req, res) => {
    res.render("dashboard/charts/employment", { user: req.user });
};

const renderJobTitles = (req, res) => {
    res.render("dashboard/charts/job-titles", { user: req.user });
};

const renderEmployers = (req, res) => {
    res.render("dashboard/charts/employers", { user: req.user });
};

const renderGeographic = (req, res) => {
    res.render("dashboard/charts/geographic", { user: req.user });
};

module.exports = {
    renderIndex,
    renderAlumni,
    renderSkillsGap,
    renderEmployment,
    renderJobTitles,
    renderEmployers,
    renderGeographic,
};
