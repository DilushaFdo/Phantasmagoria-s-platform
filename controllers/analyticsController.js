const { User, Profile, Degree, Certification, Licence, ProfessionalCourse, EmploymentHistory, Bid } = require("../models");
const sequelize = require("../db");
const { Op } = require("sequelize");

// Returns a high-level dashboard summary: total alumni, active bids, today's influencer, top cert and sector
const getOverview = async (req, res) => {
    try {
        const totalAlumni = await User.count({ where: { is_verified: true } });
        const totalActiveBids = await Bid.count({ where: { status: "pending" } });

        const todayInfluencer = await Profile.findOne({
            where: { is_featured_today: true },
            include: [{ model: User, attributes: ["email"] }]
        });

        const mostPopularCertification = await Certification.findAll({
            attributes: [
                "title",
                [sequelize.fn("COUNT", sequelize.col("id")), "count"]
            ],
            group: ["title"],
            order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
            limit: 1,
            raw: true
        });

        const mostPopularSector = await EmploymentHistory.findAll({
            attributes: [
                "company",
                [sequelize.fn("COUNT", sequelize.col("id")), "count"]
            ],
            group: ["company"],
            order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
            limit: 1,
            raw: true
        });

        return res.status(200).json({
            totalAlumni,
            totalActiveBids,
            todayInfluencer,
            mostPopularCertification: mostPopularCertification[0] || null,
            mostPopularSector: mostPopularSector[0] || null
        });
    } catch (error) {
        console.error("Error fetching overview:", error);
        return res.status(500).json({ error: "Failed to fetch overview data" });
    }
};

// Returns certification analytics: most popular, trends over time, and top providers
const getCertifications = async (req, res) => {
    try {
        const { graduationYear, programme } = req.query;

        // Build optional include for filtering by programme (Certification → Profile → Degree)
        const profileInclude = [];
        if (programme) {
            profileInclude.push({
                model: Profile,
                attributes: [],
                include: [{
                    model: Degree,
                    attributes: [],
                    where: { title: programme }
                }]
            });
        }

        // Build optional where clause for graduation year filter
        const whereClause = {};
        if (graduationYear) {
            whereClause[Op.and] = [
                sequelize.where(sequelize.fn("YEAR", sequelize.col("Certification.completion_date")), graduationYear)
            ];
        }

        const totalCertifications = await Certification.count({ where: whereClause, include: profileInclude });

        // Top 10 most popular certifications by count
        const mostPopular = await Certification.findAll({
            attributes: [
                "title",
                [sequelize.fn("COUNT", sequelize.col("Certification.id")), "count"]
            ],
            where: whereClause,
            include: profileInclude,
            group: ["title"],
            order: [[sequelize.fn("COUNT", sequelize.col("Certification.id")), "DESC"]],
            limit: 10,
            raw: true,
            subQuery: false
        });

        // Add percentage to each certification
        const mostPopularWithPercentage = mostPopular.map(cert => ({
            title: cert.title,
            count: parseInt(cert.count),
            percentage: totalCertifications > 0 ? parseFloat(((cert.count / totalCertifications) * 100).toFixed(1)) : 0
        }));

        // Trends over time grouped by month and year
        const trendsOverTime = await Certification.findAll({
            attributes: [
                "title",
                [sequelize.fn("YEAR", sequelize.col("Certification.completion_date")), "year"],
                [sequelize.fn("MONTH", sequelize.col("Certification.completion_date")), "month"],
                [sequelize.fn("COUNT", sequelize.col("Certification.id")), "count"]
            ],
            where: {
                ...whereClause,
                completion_date: { [Op.ne]: null }
            },
            include: profileInclude,
            group: [
                sequelize.fn("YEAR", sequelize.col("Certification.completion_date")),
                sequelize.fn("MONTH", sequelize.col("Certification.completion_date")),
                "title"
            ],
            order: [
                [sequelize.fn("YEAR", sequelize.col("Certification.completion_date")), "ASC"],
                [sequelize.fn("MONTH", sequelize.col("Certification.completion_date")), "ASC"]
            ],
            raw: true,
            subQuery: false
        });

        // Top providers by extracting domain from the URL
        const topProviders = await Certification.findAll({
            attributes: [
                [sequelize.fn("SUBSTRING_INDEX", sequelize.col("url"), "/", 3), "provider"],
                [sequelize.fn("COUNT", sequelize.col("Certification.id")), "count"]
            ],
            where: whereClause,
            include: profileInclude,
            group: [sequelize.fn("SUBSTRING_INDEX", sequelize.col("url"), "/", 3)],
            order: [[sequelize.fn("COUNT", sequelize.col("Certification.id")), "DESC"]],
            limit: 10,
            raw: true,
            subQuery: false
        });

        return res.status(200).json({
            mostPopular: mostPopularWithPercentage,
            trendsOverTime,
            topProviders
        });
    } catch (error) {
        console.error("Error fetching certification analytics:", error);
        return res.status(500).json({ error: "Failed to fetch certification analytics" });
    }
};

// Returns professional course analytics: most popular, trends over time, and top providers
const getCourses = async (req, res) => {
    try {
        const { graduationYear, programme } = req.query;

        // Build optional include for filtering by programme (ProfessionalCourse → Profile → Degree)
        const profileInclude = [];
        if (programme) {
            profileInclude.push({
                model: Profile,
                attributes: [],
                include: [{
                    model: Degree,
                    attributes: [],
                    where: { title: programme }
                }]
            });
        }

        // Build optional where clause for graduation year filter
        const whereClause = {};
        if (graduationYear) {
            whereClause[Op.and] = [
                sequelize.where(sequelize.fn("YEAR", sequelize.col("ProfessionalCourse.completion_date")), graduationYear)
            ];
        }

        const totalCourses = await ProfessionalCourse.count({ where: whereClause, include: profileInclude });

        // Top 10 most popular courses by count
        const mostPopular = await ProfessionalCourse.findAll({
            attributes: [
                "title",
                [sequelize.fn("COUNT", sequelize.col("ProfessionalCourse.id")), "count"]
            ],
            where: whereClause,
            include: profileInclude,
            group: ["title"],
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

        // Trends over time grouped by month and year
        const trendsOverTime = await ProfessionalCourse.findAll({
            attributes: [
                "title",
                [sequelize.fn("YEAR", sequelize.col("ProfessionalCourse.completion_date")), "year"],
                [sequelize.fn("MONTH", sequelize.col("ProfessionalCourse.completion_date")), "month"],
                [sequelize.fn("COUNT", sequelize.col("ProfessionalCourse.id")), "count"]
            ],
            where: {
                ...whereClause,
                completion_date: { [Op.ne]: null }
            },
            include: profileInclude,
            group: [
                sequelize.fn("YEAR", sequelize.col("ProfessionalCourse.completion_date")),
                sequelize.fn("MONTH", sequelize.col("ProfessionalCourse.completion_date")),
                "title"
            ],
            order: [
                [sequelize.fn("YEAR", sequelize.col("ProfessionalCourse.completion_date")), "ASC"],
                [sequelize.fn("MONTH", sequelize.col("ProfessionalCourse.completion_date")), "ASC"]
            ],
            raw: true,
            subQuery: false
        });

        // Top providers by extracting domain from URL
        const topProviders = await ProfessionalCourse.findAll({
            attributes: [
                [sequelize.fn("SUBSTRING_INDEX", sequelize.col("url"), "/", 3), "provider"],
                [sequelize.fn("COUNT", sequelize.col("ProfessionalCourse.id")), "count"]
            ],
            where: whereClause,
            include: profileInclude,
            group: [sequelize.fn("SUBSTRING_INDEX", sequelize.col("url"), "/", 3)],
            order: [[sequelize.fn("COUNT", sequelize.col("ProfessionalCourse.id")), "DESC"]],
            limit: 10,
            raw: true,
            subQuery: false
        });

        return res.status(200).json({
            mostPopular: mostPopularWithPercentage,
            trendsOverTime,
            topProviders
        });
    } catch (error) {
        console.error("Error fetching course analytics:", error);
        return res.status(500).json({ error: "Failed to fetch course analytics" });
    }
};

// Returns employment analytics: by sector (company), top roles, top employers, and trends
const getEmployment = async (req, res) => {
    try {
        const { graduationYear } = req.query;

        const whereClause = {};
        if (graduationYear) {
            whereClause[Op.and] = [
                sequelize.where(sequelize.fn("YEAR", sequelize.col("start_date")), graduationYear)
            ];
        }

        const totalRecords = await EmploymentHistory.count({ where: whereClause });

        // Group by company as a proxy for sector analytics
        const bySector = await EmploymentHistory.findAll({
            attributes: [
                "company",
                [sequelize.fn("COUNT", sequelize.col("id")), "count"]
            ],
            where: whereClause,
            group: ["company"],
            order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
            raw: true
        });

        const bySectorWithPercentage = bySector.map(item => ({
            company: item.company,
            count: parseInt(item.count),
            percentage: totalRecords > 0 ? parseFloat(((item.count / totalRecords) * 100).toFixed(1)) : 0
        }));

        // Top 10 job roles
        const topRoles = await EmploymentHistory.findAll({
            attributes: [
                "job_title",
                [sequelize.fn("COUNT", sequelize.col("id")), "count"]
            ],
            where: whereClause,
            group: ["job_title"],
            order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
            limit: 10,
            raw: true
        });

        // Top 10 employers
        const topEmployers = await EmploymentHistory.findAll({
            attributes: [
                "company",
                [sequelize.fn("COUNT", sequelize.col("id")), "count"]
            ],
            where: whereClause,
            group: ["company"],
            order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
            limit: 10,
            raw: true
        });

        // Employment trends over time grouped by year and job title
        const employmentTrends = await EmploymentHistory.findAll({
            attributes: [
                "job_title",
                [sequelize.fn("YEAR", sequelize.col("start_date")), "year"],
                [sequelize.fn("COUNT", sequelize.col("id")), "count"]
            ],
            where: {
                ...whereClause,
                start_date: { [Op.ne]: null }
            },
            group: [
                sequelize.fn("YEAR", sequelize.col("start_date")),
                "job_title"
            ],
            order: [
                [sequelize.fn("YEAR", sequelize.col("start_date")), "ASC"]
            ],
            raw: true
        });

        return res.status(200).json({
            bySector: bySectorWithPercentage,
            topRoles,
            topEmployers,
            employmentTrends
        });
    } catch (error) {
        console.error("Error fetching employment analytics:", error);
        return res.status(500).json({ error: "Failed to fetch employment analytics" });
    }
};

// Returns degree analytics: programme distribution and graduations by year
const getDegrees = async (req, res) => {
    try {
        // Distribution by degree programme
        const byProgramme = await Degree.findAll({
            attributes: [
                "title",
                [sequelize.fn("COUNT", sequelize.col("id")), "count"]
            ],
            group: ["title"],
            order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
            raw: true
        });

        // Graduations per year
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
            byProgramme,
            graduationsByYear
        });
    } catch (error) {
        console.error("Error fetching degree analytics:", error);
        return res.status(500).json({ error: "Failed to fetch degree analytics" });
    }
};

// Returns licence analytics: most popular and trends over time
const getLicences = async (req, res) => {
    try {
        const { graduationYear } = req.query;

        const whereClause = {};
        if (graduationYear) {
            whereClause[Op.and] = [
                sequelize.where(sequelize.fn("YEAR", sequelize.col("completion_date")), graduationYear)
            ];
        }

        const totalLicences = await Licence.count({ where: whereClause });

        // Most popular licences by count
        const mostPopular = await Licence.findAll({
            attributes: [
                "title",
                [sequelize.fn("COUNT", sequelize.col("id")), "count"]
            ],
            where: whereClause,
            group: ["title"],
            order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
            limit: 10,
            raw: true
        });

        const mostPopularWithPercentage = mostPopular.map(lic => ({
            title: lic.title,
            count: parseInt(lic.count),
            percentage: totalLicences > 0 ? parseFloat(((lic.count / totalLicences) * 100).toFixed(1)) : 0
        }));

        // Trends over time grouped by month and year
        const trendsOverTime = await Licence.findAll({
            attributes: [
                "title",
                [sequelize.fn("YEAR", sequelize.col("completion_date")), "year"],
                [sequelize.fn("MONTH", sequelize.col("completion_date")), "month"],
                [sequelize.fn("COUNT", sequelize.col("id")), "count"]
            ],
            where: {
                ...whereClause,
                completion_date: { [Op.ne]: null }
            },
            group: [
                sequelize.fn("YEAR", sequelize.col("completion_date")),
                sequelize.fn("MONTH", sequelize.col("completion_date")),
                "title"
            ],
            order: [
                [sequelize.fn("YEAR", sequelize.col("completion_date")), "ASC"],
                [sequelize.fn("MONTH", sequelize.col("completion_date")), "ASC"]
            ],
            raw: true
        });

        return res.status(200).json({
            mostPopular: mostPopularWithPercentage,
            trendsOverTime
        });
    } catch (error) {
        console.error("Error fetching licence analytics:", error);
        return res.status(500).json({ error: "Failed to fetch licence analytics" });
    }
};

// Returns bidding history: daily bids, top bidders, and average bid by month
const getBiddingHistory = async (req, res) => {
    try {
        // Daily bid counts and winning amounts
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

        // Top 10 bidders by total wins and total spend
        const topBidders = await Bid.findAll({
            attributes: [
                "UserId",
                [sequelize.fn("COUNT", sequelize.col("Bid.id")), "totalWins"],
                [sequelize.fn("SUM", sequelize.col("bid_amount")), "totalSpent"]
            ],
            where: { status: "won" },
            include: [{
                model: User,
                attributes: ["email"]
            }],
            group: ["UserId", "User.id", "User.email"],
            order: [[sequelize.fn("COUNT", sequelize.col("Bid.id")), "DESC"]],
            limit: 10,
            subQuery: false
        });

        // Average bid amount grouped by month and year
        const averageBidByMonth = await Bid.findAll({
            attributes: [
                [sequelize.fn("YEAR", sequelize.col("target_date")), "year"],
                [sequelize.fn("MONTH", sequelize.col("target_date")), "month"],
                [sequelize.fn("AVG", sequelize.col("bid_amount")), "averageAmount"],
                [sequelize.fn("COUNT", sequelize.col("id")), "totalBids"]
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
            dailyBids,
            topBidders,
            averageBidByMonth
        });
    } catch (error) {
        console.error("Error fetching bidding history:", error);
        return res.status(500).json({ error: "Failed to fetch bidding history" });
    }
};

// Returns paginated list of verified alumni with full profiles, supports filtering by programme, graduationYear, and sector
const getAlumniList = async (req, res) => {
    try {
        const { programme, graduationYear, sector, page, limit: queryLimit } = req.query;

        const limit = parseInt(queryLimit) || 20;
        const currentPage = parseInt(page) || 1;
        const offset = (currentPage - 1) * limit;

        // Build the Degree include with optional filters
        const degreeInclude = { model: Degree };
        if (programme) {
            degreeInclude.where = { title: programme };
        }
        if (graduationYear) {
            degreeInclude.where = {
                ...degreeInclude.where,
                [Op.and]: [
                    sequelize.where(sequelize.fn("YEAR", sequelize.col("Degrees.completion_date")), graduationYear)
                ]
            };
        }

        // Build the EmploymentHistory include with optional sector (company) filter
        const employmentInclude = { model: EmploymentHistory };
        if (sector) {
            employmentInclude.where = { company: sector };
        }

        const { count, rows } = await User.findAndCountAll({
            where: { is_verified: true },
            include: [{
                model: Profile,
                include: [
                    degreeInclude,
                    { model: Certification },
                    { model: Licence },
                    { model: ProfessionalCourse },
                    employmentInclude
                ]
            }],
            limit,
            offset,
            distinct: true,
            subQuery: false
        });

        return res.status(200).json({
            alumni: rows,
            total: count,
            page: currentPage,
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error("Error fetching alumni list:", error);
        return res.status(500).json({ error: "Failed to fetch alumni list" });
    }
};

module.exports = {
    getOverview,
    getCertifications,
    getCourses,
    getEmployment,
    getDegrees,
    getLicences,
    getBiddingHistory,
    getAlumniList
};
