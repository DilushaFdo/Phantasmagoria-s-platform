const express = require("express");
const router = express.Router();
const apiTrackingMiddleware = require("../../lib/apiTrackingMiddleware");
const authMiddleware = require("../../lib/authMiddleware");
const analyticsController = require("../../controllers/analyticsController");

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Get analytics overview statistics
 *     description: Returns a high-level summary including total verified alumni, active bids, today's influencer, most popular certification, and most popular job role.
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
 *         example: "Bearer 1a2b3c4d5e..."
 *     responses:
 *       200:
 *         description: Overview stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAlumni:
 *                   type: integer
 *                   example: 150
 *                 totalActiveBids:
 *                   type: integer
 *                   example: 12
 *                 todayInfluencer:
 *                   type: object
 *                   nullable: true
 *                 mostPopularCertification:
 *                   type: object
 *                   nullable: true
 *                 mostPopularRole:
 *                   type: object
 *                   nullable: true
 *       401:
 *         description: Unauthorized — API key missing or invalid
 *       403:
 *         description: Forbidden — API key lacks read:analytics scope
 *       500:
 *         description: Internal server error
 */
router.get(
    "/overview", 
    authMiddleware.optional,
    apiTrackingMiddleware("read:analytics"), 
    analyticsController.getOverview
);

/**
 * @swagger
 * /api/analytics/certifications:
 *   get:
 *     summary: Get certification statistics
 *     description: Returns the most popular certifications and their acquisition trends over time.
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
 *       - in: query
 *         name: programme
 *         schema:
 *           type: string
 *         description: Filter by degree programme
 *       - in: query
 *         name: graduationYear
 *         schema:
 *           type: integer
 *         description: Filter by certification completion year
 *     responses:
 *       200:
 *         description: Certification stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mostPopular:
 *                   type: array
 *                   items:
 *                     type: object
 *                 trendsOverTime:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get(
    "/certifications", 
    authMiddleware.optional,
    apiTrackingMiddleware("read:analytics"), 
    analyticsController.getCertificationStats
);

/**
 * @swagger
 * /api/analytics/courses:
 *   get:
 *     summary: Get professional course statistics
 *     description: Returns the most popular professional courses and trends over time.
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
 *       - in: query
 *         name: programme
 *         schema:
 *           type: string
 *         description: Filter by degree programme
 *       - in: query
 *         name: graduationYear
 *         schema:
 *           type: integer
 *         description: Filter by course completion year
 *     responses:
 *       200:
 *         description: Course stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mostPopular:
 *                   type: array
 *                   items:
 *                     type: object
 *                 trendsOverTime:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get(
    "/courses", 
    authMiddleware.optional,
    apiTrackingMiddleware("read:analytics"), 
    analyticsController.getCourseStats
);

/**
 * @swagger
 * /api/analytics/employment:
 *   get:
 *     summary: Get employment statistics
 *     description: Returns top job roles, top employers, and employment trends.
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
 *       - in: query
 *         name: programme
 *         schema:
 *           type: string
 *         description: Filter by degree programme
 *       - in: query
 *         name: graduationYear
 *         schema:
 *           type: integer
 *         description: Filter by employment start year
 *     responses:
 *       200:
 *         description: Employment stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topRoles:
 *                   type: array
 *                   items:
 *                     type: object
 *                 topEmployers:
 *                   type: array
 *                   items:
 *                     type: object
 *                 employmentTrends:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get(
    "/employment", 
    authMiddleware.optional,
    apiTrackingMiddleware("read:analytics"), 
    analyticsController.getEmploymentStats
);

/**
 * @swagger
 * /api/analytics/degrees:
 *   get:
 *     summary: Get degree statistics
 *     description: Returns the distribution of alumni by degree programme and graduation year trends.
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
 *     responses:
 *       200:
 *         description: Degree stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 byProgramme:
 *                   type: array
 *                   items:
 *                     type: object
 *                 graduationsByYear:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get(
    "/degrees", 
    authMiddleware.optional,
    apiTrackingMiddleware("read:analytics"), 
    analyticsController.getDegreeStats
);

/**
 * @swagger
 * /api/analytics/licences:
 *   get:
 *     summary: Get licence statistics
 *     description: Returns the most popular professional licences and acquisition trends over time.
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
 *       - in: query
 *         name: programme
 *         schema:
 *           type: string
 *         description: Filter by degree programme
 *       - in: query
 *         name: graduationYear
 *         schema:
 *           type: integer
 *         description: Filter by licence completion year
 *     responses:
 *       200:
 *         description: Licence stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mostPopular:
 *                   type: array
 *                   items:
 *                     type: object
 *                 trendsOverTime:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get(
    "/licences", 
    authMiddleware.optional,
    apiTrackingMiddleware("read:analytics"), 
    analyticsController.getLicenceStats
);

/**
 * @swagger
 * /api/analytics/bidding:
 *   get:
 *     summary: Get bidding statistics
 *     description: Returns daily bid counts, top 10 winning bidders, and average bid amount by month.
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
 *     responses:
 *       200:
 *         description: Bidding stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dailyBids:
 *                   type: array
 *                   items:
 *                     type: object
 *                 topBidders:
 *                   type: array
 *                   items:
 *                     type: object
 *                 averageBidByMonth:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get(
    "/bidding", 
    authMiddleware.optional,
    apiTrackingMiddleware("read:analytics"), 
    analyticsController.getBiddingStats
);

/**
 * @swagger
 * /api/analytics/alumni:
 *   get:
 *     summary: Get paginated alumni list
 *     description: Returns a paginated list of all verified alumni including their full profiles.
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
 *       - in: query
 *         name: programme
 *         schema:
 *           type: string
 *         description: Filter alumni by degree programme
 *       - in: query
 *         name: graduationYear
 *         schema:
 *           type: integer
 *         description: Filter alumni by graduation year
 *       - in: query
 *         name: company
 *         schema:
 *           type: string
 *         description: Filter alumni by employer company
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of records per page
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
 *                 total:
 *                   type: integer
 *                   example: 150
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 8
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get(
    "/alumni", 
    authMiddleware.optional,
    apiTrackingMiddleware("read:alumni"), 
    analyticsController.getAlumniList
);

module.exports = router;
