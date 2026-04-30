const { User, Profile, Degree, Certification, Licence, ProfessionalCourse, EmploymentHistory, Bid } = require("../models");
const sequelize = require("../db");
const { Op } = require("sequelize");

// get basic stats for the dashboard home page
const getOverview = async (req, res) => {
    try {
        const { programme, yearFrom, yearTo } = req.query;
        
        const alumniWhere = { is_verified: true, role: 'alumni' };
        const alumniInclude = [];

        if (programme || yearFrom || yearTo) {
            const degreeWhere = {};
            if (programme) degreeWhere.title = programme;
            if (yearFrom || yearTo) {
                const yearRange = {};
                if (yearFrom) yearRange[Op.gte] = new Date(`${yearFrom}-01-01`);
                if (yearTo) yearRange[Op.lte] = new Date(`${yearTo}-12-31`);
                degreeWhere.completion_date = yearRange;
            }

            alumniInclude.push({
                model: Profile,
                required: true,
                include: [{
                    model: Degree,
                    required: true,
                    where: degreeWhere
                }]
            });
        }

        const totalAlumni = await User.count({ 
            where: alumniWhere,
            include: alumniInclude
        });

        const totalActiveBids = await Bid.count({ where: { status: "pending" } });

        const todayInfluencer = await Profile.findOne({
            where: { is_featured_today: true },
            include: [{ model: User, attributes: ["email"] }]
        });

        const mostPopularCertification = await Certification.findAll({
            attributes: [
                "title",
                [sequelize.fn("COUNT", sequelize.col("Certification.id")), "count"]
            ],
            include: alumniInclude.length > 0 ? [{
                model: Profile,
                required: true,
                include: alumniInclude[0].include
            }] : [],
            group: ["Certification.title"],
            order: [[sequelize.fn("COUNT", sequelize.col("Certification.id")), "DESC"]],
            limit: 1,
            raw: true
        });

        const mostPopularRole = await EmploymentHistory.findAll({
            attributes: [
                "job_title",
                [sequelize.fn("COUNT", sequelize.col("id")), "count"]
            ],
            include: alumniInclude.length > 0 ? [{
                model: Profile,
                required: true,
                include: alumniInclude[0].include
            }] : [],
            group: ["job_title"],
            order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
            limit: 1,
            raw: true
        });

        return res.status(200).json({
            success: true,
            data: {
                totalAlumni,
                totalActiveBids,
                todayInfluencer,
                mostPopularCertification: mostPopularCertification[0] || null,
                mostPopularRole: mostPopularRole[0] || null
            }
        });
    } catch (error) {
        console.error("Error fetching overview:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Failed to fetch overview data" });
    }
};

// get stats for certifications like popular ones and trends
const getCertificationStats = async (req, res) => {
    try {
        const { yearFrom, yearTo, programme } = req.query;

        const profileInclude = [];
        const degreeWhere = {};
        if (programme) degreeWhere.title = programme;
        
        if (yearFrom || yearTo) {
            const yearRange = {};
            if (yearFrom) yearRange[Op.gte] = new Date(`${yearFrom}-01-01`);
            if (yearTo) yearRange[Op.lte] = new Date(`${yearTo}-12-31`);
            degreeWhere.completion_date = yearRange;
        }

        if (programme || yearFrom || yearTo) {
            profileInclude.push({
                model: Profile,
                attributes: [],
                required: true,
                include: [{
                    model: Degree,
                    attributes: [],
                    required: true,
                    where: degreeWhere
                }]
            });
        }

        const totalCertifications = await Certification.count({ include: profileInclude });

        const mostPopular = await Certification.findAll({
            attributes: [
                "title",
                [sequelize.fn("COUNT", sequelize.col("Certification.id")), "count"]
            ],
            include: profileInclude,
            group: ["Certification.title"],
            order: [[sequelize.fn("COUNT", sequelize.col("Certification.id")), "DESC"]],
            limit: 10,
            raw: true,
            subQuery: false
        });

        const mostPopularWithPercentage = mostPopular.map(cert => ({
            title: cert.title,
            count: parseInt(cert.count),
            percentage: totalCertifications > 0 ? parseFloat(((cert.count / totalCertifications) * 100).toFixed(1)) : 0
        }));

        const trendsOverTime = await Certification.findAll({
            attributes: [
                "title",
                [sequelize.fn("YEAR", sequelize.col("Certification.completion_date")), "year"],
                [sequelize.fn("MONTH", sequelize.col("Certification.completion_date")), "month"],
                [sequelize.fn("COUNT", sequelize.col("Certification.id")), "count"]
            ],
            where: {
                completion_date: { [Op.ne]: null }
            },
            include: profileInclude,
            group: [
                sequelize.fn("YEAR", sequelize.col("Certification.completion_date")),
                sequelize.fn("MONTH", sequelize.col("Certification.completion_date")),
                "Certification.title"
            ],
            order: [
                [sequelize.fn("YEAR", sequelize.col("Certification.completion_date")), "ASC"],
                [sequelize.fn("MONTH", sequelize.col("Certification.completion_date")), "ASC"]
            ],
            raw: true,
            subQuery: false
        });

        return res.status(200).json({
            success: true,
            data: {
                mostPopular: mostPopularWithPercentage || [],
                trendsOverTime: trendsOverTime || []
            }
        });
    } catch (error) {
        console.error("Error fetching certification stats:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Failed to fetch certification analytics" });
    }
};

// get stats for professional courses
const getCourseStats = async (req, res) => {
    try {
        const { yearFrom, yearTo, programme } = req.query;

        const profileInclude = [];
        const degreeWhere = {};
        if (programme) degreeWhere.title = programme;
        
        if (yearFrom || yearTo) {
            const yearRange = {};
            if (yearFrom) yearRange[Op.gte] = new Date(`${yearFrom}-01-01`);
            if (yearTo) yearRange[Op.lte] = new Date(`${yearTo}-12-31`);
            degreeWhere.completion_date = yearRange;
        }

        if (programme || yearFrom || yearTo) {
            profileInclude.push({
                model: Profile,
                attributes: [],
                required: true,
                include: [{
                    model: Degree,
                    attributes: [],
                    required: true,
                    where: degreeWhere
                }]
            });
        }

        const totalCourses = await ProfessionalCourse.count({ include: profileInclude });

        const mostPopular = await ProfessionalCourse.findAll({
            attributes: [
                "title",
                [sequelize.fn("COUNT", sequelize.col("ProfessionalCourse.id")), "count"]
            ],
            include: profileInclude,
            group: ["ProfessionalCourse.title"],
            order: [[sequelize.fn("COUNT", sequelize.col("ProfessionalCourse.id")), "DESC"]],
            limit: 10,
            raw: true,
            subQuery: false
        });

        const mostPopularWithPercentage = mostPopular.map(course => ({
            title: course.title,
            count: parseInt(course.count),
            percentage: totalCourses > 0 ? parseFloat(((course.count / totalCourses) * 100).toFixed(1)) : 0
        }));

        const trendsOverTime = await ProfessionalCourse.findAll({
            attributes: [
                "title",
                [sequelize.fn("YEAR", sequelize.col("ProfessionalCourse.completion_date")), "year"],
                [sequelize.fn("MONTH", sequelize.col("ProfessionalCourse.completion_date")), "month"],
                [sequelize.fn("COUNT", sequelize.col("ProfessionalCourse.id")), "count"]
            ],
            where: {
                completion_date: { [Op.ne]: null }
            },
            include: profileInclude,
            group: [
                sequelize.fn("YEAR", sequelize.col("ProfessionalCourse.completion_date")),
                sequelize.fn("MONTH", sequelize.col("ProfessionalCourse.completion_date")),
                "ProfessionalCourse.title"
            ],
            order: [
                [sequelize.fn("YEAR", sequelize.col("ProfessionalCourse.completion_date")), "ASC"],
                [sequelize.fn("MONTH", sequelize.col("ProfessionalCourse.completion_date")), "ASC"]
            ],
            raw: true,
            subQuery: false
        });

        return res.status(200).json({
            success: true,
            data: {
                mostPopular: mostPopularWithPercentage || [],
                trendsOverTime: trendsOverTime || []
            }
        });
    } catch (error) {
        console.error("Error fetching course stats:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Failed to fetch course analytics" });
    }
};

// get stats for employment like top companies and roles
const getEmploymentStats = async (req, res) => {
    try {
        const { yearFrom, yearTo, programme } = req.query;

        const profileInclude = [];
        const degreeWhere = {};
        if (programme) degreeWhere.title = programme;
        
        if (yearFrom || yearTo) {
            const yearRange = {};
            if (yearFrom) yearRange[Op.gte] = new Date(`${yearFrom}-01-01`);
            if (yearTo) yearRange[Op.lte] = new Date(`${yearTo}-12-31`);
            degreeWhere.completion_date = yearRange;
        }

        if (programme || yearFrom || yearTo) {
            profileInclude.push({
                model: Profile,
                attributes: [],
                required: true,
                include: [{
                    model: Degree,
                    attributes: [],
                    required: true,
                    where: degreeWhere
                }]
            });
        }

        const topRoles = await EmploymentHistory.findAll({
            attributes: [
                "job_title",
                [sequelize.fn("COUNT", sequelize.col("EmploymentHistory.id")), "count"]
            ],
            include: profileInclude,
            group: ["job_title"],
            order: [[sequelize.fn("COUNT", sequelize.col("EmploymentHistory.id")), "DESC"]],
            limit: 10,
            raw: true,
            subQuery: false
        });

        const topEmployers = await EmploymentHistory.findAll({
            attributes: [
                "company",
                [sequelize.fn("COUNT", sequelize.col("EmploymentHistory.id")), "count"]
            ],
            include: profileInclude,
            group: ["company"],
            order: [[sequelize.fn("COUNT", sequelize.col("EmploymentHistory.id")), "DESC"]],
            limit: 10,
            raw: true,
            subQuery: false
        });

        const employmentTrends = await EmploymentHistory.findAll({
            attributes: [
                "job_title",
                [sequelize.fn("YEAR", sequelize.col("EmploymentHistory.start_date")), "year"],
                [sequelize.fn("COUNT", sequelize.col("EmploymentHistory.id")), "count"]
            ],
            where: {
                start_date: { [Op.ne]: null }
            },
            include: profileInclude,
            group: [
                sequelize.fn("YEAR", sequelize.col("EmploymentHistory.start_date")),
                "job_title"
            ],
            order: [
                [sequelize.fn("YEAR", sequelize.col("EmploymentHistory.start_date")), "ASC"]
            ],
            raw: true,
            subQuery: false
        });

        return res.status(200).json({
            success: true,
            data: {
                topRoles: topRoles || [],
                topEmployers: topEmployers || [],
                employmentTrends: employmentTrends || []
            }
        });
    } catch (error) {
        console.error("Error fetching employment stats:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Failed to fetch employment analytics" });
    }
};

// get stats for degrees distributionar
const getDegreeStats = async (req, res) => {
    try {
        const byProgramme = await Degree.findAll({
            attributes: [
                "title",
                [sequelize.fn("COUNT", sequelize.col("id")), "count"]
            ],
            group: ["title"],
            order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
            raw: true
        });

        const graduationsByYear = await Degree.findAll({
            attributes: [
                [sequelize.fn("YEAR", sequelize.col("completion_date")), "year"],
                [sequelize.fn("COUNT", sequelize.col("id")), "count"]
            ],
            where: { completion_date: { [Op.ne]: null } },
            group: [sequelize.fn("YEAR", sequelize.col("completion_date"))],
            order: [[sequelize.fn("YEAR", sequelize.col("completion_date")), "ASC"]],
            raw: true
        });

        return res.status(200).json({
            success: true,
            data: {
                byProgramme: byProgramme || [],
                graduationsByYear: graduationsByYear || []
            }
        });
    } catch (error) {
        console.error("Error fetching degree stats:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Failed to fetch degree analytics" });
    }
};

// get stats for professional licences
const getLicenceStats = async (req, res) => {
    try {
        const { yearFrom, yearTo, programme } = req.query;

        const profileInclude = [];
        const degreeWhere = {};
        if (programme) degreeWhere.title = programme;
        
        if (yearFrom || yearTo) {
            const yearRange = {};
            if (yearFrom) yearRange[Op.gte] = new Date(`${yearFrom}-01-01`);
            if (yearTo) yearRange[Op.lte] = new Date(`${yearTo}-12-31`);
            degreeWhere.completion_date = yearRange;
        }

        if (programme || yearFrom || yearTo) {
            profileInclude.push({
                model: Profile,
                attributes: [],
                required: true,
                include: [{
                    model: Degree,
                    attributes: [],
                    required: true,
                    where: degreeWhere
                }]
            });
        }

        const totalLicences = await Licence.count({ include: profileInclude });

        const mostPopular = await Licence.findAll({
            attributes: [
                "title",
                [sequelize.fn("COUNT", sequelize.col("Licence.id")), "count"]
            ],
            include: profileInclude,
            group: ["Licence.title"],
            order: [[sequelize.fn("COUNT", sequelize.col("Licence.id")), "DESC"]],
            limit: 10,
            raw: true,
            subQuery: false
        });

        const mostPopularWithPercentage = mostPopular.map(lic => ({
            title: lic.title,
            count: parseInt(lic.count),
            percentage: totalLicences > 0 ? parseFloat(((lic.count / totalLicences) * 100).toFixed(1)) : 0
        }));

        const trendsOverTime = await Licence.findAll({
            attributes: [
                "title",
                [sequelize.fn("YEAR", sequelize.col("Licence.completion_date")), "year"],
                [sequelize.fn("MONTH", sequelize.col("Licence.completion_date")), "month"],
                [sequelize.fn("COUNT", sequelize.col("Licence.id")), "count"]
            ],
            where: {
                completion_date: { [Op.ne]: null }
            },
            include: profileInclude,
            group: [
                sequelize.fn("YEAR", sequelize.col("Licence.completion_date")),
                sequelize.fn("MONTH", sequelize.col("Licence.completion_date")),
                "Licence.title"
            ],
            order: [
                [sequelize.fn("YEAR", sequelize.col("Licence.completion_date")), "ASC"],
                [sequelize.fn("MONTH", sequelize.col("Licence.completion_date")), "ASC"]
            ],
            raw: true,
            subQuery: false
        });

        return res.status(200).json({
            success: true,
            data: {
                mostPopular: mostPopularWithPercentage || [],
                trendsOverTime: trendsOverTime || []
            }
        });
    } catch (error) {
        console.error("Error fetching licence stats:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Failed to fetch licence analytics" });
    }
};

// get bidding stats for the charts bid by month
const getBiddingStats = async (req, res) => {
    try {
        const dailyBids = await Bid.findAll({
            attributes: [
                [sequelize.fn("DATE", sequelize.col("target_date")), "date"],
                [sequelize.fn("COUNT", sequelize.col("id")), "totalBids"],
                [sequelize.fn("MAX", sequelize.col("bid_amount")), "winningAmount"]
            ],
            where: {
                status: { [Op.in]: ["pending", "won"] }
            },
            group: [sequelize.fn("DATE", sequelize.col("target_date"))],
            order: [[sequelize.fn("DATE", sequelize.col("target_date")), "ASC"]],
            raw: true
        });

        const topBidders = await Bid.findAll({
            attributes: [
                "UserId",
                [sequelize.fn("COUNT", sequelize.col("Bid.id")), "totalWins"]
            ],
            where: { status: "won" },
            include: [{
                model: User,
                attributes: ["email"]
            }],
            group: ["UserId", "User.id", "User.email"],
            order: [[sequelize.fn("COUNT", sequelize.col("Bid.id")), "DESC"]],
            limit: 10,
            subQuery: false,
            raw: true
        });

        const averageBidByMonth = await Bid.findAll({
            attributes: [
                [sequelize.fn("YEAR", sequelize.col("target_date")), "year"],
                [sequelize.fn("MONTH", sequelize.col("target_date")), "month"],
                [sequelize.fn("AVG", sequelize.col("bid_amount")), "averageAmount"]
            ],
            group: [
                sequelize.fn("YEAR", sequelize.col("target_date")),
                sequelize.fn("MONTH", sequelize.col("target_date"))
            ],
            order: [
                [sequelize.fn("YEAR", sequelize.col("target_date")), "ASC"],
                [sequelize.fn("MONTH", sequelize.col("target_date")), "ASC"]
            ],
            raw: true
        });

        return res.status(200).json({
            success: true,
            data: {
                dailyBids: dailyBids || [],
                topBidders: topBidders || [],
                averageBidByMonth: averageBidByMonth || []
            }
        });
    } catch (error) {
        console.error("Error fetching bidding stats:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Failed to fetch bidding history" });
    }
};

// Returns paginated alumni list with sub-models, supports filters (programme, graduationYear, company)
const getAlumniList = async (req, res) => {
    try {
        const { programme, yearFrom, yearTo, graduationYear, company, page, limit: queryLimit } = req.query;

        const limit = parseInt(queryLimit) || 20;
        const currentPage = parseInt(page) || 1;
        const offset = (currentPage - 1) * limit;

        const degreeInclude = { model: Degree, required: !!(programme || yearFrom || yearTo) };
        const degreeWhere = {};
        if (programme) degreeWhere.title = programme;
        
        if (yearFrom || yearTo) {
            const yearRange = {};
            if (yearFrom) yearRange[Op.gte] = new Date(`${yearFrom}-01-01`);
            if (yearTo) yearRange[Op.lte] = new Date(`${yearTo}-12-31`);
            degreeWhere.completion_date = yearRange;
        }
        
        if (Object.keys(degreeWhere).length > 0) {
            degreeInclude.where = degreeWhere;
        }

        const employmentInclude = { model: EmploymentHistory };
        if (company) {
            employmentInclude.where = { company };
        }

        const { count, rows } = await User.findAndCountAll({
            where: { is_verified: true, role: 'alumni' },
            include: [{
                model: Profile,
                required: false, // Ensure we show alumni even if they haven't set up a profile yet
                include: [
                    { ...degreeInclude, required: !!(programme || graduationYear) },
                    { model: Certification, required: false },
                    { model: Licence, required: false },
                    { model: ProfessionalCourse, required: false },
                    { ...employmentInclude, required: !!company }
                ]
            }],
            limit,
            offset,
            distinct: true
            // Removed subQuery: false to fix pagination truncation
        });

        return res.status(200).json({
            success: true,
            data: {
                alumni: rows || [],
                total: count || 0,
                page: currentPage,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching alumni list:", error);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Failed to fetch alumni list" });
    }
};

module.exports = {
    getOverview,
    getCertificationStats,
    getCourseStats,
    getEmploymentStats,
    getDegreeStats,
    getLicenceStats,
    getBiddingStats,
    getAlumniList
};
