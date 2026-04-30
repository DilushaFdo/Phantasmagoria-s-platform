const express = require("express");
const router = express.Router();
const { 
    register, 
    verifyEmail, 
    login, 
    forgotPassword,
    resetPassword, 
    logout 
} = require("../controllers/authController");
const { registerValidation, loginValidation, resetPasswordValidation } = require("../lib/validation");
const { generateCsrfToken } = require("../lib/csrfMiddleware");
const authMiddleware = require("../lib/authMiddleware");

/**
 * @swagger
 * /api/auth/csrf-token:
 *   get:
 *     summary: Generate a CSRF token for state-changing requests
 *     description: Returns a token that must be included as X-CSRF-TOKEN header on all POST/PUT/DELETE requests.
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: CSRF token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 csrfToken:
 *                   type: string
 *                   example: a3f8c9d2e1b04a5f6d7e8c9b0a1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user with real-world email verification
 *     description: Creates a new user account with a hashed password and sends a verification email. Only @my.westminster.ac.uk emails are accepted.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 description: Must be a @my.westminster.ac.uk email
 *                 example: john@my.westminster.ac.uk
 *               password:
 *                 type: string
 *                 description: Minimum 6 characters recommended
 *                 example: MySecurePassword123
 *     responses:
 *       201:
 *         description: User registered successfully. Verification email sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully. Please check your email to verify your account.
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: john@my.westminster.ac.uk
 */
router.post("/register", registerValidation, register);

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify a user's email using the token sent via email
 *     description: Activates the user account after confirming they own the Westminster email. The token expires in 24 hours.
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: The verification token received by email
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verified successfully. You can now log in.
 *       400:
 *         description: Invalid or expired verification token.
 */
router.get("/verify-email", verifyEmail);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and receive specialized JWT session token
 *     description: Verifies credentials and returns a Bearer token. Also triggers a database-backed session creation and logs the login event for security auditing.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@my.westminster.ac.uk
 *               password:
 *                 type: string
 *                 example: MySecurePassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful.
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 csrfToken:
 *                   type: string
 *                   example: a3f8c9d2e1b04a5f6d7e8c9b0a1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9
 *       401:
 *         description: Unauthorized — unverified email or invalid credentials
 */
router.post("/login", loginValidation, login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     description: Sends a password reset link to the registered email. Returns a generic message to prevent user enumeration.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@my.westminster.ac.uk
 *     responses:
 *       200:
 *         description: Password reset request processed.
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using the token received via email
 *     description: Updates the user password after verification of the reset token. Automatically terminates all other active sessions for security.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *                 example: a3f8c9d2e1b04a5f6d7e8c9b0a1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9
 *               newPassword:
 *                 type: string
 *                 example: NewSecretPassword456
 *     responses:
 *       200:
 *         description: Password reset successfully.
 */
router.post("/reset-password", resetPasswordValidation, resetPassword);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Terminate the current session server-side
 *     description: Deletes the active JWT session from the database, effectively revoking the token's access immediately.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     responses:
 *       200:
 *         description: Logged out successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully.
 *                 csrfToken:
 *                   type: string
 *                   example: a3f8c9d2e1b04a5f6d7e8c9b0a1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9
 */
router.post("/logout", authMiddleware, logout);

module.exports = router;
