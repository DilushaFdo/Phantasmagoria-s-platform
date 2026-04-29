const express = require('express');
const router = express.Router();
const authMiddleware = require('../lib/authMiddleware');
const roleMiddleware = require('../lib/roleMiddleware');
const {
    generateKey,
    listKeys,
    revokeKey,
    getUsageStats,
    getDashboardSummary
} = require('../controllers/developerController');

/**
 * @swagger
 * /api/developer/keys:
 *   get:
 *     summary: List all API keys for the authenticated user
 *     description: Returns a list of API keys including their names, scopes, status, and last usage timestamp.
 *     tags: [Developer]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     responses:
 *       200:
 *         description: API keys retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 keys:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       scopes:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       last_used:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 */
router.get('/keys', authMiddleware, roleMiddleware(['developer', 'admin']), listKeys);


/**
 * @swagger
 * /api/developer/generate-key:
 *   post:
 *     summary: Generate a new API key for the authenticated user
 *     description: Creates a cryptographically secure 64-character API key bound to the authenticated user.
 *     tags: [Developer]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scopes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of permissions for the key. (e.g., ['public:read', 'stats:read'])
 *                 example: ["public:read"]
 *     responses:
 *       201:
 *         description: API key generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: API key generated successfully
 *                 key:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     key_string:
 *                       type: string
 *                       example: a3f8c9d2e1b04a5f6d7e8c9b0a1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9
 *                     status:
 *                       type: string
 *                       example: active
 *                     scopes:
 *                       type: string
 *                       example: "public:read"
 */
router.post('/generate-key', authMiddleware, roleMiddleware(['developer', 'admin']), generateKey);

/**
 * @swagger
 * /api/developer/revoke-key/{keyId}:
 *   put:
 *     summary: Revoke an existing API key
 *     description: Marks an API key as revoked so it can no longer be used for public API access.
 *     tags: [Developer]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The database ID of the API key to revoke
 *         example: 1
 *     responses:
 *       200:
 *         description: API key revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: API key revoked successfully
 *                 key:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     status:
 *                       type: string
 *                       example: revoked
 *       404:
 *         description: API key not found
 */
router.put('/revoke-key/:keyId', authMiddleware, roleMiddleware(['developer', 'admin']), revokeKey);

/**
 * @swagger
 * /api/developer/usage-stats:
 *   get:
 *     summary: Get raw usage statistics for the developer's API keys
 *     description: Returns all API usage logs ordered by most recent, along with total key and request counts.
 *     tags: [Developer]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_keys:
 *                   type: integer
 *                   example: 2
 *                 total_requests:
 *                   type: integer
 *                   example: 47
 *                 usageLogs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       endpoint_accessed:
 *                         type: string
 *                         example: /api/public/alumnus-of-the-day
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-04-04T08:30:00.000Z"
 */
router.get('/usage-stats', authMiddleware, roleMiddleware(['developer', 'admin']), getUsageStats);

/**
 * @swagger
 * /api/developer/dashboard:
 *   get:
 *     summary: Get a comprehensive usage statistics dashboard
 *     description: Returns aggregated login history, API key overview (active/revoked counts), and the top 10 most-accessed endpoints.
 *     tags: [Developer]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     responses:
 *       200:
 *         description: Dashboard summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 login_statistics:
 *                   type: object
 *                   properties:
 *                     total_logins:
 *                       type: integer
 *                       example: 15
 *                     recent_logins:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           ip_address:
 *                             type: string
 *                             example: "::1"
 *                           user_agent:
 *                             type: string
 *                             example: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
 *                           login_time:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-04-04T08:15:00.000Z"
 *                 api_key_overview:
 *                   type: object
 *                   properties:
 *                     total_keys:
 *                       type: integer
 *                       example: 3
 *                     active_keys:
 *                       type: integer
 *                       example: 2
 *                     revoked_keys:
 *                       type: integer
 *                       example: 1
 *                 api_usage:
 *                   type: object
 *                   properties:
 *                     total_api_hits:
 *                       type: integer
 *                       example: 142
 *                     top_endpoints:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           endpoint_accessed:
 *                             type: string
 *                             example: /api/public/alumnus-of-the-day
 *                           hit_count:
 *                             type: integer
 *                             example: 89
 */
router.get('/dashboard', authMiddleware, roleMiddleware(['developer', 'admin']), getDashboardSummary);


module.exports = router;
