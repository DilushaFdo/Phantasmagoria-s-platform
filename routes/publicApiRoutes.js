const express = require('express');
const router = express.Router();
const apiTrackingMiddleware = require('../lib/apiTrackingMiddleware');
const { getFeaturedAlumnus } = require('../controllers/publicApiController');

/**
 * @swagger
 * /api/public/alumnus-of-the-day:
 *   get:
 *     summary: Retrieve today's featured alumnus data for the AR Client
 *     description: Returns the profile data of the alumnus who won today's blind bidding round. Requires a valid API key in the x-api-key header. Each call is logged for usage tracking.
 *     tags: [Public API]
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: An active API key generated via the Developer endpoint
 *         example: a3f8c9d2e1b04a5f6d7e8c9b0a1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9
 *     responses:
 *       200:
 *         description: Featured alumnus retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 alumnus:
 *                   type: object
 *                   description: The featured alumnus profile data
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: jane@my.westminster.ac.uk
 *                     biography:
 *                       type: string
 *                       example: Award-winning computer science graduate.
 *                     linkedin_url:
 *                       type: string
 *                       example: https://www.linkedin.com/in/janedoe
 *       401:
 *         description: Unauthorized — API key is missing or invalid
 *       404:
 *         description: No featured alumnus found for today
 */
router.get('/alumnus-of-the-day', apiTrackingMiddleware('public:read'), getFeaturedAlumnus);

module.exports = router;
