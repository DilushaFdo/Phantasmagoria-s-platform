module.exports = (req, res, next) => {
    if (!res.locals.user || res.locals.user.role !== 'sponsor') {
        if (req.accepts('json') && !req.accepts('html')) {
            return res.status(403).json({ error: 'Forbidden: Sponsor role required' });
        }
        return res.redirect('/login');
    }
    next();
};
