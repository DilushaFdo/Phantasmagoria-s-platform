const jwt = require('jsonwebtoken');
const { Session } = require('../models');

const authMiddleware = async (req, res, next) => {
    // Get the JWT from the cookie
    const token = req.cookies.jwt;

    // If no token, they aren't logged in
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No session cookie provided' });
    }

    try {
        // Verify the token with our secret key
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the session is still in the database
        const session = await Session.findOne({ where: { token } });
        if (!session) {
            return res.status(401).json({ error: 'Unauthorized: Session has been terminated or expired' });
        }

        // Check if it's expired in the DB
        if (new Date() > new Date(session.expires_at)) {
            await Session.destroy({ where: { token } }); // Clean it up
            return res.status(401).json({ error: 'Unauthorized: Session has expired. Please log in again.' });
        }

        // Attach user ID and move on
        req.user = decodedToken.id;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
};

module.exports = authMiddleware;