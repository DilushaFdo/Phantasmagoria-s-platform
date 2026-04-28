const express = require('express');
const router = express.Router();
const apiTrackingMiddleware = require('../lib/apiTrackingMiddleware');
const { getFeaturedAlumnus } = require('../controllers/publicApiController');

/**
 * @swagger
 * /api/public/alumnus-of-the-day:
 *   get:
 *     summary: Retrieve today's featured alumnus (Publicly)
 *     description: Returns the profile data of the alumnus who won today's blind bidding round. This endpoint is public and does not require an API key.
 *     tags: [Public API]
 *     security: []
 *     responses:
 *       200:
 *         description: Featured alumnus retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                   example: jane@my.westminster.ac.uk
 *                 biography:
 *                   type: string
 *                   example: Award-winning computer science graduate.
 *                 linkedin_url:
 *                   type: string
 *                   example: https://www.linkedin.com/in/janedoe
 *       404:
 *         description: No featured alumnus found for today
 */
router.get('/alumnus-of-the-day', apiTrackingMiddleware('read:alumni_of_day'), getFeaturedAlumnus);

module.exports = router;
