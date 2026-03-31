const { Bid, Profile } = require('../models');

const placeBid = async (req, res) => {
    try {
        const { target_date, bid_amount } = req.body;
        const userId = req.user;

        if (!target_date || !bid_amount) {
            return res.status(400).json({ error: 'target_date and bid_amount are required' });
        }

        const profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found. Please create a profile first.' });
        }

        // Calculate maximum allowed bids based on whether they attended the university event
        const maxWins = profile.attended_university_event ? 4 : 3;

        if (profile.monthly_win_count >= maxWins) {
            return res.status(403).json({ error: 'Forbidden: You have reached your monthly win limit.' });
        }

        const newBid = await Bid.create({
            target_date,
            bid_amount,
            UserId: userId
        });

        return res.status(201).json({ message: 'Bid placed successfully', bid: newBid });
    } catch (error) {
        console.error("Error placing bid:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getBidStatus = async (req, res) => {
    try {
        const { target_date } = req.query;
        const userId = req.user;

        if (!target_date) {
            return res.status(400).json({ error: 'target_date is required' });
        }

        // Profile might not strictly be necessary here since we're using UserId for the bid,
        // but verifying the profile exists is good practice and follows the instruction steps.
        const profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found.' });
        }

        const userBid = await Bid.findOne({
            where: {
                UserId: userId,
                target_date: target_date
            }
        });

        if (!userBid) {
            return res.status(404).json({ error: 'No bid found for this date.' });
        }

        const maxBidAmount = await Bid.max('bid_amount', {
            where: { target_date: target_date }
        });

        // Use Number() to ensure type safety, as DECIMAL column amounts might return as strings
        if (Number(userBid.bid_amount) === Number(maxBidAmount)) {
            return res.status(200).json({ status: "winning" });
        } else {
            return res.status(200).json({ status: "losing" });
        }

    } catch (error) {
        console.error("Error fetching bid status:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const updateBid = async (req, res) => {
    try {
        const { target_date, new_bid_amount } = req.body;
        const userId = req.user;

        if (!target_date || !new_bid_amount) {
            return res.status(400).json({ error: 'target_date and new_bid_amount are required' });
        }

        const profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found.' });
        }

        const existingBid = await Bid.findOne({
            where: {
                UserId: userId,
                target_date: target_date
            }
        });

        if (!existingBid) {
            return res.status(404).json({ error: 'No existing bid found for this date. Please place a new bid instead.' });
        }

        if (Number(new_bid_amount) <= Number(existingBid.bid_amount)) {
            return res.status(400).json({ error: 'Updated bid must be strictly greater than your current bid.' });
        }

        existingBid.bid_amount = new_bid_amount;
        await existingBid.save();

        return res.status(200).json({ message: 'Bid updated successfully', bid: existingBid });
    } catch (error) {
        console.error("Error updating bid:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    placeBid,
    getBidStatus,
    updateBid
};
