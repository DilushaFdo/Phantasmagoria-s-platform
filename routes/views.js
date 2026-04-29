const express = require("express");
const router = express.Router();
const authMiddleware = require("../lib/authMiddleware");
const sponsorAuth = require("../lib/sponsorAuth");
const { logout } = require("../controllers/authController");

// ── Public Views ──
router.get("/", (req, res) => {
    res.render("index");
});

// ── Auth Views (Public) ──
router.get("/login", (req, res) => {
    res.render("auth/login");
});

router.get("/register", (req, res) => {
    res.render("auth/register");
});

router.get("/verify-email", (req, res) => {
    res.render("auth/verify-email");
});

router.get("/reset-password", (req, res) => {
    res.render("auth/reset-password");
});

// ── Public Alumni Views ──
router.get("/alumni/today", (req, res) => {
    res.render("alumni/today");
});

// ── Protected Views (Requires Login) ──
router.get("/profile", authMiddleware, (req, res) => {
    res.render("profile/index");
});

router.get("/profile/:id", authMiddleware, (req, res) => {
    res.render("profile/index");
});

router.get("/profile/edit", authMiddleware, (req, res) => {
    res.render("profile/edit");
});

router.get("/bidding", authMiddleware, (req, res) => {
    res.render("bidding/index");
});

const roleMiddleware = require("../lib/roleMiddleware");

router.get("/developer", authMiddleware, roleMiddleware(['developer', 'admin']), (req, res) => {
    res.render("developer/index");
});

// ── Dashboard Views (Protected) ──
router.get("/dashboard", authMiddleware, (req, res) => {
    res.render("dashboard/index");
});

router.get("/dashboard/alumni", authMiddleware, (req, res) => {
    res.render("dashboard/alumni");
});

router.get("/dashboard/charts/skills-gap", authMiddleware, (req, res) => {
    res.render("dashboard/charts/skills-gap");
});

router.get("/dashboard/charts/employment", authMiddleware, (req, res) => {
    res.render("dashboard/charts/employment");
});

router.get("/dashboard/charts/job-titles", authMiddleware, (req, res) => {
    res.render("dashboard/charts/job-titles");
});

router.get("/dashboard/charts/employers", authMiddleware, (req, res) => {
    res.render("dashboard/charts/employers");
});

router.get("/dashboard/charts/geographic", authMiddleware, (req, res) => {
    res.render("dashboard/charts/geographic");
});

router.get("/dashboard/export", authMiddleware, (req, res) => {
    res.render("dashboard/export");
});

// ── Sponsor Views (Protected) ──
router.get("/sponsor-dashboard", sponsorAuth, (req, res) => {
    res.render("sponsor/dashboard");
});

router.get("/sponsor/browse-alumni", sponsorAuth, (req, res) => {
    res.render("sponsor/browse-alumni");
});

router.get("/sponsor/my-offers", sponsorAuth, (req, res) => {
    res.render("sponsor/my-offers");
});

router.get("/logout", logout);

module.exports = router;
