const express = require('express');
const router = express.Router();
const authMiddleware = require('../lib/authMiddleware');
const { placeBid, getBidStatus, updateBid } = require('../controllers/bidController');

/**
 * @swagger
 * /api/bids/place:
 *   post:
 *     summary: Place a new bid to be featured on a target date
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target_date
 *               - bid_amount
 *             properties:
 *               target_date:
 *                 type: string
 *                 format: date-time
 *               bid_amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Bid placed successfully
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Forbidden - Monthly win limit reached
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Internal server error
 */
router.post('/place', authMiddleware, placeBid);

/**
 * @swagger
 * /api/bids/status:
 *   get:
 *     summary: Check if your bid for a specific date is winning or losing
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: target_date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: The date to check the status for
 *     responses:
 *       200:
 *         description: Bid status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "winning"
 *       400:
 *         description: target_date is required
 *       404:
 *         description: No bid found for this date
 *       500:
 *         description: Internal server error
 */
router.get('/status', authMiddleware, getBidStatus);

/**
 * @swagger
 * /api/bids/update:
 *   put:
 *     summary: Increase an existing bid amount
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target_date
 *               - new_bid_amount
 *             properties:
 *               target_date:
 *                 type: string
 *                 format: date-time
 *               new_bid_amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Bid updated successfully
 *       400:
 *         description: Updated bid must be strictly greater than your current bid
 *       404:
 *         description: No existing bid found for this date
 *       500:
 *         description: Internal server error
 */
router.put('/update', authMiddleware, updateBid);

module.exports = router;
