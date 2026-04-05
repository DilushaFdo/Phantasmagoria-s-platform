const express = require('express');
const router = express.Router();
const authMiddleware = require('../lib/authMiddleware');
const { placeBid, getBidStatus, updateBid, getMyBids, deleteBid, getTomorrowStatus, getMonthlyLimitStatus } = require('../controllers/bidController');
const { bidValidation, bidStatusValidation, bidUpdateValidation } = require('../lib/validation');

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
router.post('/place', authMiddleware, bidValidation, placeBid);

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
 *                 remaining_monthly_slots:
 *                   type: integer
 *                   example: 2
 *       400:
 *         description: target_date query parameter is required
 *       404:
 *         description: No bid found for this date
 */
router.get('/status', authMiddleware, bidStatusValidation, getBidStatus);

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
router.put('/update', authMiddleware, bidUpdateValidation, updateBid);

/**
 * @swagger
 * /api/bids/my-bids:
 *   get:
 *     summary: Retrieve your bidding history
 *     description: Returns a list of all bids placed by the currently authenticated user, ordered by target date.
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     responses:
 *       200:
 *         description: Bidding history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bids:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       bid_amount: { type: string }
 *                       target_date: { type: string, format: date-time }
 *                       status: { type: string }
 *       401:
 *         description: Unauthorized — No session cookie provided
 */
router.get('/my-bids', authMiddleware, getMyBids);

/**
 * @swagger
 * /api/bids/delete:
 *   delete:
 *     summary: Delete a specific pending bid
 *     description: Allows the user to cancel a bid they previously placed for a specific date. Only "pending" bids can be deleted.
 *     tags: [Bids]
 *     security:
 *       - cookieAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: query
 *         name: target_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: The date of the bid to delete (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Bid deleted successfully
 *       404:
 *         description: No pending bid found for this date
 */
router.delete('/delete', authMiddleware, bidStatusValidation, deleteBid);

/**
 * @swagger
 * /api/bids/tomorrow:
 *   get:
 *     summary: View your bidding status for tomorrow's slot
 *     description: Checks if the current user has already placed a bid for tomorrow's date. Maintains blind bidding by only showing your own data.
 *     tags: [Bids]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved tomorrow's status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bid_placed:
 *                   type: boolean
 *                 amount:
 *                   type: number
 *                 message:
 *                   type: string
 */
router.get('/tomorrow', authMiddleware, getTomorrowStatus);

/**
 * @swagger
 * /api/bids/monthly-status:
 *   get:
 *     summary: View your monthly win count and remaining bidding slots
 *     description: Returns a summary of your wins this month and how many more times you are allowed to win (3 standard, 4 for event attendees).
 *     tags: [Bids]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved monthly status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 monthly_win_count:
 *                   type: integer
 *                 max_allowed_wins:
 *                   type: integer
 *                 remaining_slots:
 *                   type: integer
 */
router.get('/monthly-status', authMiddleware, getMonthlyLimitStatus);

module.exports = router;
