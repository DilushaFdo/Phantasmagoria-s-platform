const { Sponsorship, User, Certification, Licence, Profile, Bid } = require("../models");
const { Op } = require("sequelize");
// If the app uses a custom email function for notifications, we assume it's added to emailService:
const { sendOfferResponseEmail } = require("../lib/emailService");

const getMyOffers = async (req, res) => {
    try {
        const userId = req.user;
        const profile = await Profile.findOne({ where: { UserId: userId } });

        if (!profile) {
            return res.status(404).json({ success: false, error: 'PROFILE_NOT_FOUND', message: "Profile not found." });
        }

        const sponsorships = await Sponsorship.findAll({
            where: { ProfileId: profile.id },
            include: [
                { model: User, as: 'Sponsor', attributes: ['company_name', 'email'] },
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

        res.status(200).json({ success: true, data: { offers: grouped } });
    } catch (error) {
        console.error("Error in getMyOffers:", error);
        res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Internal server error fetching offers." });
    }
};

const respondToOffer = async (req, res) => {
    try {
        const sponsorshipId = req.params.id || req.body.sponsorshipId;
        const { action } = req.body;
        const userId = req.user;

        if (!sponsorshipId || !['accept', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, error: 'MISSING_DATA', message: "sponsorshipId and a valid action ('accept' or 'reject') are required." });
        }

        const profile = await Profile.findOne({ where: { UserId: userId } });
        if (!profile) {
            return res.status(404).json({ success: false, error: 'PROFILE_NOT_FOUND', message: "Profile not found." });
        }

        const sponsorship = await Sponsorship.findOne({
            where: { id: sponsorshipId, ProfileId: profile.id },
            include: [{ model: User, as: 'Sponsor' }]
        });

        if (!sponsorship) {
            return res.status(404).json({ success: false, error: 'OFFER_NOT_FOUND', message: "Sponsorship offer not found or does not belong to you." });
        }

        if (sponsorship.status !== 'pending') {
            return res.status(400).json({ success: false, error: 'ALREADY_RESPONDED', message: `Offer has already been ${sponsorship.status}.` });
        }

        // Defensive check for corrupted data
        const hasCert = sponsorship.CertificationId != null;
        const hasLic = sponsorship.LicenceId != null;
        const isCorrupted = (!hasCert && !hasLic) || (hasCert && hasLic);

        if (isCorrupted && action === 'accept') {
            return res.status(400).json({ success: false, error: 'CORRUPTED_DATA', message: "This offer is corrupted (missing credential link) and cannot be accepted. Please reject it to clear it." });
        }

        sponsorship.status = action === 'accept' ? 'accepted' : 'rejected';
        sponsorship.responded_at = new Date();
        
        // If corrupted, we bypass validation to allow rejecting the record and clearing the list
        await sponsorship.save({ validate: !isCorrupted });

        if (action === 'accept') {
            const amount = parseFloat(sponsorship.offer_amount);
            if (!isNaN(amount) && amount > 0) {
                await Profile.increment('wallet_balance', { 
                    by: amount, 
                    where: { id: profile.id } 
                });
            }
        }

        // Try sending notification if the function exists
        if (typeof sendOfferResponseEmail === 'function' && sponsorship.Sponsor) {
            // We don't await this so the response is returned immediately to the user
            sendOfferResponseEmail(sponsorship.Sponsor.email, profile.id, action).catch(err => {
                console.error("Failed to send background offer response email:", err);
            });
        }

        res.status(200).json({ 
            success: true, 
            message: `Offer ${sponsorship.status} successfully.`, 
            data: { sponsorship } 
        });
    } catch (error) {
        console.error("Error in respondToOffer:", error);
        res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message || "Internal server error responding to offer." });
    }
};

const getAvailableBidAmount = async (req, res) => {
    try {
        const userId = req.user;
        const profile = await Profile.findOne({ where: { UserId: userId } });

        if (!profile) {
            return res.status(404).json({ success: false, error: 'PROFILE_NOT_FOUND', message: "Profile not found." });
        }

        // Use the wallet_balance from the Profile model
        const totalAvailable = profile.wallet_balance;

        const sponsorships = await Sponsorship.findAll({
            where: {
                ProfileId: profile.id,
                status: 'accepted'
            },
            include: [
                { model: User, as: 'Sponsor', attributes: ['company_name'] },
                { model: Certification },
                { model: Licence }
            ]
        });

        res.status(200).json({
            success: true,
            data: {
                totalAvailable,
                sponsorships
            }
        });
    } catch (error) {
        console.error("Error in getAvailableBidAmount:", error);
        res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Internal server error calculating bid amount." });
    }
};

const getSponsorshipSummary = async (req, res) => {
    try {
        const userId = req.user;
        const profile = await Profile.findOne({ where: { UserId: userId } });

        if (!profile) {
            return res.status(404).json({ success: false, error: 'PROFILE_NOT_FOUND', message: "Profile not found." });
        }

        const totalAvailable = profile.wallet_balance;

        const acceptedSponsorships = await Sponsorship.findAll({
            where: {
                ProfileId: profile.id,
                status: 'accepted'
            },
            include: [
                { model: User, as: 'Sponsor', attributes: ['company_name'] },
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
            success: true,
            data: {
                totalAvailable,
                sponsorships: formattedSponsorships,
                potentialEarnings,
                currentBidAmount
            }
        });
    } catch (error) {
        console.error("Error in getSponsorshipSummary:", error);
        res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Internal server error generating sponsorship summary." });
    }
};

const getAlumniForSponsorship = async (req, res) => {
    try {
        const sponsorId = req.user;

        // Fetch all profiles with their credentials
        const alumni = await Profile.findAll({
            include: [
                { model: Certification },
                { model: Licence }
            ]
        });

        // Fetch existing pending/accepted offers for this sponsor
        const existingOffers = await Sponsorship.findAll({
            where: {
                SponsorId: sponsorId,
                status: { [Op.in]: ['pending', 'accepted'] }
            }
        });

        // Enrich alumni with offer status
        const enrichedAlumni = alumni.map(person => {
            const plainPerson = person.get({ plain: true });
            
            if (plainPerson.Certifications) {
                plainPerson.Certifications = plainPerson.Certifications.map(cert => ({
                    ...cert,
                    hasOffer: existingOffers.some(o => o.ProfileId === person.id && o.CertificationId === cert.id)
                }));
            }
            
            if (plainPerson.Licences) {
                plainPerson.Licences = plainPerson.Licences.map(lic => ({
                    ...lic,
                    hasOffer: existingOffers.some(o => o.ProfileId === person.id && o.LicenceId === lic.id)
                }));
            }
            
            return plainPerson;
        });

        res.status(200).json({ success: true, data: enrichedAlumni });
    } catch (error) {
        console.error("Error in getAlumniForSponsorship:", error);
        res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Internal server error fetching alumni for sponsorship." });
    }
};

const getDashboardData = async (req, res) => {
    try {
        const sponsorId = req.user;

        const offers = await Sponsorship.findAll({
            where: { SponsorId: sponsorId },
            include: [
                { 
                    model: Profile, 
                    include: [{ model: User, attributes: ['email'] }] 
                },
                { model: Certification },
                { model: Licence }
            ],
            order: [['created_at', 'DESC']]
        });

        const stats = {
            totalOffers: offers.length,
            acceptedOffers: offers.filter(o => o.status === 'accepted').length,
            rejectedOffers: offers.filter(o => o.status === 'rejected').length,
            totalCommitted: offers.filter(o => o.status === 'accepted').reduce((sum, o) => sum + Number(o.offer_amount), 0)
        };

        const recentOffers = offers.map(o => {
            let alumniName = 'Unknown';
            if (o.Profile) {
                if (o.Profile.first_name && o.Profile.last_name) {
                    alumniName = `${o.Profile.first_name} ${o.Profile.last_name}`;
                } else if (o.Profile.User && o.Profile.User.email) {
                    alumniName = o.Profile.User.email.split('@')[0];
                }
            }

            let credentialName = 'N/A';
            if (o.Certification) credentialName = o.Certification.title;
            else if (o.Licence) credentialName = o.Licence.title;

            return {
                id: o.id,
                alumniName,
                credentialName,
                offer_amount: o.offer_amount,
                status: o.status,
                created_at: o.created_at,
                message: o.message
            };
        });

        res.status(200).json({ success: true, data: { stats, recentOffers } });
    } catch (error) {
        console.error("Error in getDashboardData:", error);
        res.status(500).json({ success: false, error: 'SERVER_ERROR', message: "Internal server error fetching dashboard data." });
    }
};

const createOffer = async (req, res) => {
    try {
        const { 
            ProfileId, profileId, 
            offer_amount, amount, 
            message, 
            CertificationId, certificationId, 
            LicenceId, licenceId 
        } = req.body;
        
        const targetProfileId = parseInt(ProfileId || profileId);
        const targetAmount = parseFloat(offer_amount || amount);
        const targetCertId = parseInt(CertificationId || certificationId);
        const targetLicenceId = parseInt(LicenceId || licenceId);
        
        const sponsorId = req.user;

        // Verify the user is a sponsor
        const user = await User.findByPk(sponsorId);
        if (!user || user.role !== 'sponsor') {
            return res.status(403).json({ success: false, error: 'FORBIDDEN', message: "Only sponsors can create sponsorship offers." });
        }

        if (isNaN(targetProfileId) || isNaN(targetAmount)) {
            return res.status(400).json({ success: false, error: 'INVALID_DATA', message: "Valid ProfileId and offer_amount are required." });
        }

        const hasCert = !isNaN(targetCertId);
        const hasLic = !isNaN(targetLicenceId);

        if ((!hasCert && !hasLic) || (hasCert && hasLic)) {
            return res.status(400).json({ success: false, error: 'INVALID_CREDENTIAL', message: "You must sponsor exactly one certification or one licence." });
        }

        // Check if offer already exists
        const existing = await Sponsorship.findOne({
            where: {
                SponsorId: sponsorId,
                ProfileId: targetProfileId,
                CertificationId: hasCert ? targetCertId : null,
                LicenceId: hasLic ? targetLicenceId : null,
                status: { [Op.in]: ['pending', 'accepted'] }
            }
        });

        if (existing) {
            return res.status(400).json({ success: false, error: 'DUPLICATE_OFFER', message: "You have already made an offer for this credential to this alumni." });
        }

        const sponsorship = await Sponsorship.create({
            SponsorId: sponsorId,
            ProfileId: targetProfileId,
            offer_amount: targetAmount,
            message: message || "",
            CertificationId: hasCert ? targetCertId : null,
            LicenceId: hasLic ? targetLicenceId : null,
            status: 'pending'
        });

        res.status(201).json({ success: true, message: "Sponsorship offer sent successfully!", data: { sponsorship } });
    } catch (error) {
        console.error("Error in createOffer:", error);
        res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message || "Internal server error creating offer." });
    }
};

module.exports = {
    getMyOffers,
    respondToOffer,
    getAvailableBidAmount,
    getSponsorshipSummary,
    createOffer,
    getAlumniForSponsorship,
    getDashboardData
};
