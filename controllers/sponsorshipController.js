const { Sponsorship, Sponsor, Certification, Licence, Profile } = require("../models");
// If the app uses a custom email function for notifications, we assume it's added to emailService:
const { sendOfferResponseEmail } = require("../lib/emailService");

const getMyOffers = async (req, res) => {
    try {
        const userId = req.user;
        const profile = await Profile.findOne({ where: { UserId: userId } });

        if (!profile) {
            return res.status(404).json({ error: "Profile not found." });
        }

        const sponsorships = await Sponsorship.findAll({
            where: { ProfileId: profile.id },
            include: [
                { model: Sponsor, attributes: ['company_name', 'email'] },
                { model: Certification },
                { model: Licence }
            ]
        });

        const grouped = {
            pending: [],
            accepted: [],
            rejected: []
        };

        sponsorships.forEach(sp => {
            if (grouped[sp.status]) {
                grouped[sp.status].push(sp);
            }
        });

        res.status(200).json({ offers: grouped });
    } catch (error) {
        console.error("Error in getMyOffers:", error);
        res.status(500).json({ error: "Internal server error fetching offers." });
    }
};

const respondToOffer = async (req, res) => {
    try {
        const { sponsorshipId, action } = req.body;
        const userId = req.user;

        if (!sponsorshipId || !['accept', 'reject'].includes(action)) {
            return res.status(400).json({ error: "sponsorshipId and a valid action ('accept' or 'reject') are required." });
        }

        const profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) {
            return res.status(404).json({ error: "Profile not found." });
        }

        const sponsorship = await Sponsorship.findOne({
            where: { id: sponsorshipId, ProfileId: profile.id },
            include: [{ model: Sponsor }]
        });

        if (!sponsorship) {
            return res.status(404).json({ error: "Sponsorship offer not found or does not belong to you." });
        }

        if (sponsorship.status !== 'pending') {
            return res.status(400).json({ error: `Offer has already been ${sponsorship.status}.` });
        }

        sponsorship.status = action === 'accept' ? 'accepted' : 'rejected';
        sponsorship.responded_at = new Date();
        await sponsorship.save();

        // Try sending notification if the function exists
        if (typeof sendOfferResponseEmail === 'function' && sponsorship.Sponsor) {
            await sendOfferResponseEmail(sponsorship.Sponsor.email, profile.id, action);
        }

        res.status(200).json({ message: `Offer ${sponsorship.status} successfully.`, sponsorship });
    } catch (error) {
        console.error("Error in respondToOffer:", error);
        res.status(500).json({ error: "Internal server error responding to offer." });
    }
};

const getAvailableBidAmount = async (req, res) => {
    try {
        const userId = req.user;
        const profile = await Profile.findOne({ where: { UserId: userId } });

        if (!profile) {
            return res.status(404).json({ error: "Profile not found." });
        }

        // Use the helper method defined on the Profile model
        const totalAvailable = await profile.getTotalSponsorshipAmount();

        const sponsorships = await Sponsorship.findAll({
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

        res.status(200).json({
            totalAvailable,
            sponsorships
        });
    } catch (error) {
        console.error("Error in getAvailableBidAmount:", error);
        res.status(500).json({ error: "Internal server error calculating bid amount." });
    }
};

const getSponsorshipSummary = async (req, res) => {
    try {
        const userId = req.user;
        const profile = await Profile.findOne({ where: { UserId: userId } });

        if (!profile) {
            return res.status(404).json({ error: "Profile not found." });
        }

        const totalAvailable = await profile.getTotalSponsorshipAmount();

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

        // Current bid amount calculation would require joining or querying Bids.
        // Assuming currentBidAmount comes from the frontend or requires an extra query here.
        // Since instructions didn't specify checking the current bid exactly here or 
        // we could just fetch today's bid:
        const { Bid } = require("../models");
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const currentBid = await Bid.findOne({
            where: {
                UserId: userId,
                target_date: today.toISOString()
            }
        });

        const currentBidAmount = currentBid ? Number(currentBid.bid_amount) : 0;
        const potentialEarnings = Math.max(0, totalAvailable - currentBidAmount);

        res.status(200).json({
            totalAvailable,
            sponsorships: formattedSponsorships,
            potentialEarnings,
            currentBidAmount
        });
    } catch (error) {
        console.error("Error in getSponsorshipSummary:", error);
        res.status(500).json({ error: "Internal server error generating sponsorship summary." });
    }
};

const createOffer = async (req, res) => {
    try {
        const { profileId, amount, message, certificationId, licenceId } = req.body;
        const sponsorId = req.user;

        // Verify the user is a sponsor
        const { User } = require("../models");
        const user = await User.findByPk(sponsorId);
        if (!user || user.role !== 'sponsor') {
            return res.status(403).json({ error: "Only sponsors can create sponsorship offers." });
        }

        if (!profileId || !amount) {
            return res.status(400).json({ error: "profileId and amount are required." });
        }

        if ((!certificationId && !licenceId) || (certificationId && licenceId)) {
            return res.status(400).json({ error: "You must sponsor exactly one certification or one licence." });
        }

        const sponsorship = await Sponsorship.create({
            SponsorId: sponsorId,
            ProfileId: profileId,
            offer_amount: amount,
            message: message || "",
            CertificationId: certificationId || null,
            LicenceId: licenceId || null,
            status: 'pending'
        });

        res.status(201).json({ message: "Sponsorship offer sent successfully!", sponsorship });
    } catch (error) {
        console.error("Error in createOffer:", error);
        res.status(500).json({ error: "Internal server error creating offer." });
    }
};

module.exports = {
    getMyOffers,
    respondToOffer,
    getAvailableBidAmount,
    getSponsorshipSummary,
    createOffer
};
