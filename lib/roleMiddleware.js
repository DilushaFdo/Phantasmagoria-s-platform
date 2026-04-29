const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        // Ensure user is authenticated first
        if (!res.locals.user) {
            return res.status(401).render("auth/login", { error: "Please log in to access this page." });
        }

        // Check if user's role is in the allowed list
        if (!allowedRoles.includes(res.locals.user.role)) {
            return res.status(403).render("403", { 
                message: "Access Denied: You do not have the required permissions to view this page." 
            });
        }

        next();
    };
};

module.exports = roleMiddleware;
