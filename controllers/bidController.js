const { Bid, Profile, Sponsorship, Sponsor, Certification, Licence } = require('../models');

// Place a new bid for a specific day
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

        // Set the time to midnight so it's consistent for the whole day
        const normalizedDate = new Date(target_date);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        // Each user can only have one bid per day
        const existingBid = await Bid.findOne({
            where: { UserId: userId, target_date: normalizedDate }
        });
        if (existingBid) {
            return res.status(400).json({ 
                error: 'You already have a bid for this date. Please use the update API to change your bid amount instead.' 
            });
        }

        // Check limits: 4 wins if they attended the event, otherwise 3
        const maxWins = profile.attended_university_event ? 4 : 3;

        if (profile.monthly_win_count >= maxWins) {
            return res.status(403).json({ error: 'Forbidden: You have reached your monthly win limit.' });
        }

        const availableAmount = await profile.getTotalSponsorshipAmount() || 0;

        if (availableAmount === 0) {
            return res.status(400).json({
                error: 'You have no accepted sponsorships',
                message: 'You need accepted sponsorship offers before you can place a bid'
            });
        }

        if (Number(bid_amount) > availableAmount) {
            return res.status(400).json({
                error: 'Bid amount cannot exceed your total accepted sponsorship amount',
                availableAmount,
                message: `Your maximum bid is £${availableAmount} based on your accepted sponsorships`
            });
        }

        const newBid = await Bid.create({
            target_date: normalizedDate,
            bid_amount,
            UserId: userId
        });

        return res.status(201).json({ message: 'Bid placed successfully', bid: newBid });
    } catch (error) {
        console.error("Error placing bid:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Check if my bid is currently winning
const getBidStatus = async (req, res) => {
    try {
        const { target_date } = req.query;
        const userId = req.user;

        if (!target_date) {
            return res.status(400).json({ error: 'target_date is required' });
        }

        // Make sure the profile exists
        const profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found.' });
        }

        // Using midnight for consistency again
        const normalizedDate = new Date(target_date);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        // Check if the user has a bid for this date
        const userBid = await Bid.findOne({
            where: {
                UserId: userId,
                target_date: normalizedDate
            }
        });

        if (!userBid) {
            return res.status(404).json({ error: 'No bid found for this date.' });
        }

        const maxBidAmount = await Bid.max('bid_amount', {
            where: { target_date: normalizedDate }
        });

        // Calculate how many more times they can win this month
        const maxWins = profile.attended_university_event ? 4 : 3;
        const remainingSlots = Math.max(0, maxWins - profile.monthly_win_count);

        // Use Number() to ensure type safety, as DECIMAL column amounts might return as strings
        const currentBidAmount = Number(userBid.bid_amount);
        const isWinning = currentBidAmount === Number(maxBidAmount);
        
        // Fetch sponsorship information
        const totalAvailableFromSponsors = await profile.getTotalSponsorshipAmount() || 0;
        const acceptedSponsorships = await Sponsorship.findAll({
            where: {
                ProfileId: profile.id,
                status: 'accepted'
            },
            include: [
                { model: Sponsor, attributes: ['company_name'] },
                { model: Certification },
                { model: Licence }
            ]
        });

        const formattedSponsorships = acceptedSponsorships.map(sp => {
            let forTitle = 'Unknown';
            if (sp.Certification) forTitle = sp.Certification.title;
            else if (sp.Licence) forTitle = sp.Licence.title;

            return {
                sponsor: sp.Sponsor ? sp.Sponsor.company_name : 'Unknown Sponsor',
                amount: Number(sp.offer_amount),
                for: forTitle
            };
        });

        const potentialEarnings = Math.max(0, totalAvailableFromSponsors - currentBidAmount);

        return res.status(200).json({ 
            your_bid: currentBidAmount,
            status: isWinning ? "winning" : "losing", 
            remaining_monthly_slots: remainingSlots,
            totalAvailableFromSponsors,
            currentBidAmount,
            potentialEarnings,
            sponsorships: formattedSponsorships
        });

    } catch (error) {
        console.error("Error fetching bid status:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Update the amount of an existing bid
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

        // Normalize the date to midnight
        const normalizedDate = new Date(target_date);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        const existingBid = await Bid.findOne({
            where: {
                UserId: userId,
                target_date: normalizedDate
            }
        });

        if (!existingBid) {
            return res.status(404).json({ error: 'No existing bid found for this date. Please place a new bid instead.' });
        }

        if (Number(new_bid_amount) <= Number(existingBid.bid_amount)) {
            return res.status(400).json({ error: 'Updated bid must be strictly greater than your current bid.' });
        }

        const availableAmount = await profile.getTotalSponsorshipAmount() || 0;

        if (Number(new_bid_amount) > availableAmount) {
            return res.status(400).json({
                error: 'Bid amount cannot exceed your total accepted sponsorship amount',
                availableAmount,
                message: `Your maximum bid is £${availableAmount} based on your accepted sponsorships`
            });
        }

        existingBid.bid_amount = new_bid_amount;
        await existingBid.save();

        return res.status(200).json({ message: 'Bid updated successfully', bid: existingBid });
    } catch (error) {
        console.error("Error updating bid:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all bids placed by the current user
const getMyBids = async (req, res) => {
    try {
        const userId = req.user;

        // Fetch bids ordered by date, newest first
        const bids = await Bid.findAll({
            where: { UserId: userId },
            order: [['target_date', 'DESC']]
        });

        if (!bids || bids.length === 0) {
            return res.status(200).json({ message: "You haven't placed any bids yet.", bids: [] });
        }

        return res.status(200).json({ bids });
    } catch (error) {
        console.error("Error retrieving user bids:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete a pending bid
const deleteBid = async (req, res) => {
    try {
        const { target_date } = req.query;
        
        if (!target_date) {
            return res.status(400).json({ error: "target_date query parameter is required." });
        }

        // Normalize to midnight UTC
        const normalizedDate = new Date(target_date);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        const bid = await Bid.findOne({
            where: {
                target_date: normalizedDate.toISOString(),
                UserId: req.user,
                status: 'pending' // Only allow deleting pending bids
            }
        });

        if (!bid) {
            return res.status(404).json({ error: "No pending bid found for this date." });
        }

        await bid.destroy();
        res.status(200).json({ message: "Bid deleted successfully." });
    } catch (error) {
        console.error("Error deleting bid:", error);
        res.status(500).json({ error: "Failed to delete bid." });
    }
};

// Check if I have a bid for tomorrow's slot
const getTomorrowStatus = async (req, res) => {
    try {
        const tomorrow = new Date();
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);

        const bid = await Bid.findOne({
            where: {
                target_date: tomorrow.toISOString(),
                UserId: req.user
            }
        });

        if (bid) {
            return res.status(200).json({
                bid_placed: true,
                amount: bid.bid_amount,
                status: bid.status,
                message: "You have already placed a bid for tomorrow's slot."
            });
        } else {
            return res.status(200).json({
                bid_placed: false,
                message: "You have not placed a bid for tomorrow yet."
            });
        }
    } catch (error) {
        console.error("Error fetching tomorrow's status:", error);
        res.status(500).json({ error: "Failed to fetch tomorrow's status." });
    }
};

// Get remaining wins for the month
const getMonthlyLimitStatus = async (req, res) => {
    try {
        const profile = await Profile.findOne({ where: { UserId: req.user } });
        if (!profile) {
            return res.status(404).json({ error: "Profile not found." });
        }

        // Standard limit is 3, but event attendees get 4
        const maxWins = profile.attended_university_event ? 4 : 3;
        const remainingSlots = Math.max(0, maxWins - profile.monthly_win_count);

        res.status(200).json({
            monthly_win_count: profile.monthly_win_count,
            max_allowed_wins: maxWins,
            remaining_slots: remainingSlots,
            attended_university_event: profile.attended_university_event
        });
    } catch (error) {
        console.error("Error fetching monthly limit status:", error);
        res.status(500).json({ error: "Failed to fetch monthly limit status." });
    }
};

module.exports = {
    placeBid,
    getBidStatus,
    updateBid,
    getMyBids,
    deleteBid,
    getTomorrowStatus,
    getMonthlyLimitStatus
};
