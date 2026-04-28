const express = require("express");
const router = express.Router();
const apiTrackingMiddleware = require("../../lib/apiTrackingMiddleware");
const {
    getOverview,
    getCertifications,
    getCourses,
    getEmployment,
    getDegrees,
    getLicences,
    getBiddingHistory,
    getAlumniList
} = require("../../controllers/analyticsController");

/**
 * @swagger
 * /api/public/analytics/overview:
 *   get:
 *     summary: Get dashboard overview statistics
 *     description: Returns a high-level summary for the analytics dashboard including total verified alumni, active bids, today's featured influencer, and the most popular certification and employer.
 *     tags: [Analytics]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: "Bearer {apiKey} — requires read:analytics scope"
 *         example: "Bearer a3f8c9d2e1b04a5f..."
 *     responses:
 *       200:
 *         description: Overview data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAlumni:
 *                   type: integer
 *                   example: 42
 *                 totalActiveBids:
 *                   type: integer
 *                   example: 5
 *                 todayInfluencer:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 3
 *                     biography:
 *                       type: string
 *                       example: "Award-winning CS graduate specialising in AI."
 *                     linkedin_url:
 *                       type: string
 *                       example: "https://linkedin.com/in/janedoe"
 *                     is_featured_today:
 *                       type: boolean
 *                       example: true
 *                     User:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                           example: "jane@my.westminster.ac.uk"
 *                 mostPopularCertification:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "AWS Solutions Architect"
 *                     count:
 *                       type: integer
 *                       example: 12
 *                 mostPopularSector:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     company:
 *                       type: string
 *                       example: "Google"
 *                     count:
 *                       type: integer
 *                       example: 8
 *       401:
 *         description: Unauthorized — API key is missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized: API key is missing"
 *       403:
 *         description: Forbidden — API key lacks the read:analytics scope
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Forbidden: This API key lacks the required scope: 'read:analytics'"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch overview data"
 */
router.get("/analytics/overview", apiTrackingMiddleware("read:analytics"), getOverview);

/**
 * @swagger
 * /api/public/analytics/certifications:
 *   get:
 *     summary: Get certification analytics
 *     description: Returns the top 10 most popular certifications with percentages, monthly/yearly trends, and top certification providers extracted from URLs. Supports optional filtering by degree programme and graduation year.
 *     tags: [Analytics]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: "Bearer {apiKey} — requires read:analytics scope"
 *         example: "Bearer a3f8c9d2e1b04a5f..."
 *       - in: query
 *         name: programme
 *         schema:
 *           type: string
 *         description: Filter results to alumni enrolled in this degree programme
 *         example: "Computer Science"
 *       - in: query
 *         name: graduationYear
 *         schema:
 *           type: integer
 *         description: Filter by certification completion year
 *         example: 2024
 *     responses:
 *       200:
 *         description: Certification analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mostPopular:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "AWS Solutions Architect"
 *                       count:
 *                         type: integer
 *                         example: 12
 *                       percentage:
 *                         type: number
 *                         example: 28.6
 *                 trendsOverTime:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "Docker Certified Associate"
 *                       year:
 *                         type: integer
 *                         example: 2025
 *                       month:
 *                         type: integer
 *                         example: 3
 *                       count:
 *                         type: integer
 *                         example: 4
 *                 topProviders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       provider:
 *                         type: string
 *                         example: "https://www.coursera.org"
 *                       count:
 *                         type: integer
 *                         example: 15
 *       401:
 *         description: Unauthorized — API key is missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized: API key is missing"
 *       403:
 *         description: Forbidden — API key lacks the read:analytics scope
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Forbidden: This API key lacks the required scope: 'read:analytics'"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch certification analytics"
 */
router.get("/analytics/certifications", apiTrackingMiddleware("read:analytics"), getCertifications);

/**
 * @swagger
 * /api/public/analytics/courses:
 *   get:
 *     summary: Get professional course analytics
 *     description: Returns the top 10 most completed professional courses with percentages, monthly/yearly completion trends, and top course providers extracted from URLs. Supports optional filtering by degree programme and graduation year.
 *     tags: [Analytics]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: "Bearer {apiKey} — requires read:analytics scope"
 *         example: "Bearer a3f8c9d2e1b04a5f..."
 *       - in: query
 *         name: programme
 *         schema:
 *           type: string
 *         description: Filter results to alumni enrolled in this degree programme
 *         example: "Business Management"
 *       - in: query
 *         name: graduationYear
 *         schema:
 *           type: integer
 *         description: Filter by course completion year
 *         example: 2025
 *     responses:
 *       200:
 *         description: Course analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mostPopular:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "Agile & Scrum Masterclass"
 *                       count:
 *                         type: integer
 *                         example: 9
 *                       percentage:
 *                         type: number
 *                         example: 31.0
 *                 trendsOverTime:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "Python for Data Science"
 *                       year:
 *                         type: integer
 *                         example: 2025
 *                       month:
 *                         type: integer
 *                         example: 6
 *                       count:
 *                         type: integer
 *                         example: 3
 *                 topProviders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       provider:
 *                         type: string
 *                         example: "https://www.udemy.com"
 *                       count:
 *                         type: integer
 *                         example: 11
 *       401:
 *         description: Unauthorized — API key is missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized: API key is missing"
 *       403:
 *         description: Forbidden — API key lacks the read:analytics scope
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Forbidden: This API key lacks the required scope: 'read:analytics'"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch course analytics"
 */
router.get("/analytics/courses", apiTrackingMiddleware("read:analytics"), getCourses);

/**
 * @swagger
 * /api/public/analytics/employment:
 *   get:
 *     summary: Get employment analytics
 *     description: Returns alumni employment data grouped by company (sector proxy), top 10 job roles, top 10 employers, and year-over-year employment trends. Supports optional filtering by start date year.
 *     tags: [Analytics]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: "Bearer {apiKey} — requires read:analytics scope"
 *         example: "Bearer a3f8c9d2e1b04a5f..."
 *       - in: query
 *         name: graduationYear
 *         schema:
 *           type: integer
 *         description: Filter by employment start date year
 *         example: 2024
 *     responses:
 *       200:
 *         description: Employment analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bySector:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       company:
 *                         type: string
 *                         example: "Google"
 *                       count:
 *                         type: integer
 *                         example: 8
 *                       percentage:
 *                         type: number
 *                         example: 19.0
 *                 topRoles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       job_title:
 *                         type: string
 *                         example: "Software Engineer"
 *                       count:
 *                         type: integer
 *                         example: 14
 *                 topEmployers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       company:
 *                         type: string
 *                         example: "Microsoft"
 *                       count:
 *                         type: integer
 *                         example: 6
 *                 employmentTrends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       job_title:
 *                         type: string
 *                         example: "Data Analyst"
 *                       year:
 *                         type: integer
 *                         example: 2025
 *                       count:
 *                         type: integer
 *                         example: 5
 *       401:
 *         description: Unauthorized — API key is missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized: API key is missing"
 *       403:
 *         description: Forbidden — API key lacks the read:analytics scope
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Forbidden: This API key lacks the required scope: 'read:analytics'"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch employment analytics"
 */
router.get("/analytics/employment", apiTrackingMiddleware("read:analytics"), getEmployment);

/**
 * @swagger
 * /api/public/analytics/degrees:
 *   get:
 *     summary: Get degree programme analytics
 *     description: Returns the distribution of alumni across degree programmes and the number of graduations per year.
 *     tags: [Analytics]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: "Bearer {apiKey} — requires read:analytics scope"
 *         example: "Bearer a3f8c9d2e1b04a5f..."
 *     responses:
 *       200:
 *         description: Degree analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 byProgramme:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "Computer Science"
 *                       count:
 *                         type: integer
 *                         example: 18
 *                 graduationsByYear:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       year:
 *                         type: integer
 *                         example: 2024
 *                       count:
 *                         type: integer
 *                         example: 12
 *       401:
 *         description: Unauthorized — API key is missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized: API key is missing"
 *       403:
 *         description: Forbidden — API key lacks the read:analytics scope
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Forbidden: This API key lacks the required scope: 'read:analytics'"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch degree analytics"
 */
router.get("/analytics/degrees", apiTrackingMiddleware("read:analytics"), getDegrees);

/**
 * @swagger
 * /api/public/analytics/licences:
 *   get:
 *     summary: Get licence analytics
 *     description: Returns the top 10 most popular professional licences with percentages and monthly/yearly acquisition trends. Supports optional filtering by graduation year.
 *     tags: [Analytics]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: "Bearer {apiKey} — requires read:analytics scope"
 *         example: "Bearer a3f8c9d2e1b04a5f..."
 *       - in: query
 *         name: graduationYear
 *         schema:
 *           type: integer
 *         description: Filter by licence completion year
 *         example: 2025
 *     responses:
 *       200:
 *         description: Licence analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mostPopular:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "ACCA"
 *                       count:
 *                         type: integer
 *                         example: 7
 *                       percentage:
 *                         type: number
 *                         example: 35.0
 *                 trendsOverTime:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "CFA Level 1"
 *                       year:
 *                         type: integer
 *                         example: 2025
 *                       month:
 *                         type: integer
 *                         example: 1
 *                       count:
 *                         type: integer
 *                         example: 2
 *       401:
 *         description: Unauthorized — API key is missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized: API key is missing"
 *       403:
 *         description: Forbidden — API key lacks the read:analytics scope
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Forbidden: This API key lacks the required scope: 'read:analytics'"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch licence analytics"
 */
router.get("/analytics/licences", apiTrackingMiddleware("read:analytics"), getLicences);

/**
 * @swagger
 * /api/public/analytics/bidding-history:
 *   get:
 *     summary: Get bidding history analytics
 *     description: Returns daily bid counts with winning amounts, the top 10 bidders ranked by total wins and spend, and the average bid amount grouped by month/year.
 *     tags: [Analytics]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: "Bearer {apiKey} — requires read:analytics scope"
 *         example: "Bearer a3f8c9d2e1b04a5f..."
 *     responses:
 *       200:
 *         description: Bidding history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dailyBids:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2026-04-28"
 *                       totalBids:
 *                         type: integer
 *                         example: 7
 *                       winningAmount:
 *                         type: number
 *                         example: 450.00
 *                 topBidders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       UserId:
 *                         type: integer
 *                         example: 5
 *                       totalWins:
 *                         type: integer
 *                         example: 3
 *                       totalSpent:
 *                         type: number
 *                         example: 1200.00
 *                       User:
 *                         type: object
 *                         properties:
 *                           email:
 *                             type: string
 *                             example: "topbidder@my.westminster.ac.uk"
 *                 averageBidByMonth:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       year:
 *                         type: integer
 *                         example: 2026
 *                       month:
 *                         type: integer
 *                         example: 4
 *                       averageAmount:
 *                         type: number
 *                         example: 275.50
 *                       totalBids:
 *                         type: integer
 *                         example: 22
 *       401:
 *         description: Unauthorized — API key is missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized: API key is missing"
 *       403:
 *         description: Forbidden — API key lacks the read:analytics scope
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Forbidden: This API key lacks the required scope: 'read:analytics'"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch bidding history"
 */
router.get("/analytics/bidding-history", apiTrackingMiddleware("read:analytics"), getBiddingHistory);

/**
 * @swagger
 * /api/public/alumni:
 *   get:
 *     summary: Get paginated list of verified alumni
 *     description: Returns a paginated list of all verified alumni with their full profiles including degrees, certifications, licences, professional courses, and employment history. Supports filtering by degree programme, graduation year, and employer (sector).
 *     tags: [Alumni]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: "Bearer {apiKey} — requires read:alumni scope"
 *         example: "Bearer a3f8c9d2e1b04a5f..."
 *       - in: query
 *         name: programme
 *         schema:
 *           type: string
 *         description: Filter alumni by degree programme title (exact match)
 *         example: "Computer Science"
 *       - in: query
 *         name: graduationYear
 *         schema:
 *           type: integer
 *         description: Filter alumni by degree completion year
 *         example: 2024
 *       - in: query
 *         name: sector
 *         schema:
 *           type: string
 *         description: Filter alumni by employer company name (exact match)
 *         example: "Google"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination (starts at 1)
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of alumni per page (max results per request)
 *         example: 20
 *     responses:
 *       200:
 *         description: Alumni list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 alumni:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       email:
 *                         type: string
 *                         example: "alumni@my.westminster.ac.uk"
 *                       Profile:
 *                         type: object
 *                         properties:
 *                           biography:
 *                             type: string
 *                             example: "Full-stack developer with 3 years experience."
 *                           linkedin_url:
 *                             type: string
 *                             example: "https://linkedin.com/in/alumniuser"
 *                           Degrees:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 title:
 *                                   type: string
 *                                   example: "Computer Science"
 *                                 completion_date:
 *                                   type: string
 *                                   format: date
 *                                   example: "2024-06-15"
 *                           Certifications:
 *                             type: array
 *                             items:
 *                               type: object
 *                           Licences:
 *                             type: array
 *                             items:
 *                               type: object
 *                           ProfessionalCourses:
 *                             type: array
 *                             items:
 *                               type: object
 *                           EmploymentHistories:
 *                             type: array
 *                             items:
 *                               type: object
 *                 total:
 *                   type: integer
 *                   example: 42
 *                   description: Total number of matching alumni
 *                 page:
 *                   type: integer
 *                   example: 1
 *                   description: Current page number
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *                   description: Total number of pages available
 *       401:
 *         description: Unauthorized — API key is missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized: API key is missing"
 *       403:
 *         description: Forbidden — API key lacks the read:alumni scope
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Forbidden: This API key lacks the required scope: 'read:alumni'"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch alumni list"
 */
router.get("/alumni", apiTrackingMiddleware("read:alumni"), getAlumniList);

module.exports = router;
