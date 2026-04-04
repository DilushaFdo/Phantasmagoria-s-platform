const express = require('express');
const router = express.Router();
const authMiddleware = require('../lib/authMiddleware');
const { placeBid, getBidStatus, updateBid } = require('../controllers/bidController');

/**
 * @swagger
 * /api/bids/place:
 *   post:
 *     summary: Place a new bid to be featured on a target date
 *     description: Places a blind bid for a specific date. The user must have attended at least one event and not exceeded their monthly win limit.
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [target_date, bid_amount]
 *             properties:
 *               target_date:
 *                 type: string
 *                 format: date-time
 *                 description: The date the user wants to be featured
 *                 example: "2026-05-15T00:00:00.000Z"
 *               bid_amount:
 *                 type: number
 *                 description: The bid amount in GBP
 *                 example: 25.50
 *     responses:
 *       201:
 *         description: Bid placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bid placed successfully
 *                 bid:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     bid_amount:
 *                       type: number
 *                       example: 25.50
 *                     target_date:
 *                       type: string
 *                       example: "2026-05-15T00:00:00.000Z"
 *                     status:
 *                       type: string
 *                       example: pending
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Forbidden — monthly win limit reached
 *       404:
 *         description: Profile not found
 */
router.post('/place', authMiddleware, placeBid);

/**
 * @swagger
 * /api/bids/status:
 *   get:
 *     summary: Check if your bid for a specific date is winning or losing
 *     description: Compares the user's bid against the current highest bid for the specified target date.
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     parameters:
 *       - in: query
 *         name: target_date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: The date to check the bid status for (YYYY-MM-DD)
 *         example: "2026-05-15"
 *     responses:
 *       200:
 *         description: Bid status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 your_bid:
 *                   type: number
 *                   example: 25.50
 *                 status:
 *                   type: string
 *                   enum: [winning, losing]
 *                   example: winning
 *       400:
 *         description: target_date query parameter is required
 *       404:
 *         description: No bid found for this date
 */
router.get('/status', authMiddleware, getBidStatus);

/**
 * @swagger
 * /api/bids/update:
 *   put:
 *     summary: Increase an existing bid amount
 *     description: Updates a previously placed bid. The new amount must be strictly greater than the current bid.
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [target_date, new_bid_amount]
 *             properties:
 *               target_date:
 *                 type: string
 *                 format: date-time
 *                 description: The date of the bid to update
 *                 example: "2026-05-15T00:00:00.000Z"
 *               new_bid_amount:
 *                 type: number
 *                 description: The updated bid amount (must be higher than current)
 *                 example: 35.00
 *     responses:
 *       200:
 *         description: Bid updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bid updated successfully
 *                 bid:
 *                   type: object
 *       400:
 *         description: Updated bid must be strictly greater than your current bid
 *       404:
 *         description: No existing bid found for this date
 */
router.put('/update', authMiddleware, updateBid);

module.exports = router;
