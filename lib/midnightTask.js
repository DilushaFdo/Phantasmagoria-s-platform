const cron = require('node-cron');
const { Op } = require('sequelize');
const { Bid, Profile, User, Session, CsrfToken } = require('../models');
const { sendBidWinEmail, sendBidLossEmail } = require('./emailService');

// Pick the winner at 6 PM and email everyone
const selectWinningAlumnus = async () => {
    try {
        console.log("Running scheduled task: selectWinningAlumnus...");

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // Reset the Previous Winner(s) first
        await Profile.update(
            { is_featured_today: false },
            { where: { is_featured_today: true } }
        );

        // Look for the highest bid that's still pending
        const winningBid = await Bid.findOne({
            where: {
                target_date: {
                    [Op.gte]: startOfDay,
                    [Op.lte]: endOfDay
                },
                status: 'pending'
            },
            order: [
                ['bid_amount', 'DESC'],
                ['createdAt', 'ASC']
            ],
            include: [{
                model: User,
                include: [{ model: Profile }]
            }]
        });

        if (winningBid) {
            // Find and notify Losers
            const losingBids = await Bid.findAll({
                where: {
                    target_date: {
                        [Op.gte]: startOfDay,
                        [Op.lte]: endOfDay
                    },
                    id: { [Op.ne]: winningBid.id },
                    status: 'pending'
                },
                include: [User]
            });

            for (const bid of losingBids) {
                bid.status = 'lost';
                await bid.save();
                if (bid.User?.email) {
                    await sendBidLossEmail(bid.User.email);
                }
            }

            // Mark and notify Winner
            winningBid.status = 'won';
            await winningBid.save();

            const profile = winningBid.User?.Profile;
            if (profile) {
                profile.monthly_win_count += 1;
                profile.is_featured_today = true;
                await profile.save();
                
                if (winningBid.User?.email) {
                    await sendBidWinEmail(winningBid.User.email, winningBid.bid_amount);
                }
                console.log(`User ${winningBid.User.id} won the bid for today!`);
            }
        } else {
            console.log("No valid bids found for today.");
        }
    } catch (error) {
        console.error("Error executing selectWinningAlumnus:", error);
    }
};

// Clear monthly win counts on the 1st
const resetMonthlyWinCounts = async () => {
    try {
        console.log("Running scheduled task: resetMonthlyWinCounts...");
        const [updatedRows] = await Profile.update(
            { monthly_win_count: 0 },
            { where: {} }
        );
        console.log(`Reset win counts for ${updatedRows} profiles.`);
    } catch (error) {
        console.error("Error executing resetMonthlyWinCounts:", error);
    }
};

// Prune old sessions and CSRF tokens
const cleanupDatabase = async () => {
    try {
        console.log("Running scheduled task: cleanupDatabase...");
        const now = new Date();
        const expiredSessions = await Session.destroy({ where: { expires_at: { [Op.lt]: now } } });
        const expiredCsrf = await CsrfToken.destroy({ where: { expires_at: { [Op.lt]: now } } });
        console.log(`Pruned ${expiredSessions} sessions and ${expiredCsrf} CSRF tokens.`);
    } catch (error) {
        console.error("Error executing cleanupDatabase:", error);
    }
};

// Schedule the winner selection for 6 PM
cron.schedule('0 18 * * *', () => {
    selectWinningAlumnus();
});

// Database cleanup every night at midnight
cron.schedule('0 0 * * *', () => {
    cleanupDatabase();
});

// Monthly reset at midnight on the 1st
cron.schedule('0 0 1 * *', () => {
    resetMonthlyWinCounts();
});

module.exports = { selectWinningAlumnus, cleanupDatabase, resetMonthlyWinCounts };
