const express = require('express');
const router = express.Router();
const sponsorshipController = require('../../controllers/sponsorshipController');
const authMiddleware = require('../../lib/authMiddleware');

/**
 * @swagger
 * /api/sponsorship/my-offers:
 *   get:
 *     summary: Get all sponsorship offers targeting the active user
 *     description: Retrieves all sponsorship offers for the logged-in alumni, grouped by their status (pending, accepted, rejected).
 *     tags: [Sponsorship]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     responses:
 *       200:
 *         description: Offers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 offers:
 *                   type: object
 *                   properties:
 *                     pending: { type: array, items: { type: object } }
 *                     accepted: { type: array, items: { type: object } }
 *                     rejected: { type: array, items: { type: object } }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.get('/my-offers', authMiddleware, sponsorshipController.getMyOffers);

/**
 * @swagger
 * /api/sponsorship/respond/{id}:
 *   post:
 *     summary: Accept or reject a sponsorship offer
 *     description: Allows alumni to accept or reject a pending sponsorship offer targeted at them.
 *     tags: [Sponsorship]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the sponsorship offer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accept, reject]
 *     responses:
 *       200:
 *         description: Offer responded to successfully
 *       400:
 *         description: Invalid action or offer already responded to
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Offer not found or doesn't belong to user
 */
router.post('/respond/:id', authMiddleware, sponsorshipController.respondToOffer);

/**
 * @swagger
 * /api/sponsorship/available-amount:
 *   get:
 *     summary: Get the available bid amount from accepted sponsorships
 *     description: Returns the total amount of money available for the alumni to use for bidding, based on all accepted sponsorship offers.
 *     tags: [Sponsorship]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     responses:
 *       200:
 *         description: Successfully retrieved available bid amount
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAvailable: { type: number }
 *                 sponsorships: { type: array, items: { type: object } }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.get('/available-amount', authMiddleware, sponsorshipController.getAvailableBidAmount);

/**
 * @swagger
 * /api/sponsorship/summary:
 *   get:
 *     summary: Get a complete summary of accepted sponsorships
 *     description: Returns the total available sponsorship balance along with a list of accepted offers and their details (company, amount, credential).
 *     tags: [Sponsorship]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     responses:
 *       200:
 *         description: Successfully retrieved sponsorship summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAvailable: { type: number }
 *                 sponsorships: { type: array, items: { type: object } }
 *                 potentialEarnings: { type: number }
 *                 currentBidAmount: { type: number }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.get('/summary', authMiddleware, sponsorshipController.getSponsorshipSummary);
/**
 * @swagger
 * /api/sponsorship/alumni:
 *   get:
 *     summary: Get all alumni with their credentials for sponsorship
 *     description: Returns a list of alumni profiles including their certifications and licences, enriched with a flag indicating if the current sponsor has already made an offer.
 *     tags: [Sponsorship]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     responses:
 *       200:
 *         description: Alumni list retrieved successfully
 */
router.get('/alumni', authMiddleware, sponsorshipController.getAlumniForSponsorship);

/**
 * @swagger
 * /api/sponsorship/offer:
 *   post:
 *     summary: Create a sponsorship offer for a specific credential
 *     description: Allows a sponsor to make a financial offer to an alumni for a specific certification or licence they hold.
 *     tags: [Sponsorship]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ProfileId, offer_amount]
 *             properties:
 *               ProfileId: { type: integer }
 *               CertificationId: { type: integer }
 *               LicenceId: { type: integer }
 *               offer_amount: { type: number }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Offer sent successfully
 *       400:
 *         description: Invalid input or duplicate offer
 */
router.post('/offer', authMiddleware, sponsorshipController.createOffer);

/**
 * @swagger
 * /api/sponsorship/dashboard-data:
 *   get:
 *     summary: Get dashboard statistics and recent offers for the logged-in sponsor
 *     tags: [Sponsorship]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 */
router.get('/dashboard-data', authMiddleware, sponsorshipController.getDashboardData);

module.exports = router;
