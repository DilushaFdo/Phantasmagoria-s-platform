const express = require('express');
const router = express.Router();
const authMiddleware = require('../lib/authMiddleware');
const {
    updateBaseProfile,
    addDegree,
    addCertification,
    getProfile
} = require('../controllers/profileController');

// Inject the middleware before the controller for each route
// This ensures only logged-in users with valid tokens can hit these endpoints

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get the active user's complete profile with degrees and certs
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       404:
 *         description: Profile not found
 */
router.get('/', authMiddleware, getProfile);

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update the user's base profile (biography and linkedin url)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               biography:
 *                 type: string
 *               linkedin_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Base profile updated
 *       400:
 *         description: Invalid LinkedIn URL format
 */
router.put('/', authMiddleware, updateBaseProfile);

/**
 * @swagger
 * /api/profile/degree:
 *   post:
 *     summary: Add a new degree to the user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - url
 *             properties:
 *               title:
 *                 type: string
 *               url:
 *                 type: string
 *               completion_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Degree added successfully
 */
router.post('/degree', authMiddleware, addDegree);

/**
 * @swagger
 * /api/profile/certification:
 *   post:
 *     summary: Add a new certification to the user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - url
 *             properties:
 *               title:
 *                 type: string
 *               url:
 *                 type: string
 *               completion_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Certification added successfully
 */
router.post('/certification', authMiddleware, addCertification);

module.exports = router;
