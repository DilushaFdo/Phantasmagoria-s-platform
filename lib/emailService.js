const nodemailer = require("nodemailer");

// Set up nodemailer with SMTP settings
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === "465",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Send a verification email
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
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error("Failed to send verification email");
    }
};

// Send a password reset email
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
        console.log(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw new Error("Failed to send password reset email");
    }
};

// Send an email if they win the bid
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
        console.log(`Bid win email sent to ${email}`);
    } catch (error) {
        console.error("Error sending bid win email:", error);
    }
};

// Send an email if they lose the bid
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
        console.log(`Bid loss email sent to ${email}`);
    } catch (error) {
        console.error("Error sending bid loss email:", error);
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendBidWinEmail,
    sendBidLossEmail,
};
