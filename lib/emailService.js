const nodemailer = require("nodemailer");

// config for sending emails using nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === "465",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// send email for verifying account
const sendVerificationEmail = async (email, token) => {

    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Verify Your Phantasmagoria Account",
        html: `
            <h1>Welcome to Phantasmagoria!</h1>
            <p>Please copy and paste the below verification token to activate your account:</p>
            <p>${token}</p>
            <p>If you did not create an account, please ignore this email.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error("Failed to send verification email");
    }
};

// send email for password reset
const sendPasswordResetEmail = async (email, token) => {

    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Password Reset Request - Phantasmagoria",
        html: `
            <h1>Password Reset Request</h1>
            <p>You requested to reset your password. Copy the token below to set a new password:</p>
            <P>token: ${token}</P>
            <p>This token will expire in 1 hour.</p>
            <p>If you did not request this, please ignore this email.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw new Error("Failed to send password reset email");
    }
};

// email for winning a bid
const sendBidWinEmail = async (email, amount) => {
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Congratulations! You are the Alumnus of the Day",
        html: `
            <h1>You Won!</h1>
            <p>Congratulations! Your bid of £${amount} was the highest for today.</p>
            <p>Your profile will be featured globally on the Phantasmagoria platform for the next 24 hours.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending bid win email:", error);
    }
};

// email for losing a bid
const sendBidLossEmail = async (email) => {
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Bidding Update - Phantasmagoria",
        html: `
            <h1>Bidding Update</h1>
            <p>Unfortunately, your bid for today was not the highest.</p>
            <p>Don't worry! You can try bidding again for tomorrow's slot.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending bid loss email:", error);
    }
};

// notify sponsor when alumni accepts/rejects offer
const sendOfferResponseEmail = async (sponsorEmail, profileId, action) => {
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: sponsorEmail,
        subject: `Sponsorship Offer ${action.charAt(0).toUpperCase() + action.slice(1)} - Phantasmagoria`,
        html: `
            <h1>Sponsorship Update</h1>
            <p>The alumni has <strong>${action}ed</strong> your sponsorship offer.</p>
            <p>You can view your dashboard for more details.</p>
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/sponsor/dashboard">Go to Dashboard</a>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending offer response email:", error);
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendBidWinEmail,
    sendBidLossEmail,
    sendOfferResponseEmail,
};
