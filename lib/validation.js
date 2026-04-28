const { body, validationResult } = require('express-validator');

// Functional helper to handle validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    
    // Send back the first error message
    return res.status(400).json({ 
        error: errors.array()[0].msg 
    });
};

// --- Auth Checks ---

const registerValidation = [
    body('email')
        .isEmail().withMessage('Please provide a valid email address.')
        .matches(/@.*\.westminster\.ac\.uk$/).withMessage('Registration is restricted to Westminster alumni (@*.westminster.ac.uk).')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
        .matches(/\d/).withMessage('Password must contain at least one number.')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.'),
    validate
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
    validate
];

// --- Profile Checks ---

const profileBaseValidation = [
    body('biography')
        .optional()
        .trim()
        .escape() // Prevent XSS by escaping HTML
        .isLength({ max: 500 }).withMessage('Biography cannot exceed 500 characters.'),
    body('linkedin_url')
        .optional({ checkFalsy: true })
        .trim()
        .isURL({ require_protocol: false }).withMessage('Invalid LinkedIn URL format.')
        .matches(/linkedin\.com/).withMessage('Must be a valid LinkedIn URL.'),
    body('profile_image_path')
        .optional()
        .trim(), // Just trim the path string
    validate
];

const degreeValidation = [
    body('title').notEmpty().withMessage('Degree title is required.').trim().escape(),
    body('url').optional().isURL().withMessage('Invalid URL format for degree credential.').trim(),
    body('completion_date').optional().isDate().withMessage('Invalid completion date format.'),
    validate
];

// --- Bidding Checks ---

const bidValidation = [
    body('target_date')
        .notEmpty().withMessage('Target date is required.')
        .isISO8601().withMessage('Target date must be a valid ISO8601 date string.')
        .toDate(),
    body('bid_amount')
        .notEmpty().withMessage('Bid amount is required.')
        .isFloat({ min: 0.01 }).withMessage('Bid amount must be a positive number.'),
    validate
];

const bidStatusValidation = [
    require('express-validator').query('target_date')
        .notEmpty().withMessage('Target date query parameter is required.')
        .isISO8601().withMessage('Target date must be a valid ISO8601 date string.')
        .toDate(),
    validate
];

const bidUpdateValidation = [
    body('target_date')
        .notEmpty().withMessage('Target date is required.')
        .isISO8601().withMessage('Target date must be a valid ISO8601 date string.')
        .toDate(),
    body('new_bid_amount')
        .notEmpty().withMessage('New bid amount is required.')
        .isFloat({ min: 0.01 }).withMessage('New bid amount must be a positive number.'),
    validate
];

const resetPasswordValidation = [
    body('token').notEmpty().withMessage('Reset token is required.'),
    body('newPassword')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
        .matches(/\d/).withMessage('Password must contain at least one number.')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.'),
    validate
];

module.exports = {
    registerValidation,
    loginValidation,
    profileBaseValidation,
    degreeValidation,
    bidValidation,
    bidStatusValidation,
    bidUpdateValidation,
    resetPasswordValidation
};
