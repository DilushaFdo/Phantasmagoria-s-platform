const jwt = require('jsonwebtoken');
const { Session } = require('../models');

/**
 * Shared helper to extract the JWT from different sources
 */
const extractToken = (req) => {
    // Check HttpOnly cookie first (Our primary method)
    if (req.cookies && req.cookies.jwt) {
        return req.cookies.jwt;
    }
    // Fall back to Authorization header (For mobile/API clients)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        return req.headers.authorization.split(' ')[1];
    }
    return null;
};

const authMiddleware = async (req, res, next) => {
    const token = extractToken(req);

    // If no token, they aren't logged in
    if (!token) {
        return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Unauthorized: No session token provided' });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const session = await Session.findOne({ where: { token } });
        
        if (!session) {
            return res.status(401).json({ success: false, error: 'SESSION_TERMINATED', message: 'Unauthorized: Session has been terminated or expired' });
        }

        if (new Date() > new Date(session.expires_at)) {
            await Session.destroy({ where: { token } });
            return res.status(401).json({ success: false, error: 'SESSION_EXPIRED', message: 'Unauthorized: Session has expired. Please log in again.' });
        }

        req.user = decodedToken.id;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'INVALID_TOKEN', message: 'Unauthorized: Invalid or expired token' });
    }
};

/**
 * Optional version that identifies the user if possible but doesn't block
 */
const optionalAuth = async (req, res, next) => {
    const token = extractToken(req);
    if (token) {
        try {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            const session = await Session.findOne({ where: { token } });
            if (session && new Date() <= new Date(session.expires_at)) {
                req.user = decodedToken.id;
            }
        } catch (error) {}
    }
    next();
};

module.exports = authMiddleware;
module.exports.optional = optionalAuth;
module.exports.extractToken = extractToken;