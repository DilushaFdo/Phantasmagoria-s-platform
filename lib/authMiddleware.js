const jwt = require('jsonwebtoken');
const { Session } = require('../models');

const authMiddleware = async (req, res, next) => {
    // Extract the token from the secure httpOnly cookie
    const token = req.cookies.jwt;

    // If there is no token, reject with 401 Unauthorized
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No session cookie provided' });
    }

    try {
        // Use jwt.verify() to check the token signature and expiry
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // Check the token exists in the Sessions table for extra security (server-side check)
        const session = await Session.findOne({ where: { token } });
        if (!session) {
            return res.status(401).json({ error: 'Unauthorized: Session has been terminated or expired' });
        }

        // Check if the session has expired in our database
        if (new Date() > new Date(session.expires_at)) {
            await Session.destroy({ where: { token } }); // Clean up expired session
            return res.status(401).json({ error: 'Unauthorized: Session has expired. Please log in again.' });
        }

        // Attach the user's ID to req.user and proceed to the next function
        req.user = decodedToken.id;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
};

module.exports = authMiddleware;