/**
 * Self-Bootstrapping Analytics Endpoint Test Script
 * 
 * This script connects to the DB directly to create test API keys,
 * then tests all analytics endpoints against the running server.
 * 
 * Usage: Start the server first (node index.js), then run: node test-analytics.js
 */

require("dotenv").config();
const http = require("http");
const crypto = require("crypto");
const sequelize = require("./db");
const { ApiKey } = require("./models");

const PORT = process.env.PORT || 3000;
const BASE = `http://localhost:${PORT}`;

let passed = 0;
let failed = 0;

// We'll store the raw keys here after generating them
let analyticsRawKey = "";
let alumniOfDayRawKey = "";
let testKeyIds = [];

// Create a test API key directly in the DB and return the raw key
async function createTestKey(scopes, userId) {
    const rawKey = crypto.randomBytes(32).toString("hex");
    const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");

    const key = await ApiKey.create({
        key_string: hashedKey,
        UserId: userId,
        status: "active",
        scopes: scopes
    });

    testKeyIds.push(key.id);
    return rawKey;
}

// Clean up test keys after we're done
async function cleanupTestKeys() {
    if (testKeyIds.length > 0) {
        await ApiKey.destroy({ where: { id: testKeyIds } });
        console.log(`\n  🧹 Cleaned up ${testKeyIds.length} test API keys.`);
    }
}

// Simple HTTP GET using built-in http module
function get(path, apiKey) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`
            }
        };

        const req = http.request(options, (res) => {
            let body = "";
            res.on("data", chunk => body += chunk);
            res.on("end", () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on("error", reject);
        req.end();
    });
}

// Log result and track pass/fail
function check(testName, condition, detail) {
    if (condition) {
        console.log(`  ✅ PASS — ${testName}`);
        if (detail) console.log(`          ${detail}`);
        passed++;
    } else {
        console.log(`  ❌ FAIL — ${testName}`);
        if (detail) console.log(`          ${detail}`);
        failed++;
    }
}

// Preview first item of an array field
function preview(data, field) {
    const arr = data[field];
    if (!arr) return `${field}: (missing)`;
    if (Array.isArray(arr) && arr.length > 0) return `${field}[0]: ${JSON.stringify(arr[0])}`;
    if (Array.isArray(arr) && arr.length === 0) return `${field}: [] (empty — seed data for richer output)`;
    return `${field}: ${JSON.stringify(arr)}`;
}

async function runTests() {
    console.log("\n==========================================");
    console.log("  Phantasmagoria Analytics API Tests");
    console.log("==========================================\n");

    // --- Setup: Create test API keys ---
    console.log("  Setting up test API keys...\n");
    try {
        await sequelize.authenticate();

        // Find an existing verified user to attach test keys to
        const { User } = require("./models");
        const testUser = await User.findOne({ where: { is_verified: true } });
        if (!testUser) {
            console.error("  ❌ No verified users found in the database. Register and verify a user first.");
            process.exit(1);
        }
        console.log(`  👤 Using test user: ${testUser.email} (id: ${testUser.id})\n`);

        analyticsRawKey = await createTestKey("read:analytics,read:alumni", testUser.id);
        alumniOfDayRawKey = await createTestKey("read:alumni_of_day", testUser.id);
        console.log("  🔑 Created analytics key (read:analytics,read:alumni)");
        console.log("  🔑 Created alumni_of_day key (read:alumni_of_day)\n");
    } catch (e) {
        console.error("  ❌ Failed to create test keys:", e.message);
        console.error("     Make sure the server is running and DB is accessible.");
        process.exit(1);
    }

    // ------- 1. Overview -------
    console.log("─── 1. GET /api/public/analytics/overview ───");
    try {
        const res = await get("/api/public/analytics/overview", analyticsRawKey);
        check("Status 200", res.status === 200, `Got ${res.status}`);
        check("Has totalAlumni", res.data.totalAlumni !== undefined, `totalAlumni: ${res.data.totalAlumni}`);
        check("Has totalActiveBids", res.data.totalActiveBids !== undefined, `totalActiveBids: ${res.data.totalActiveBids}`);
        check("Has todayInfluencer field", "todayInfluencer" in res.data, `todayInfluencer: ${JSON.stringify(res.data.todayInfluencer)}`);
    } catch (e) {
        check("Request succeeded", false, e.message);
    }

    // ------- 2. Certifications -------
    console.log("\n─── 2. GET /api/public/analytics/certifications ───");
    try {
        const res = await get("/api/public/analytics/certifications", analyticsRawKey);
        check("Status 200", res.status === 200, `Got ${res.status}`);
        check("Has mostPopular array", Array.isArray(res.data.mostPopular), preview(res.data, "mostPopular"));
        check("Has trendsOverTime array", Array.isArray(res.data.trendsOverTime), preview(res.data, "trendsOverTime"));
        check("Has topProviders array", Array.isArray(res.data.topProviders), preview(res.data, "topProviders"));
    } catch (e) {
        check("Request succeeded", false, e.message);
    }

    // ------- 3. Courses -------
    console.log("\n─── 3. GET /api/public/analytics/courses ───");
    try {
        const res = await get("/api/public/analytics/courses", analyticsRawKey);
        check("Status 200", res.status === 200, `Got ${res.status}`);
        check("Has mostPopular array", Array.isArray(res.data.mostPopular), preview(res.data, "mostPopular"));
        check("Has trendsOverTime array", Array.isArray(res.data.trendsOverTime), preview(res.data, "trendsOverTime"));
        check("Has topProviders array", Array.isArray(res.data.topProviders), preview(res.data, "topProviders"));
    } catch (e) {
        check("Request succeeded", false, e.message);
    }

    // ------- 4. Employment -------
    console.log("\n─── 4. GET /api/public/analytics/employment ───");
    try {
        const res = await get("/api/public/analytics/employment", analyticsRawKey);
        check("Status 200", res.status === 200, `Got ${res.status}`);
        check("Has bySector array", Array.isArray(res.data.bySector), preview(res.data, "bySector"));
        check("Has topRoles array", Array.isArray(res.data.topRoles), preview(res.data, "topRoles"));
        check("Has topEmployers array", Array.isArray(res.data.topEmployers), preview(res.data, "topEmployers"));
        check("Has employmentTrends array", Array.isArray(res.data.employmentTrends), preview(res.data, "employmentTrends"));
    } catch (e) {
        check("Request succeeded", false, e.message);
    }

    // ------- 5. Degrees -------
    console.log("\n─── 5. GET /api/public/analytics/degrees ───");
    try {
        const res = await get("/api/public/analytics/degrees", analyticsRawKey);
        check("Status 200", res.status === 200, `Got ${res.status}`);
        check("Has byProgramme array", Array.isArray(res.data.byProgramme), preview(res.data, "byProgramme"));
        check("Has graduationsByYear array", Array.isArray(res.data.graduationsByYear), preview(res.data, "graduationsByYear"));
    } catch (e) {
        check("Request succeeded", false, e.message);
    }

    // ------- 6. Licences -------
    console.log("\n─── 6. GET /api/public/analytics/licences ───");
    try {
        const res = await get("/api/public/analytics/licences", analyticsRawKey);
        check("Status 200", res.status === 200, `Got ${res.status}`);
        check("Has mostPopular array", Array.isArray(res.data.mostPopular), preview(res.data, "mostPopular"));
        check("Has trendsOverTime array", Array.isArray(res.data.trendsOverTime), preview(res.data, "trendsOverTime"));
    } catch (e) {
        check("Request succeeded", false, e.message);
    }

    // ------- 7. Bidding History -------
    console.log("\n─── 7. GET /api/public/analytics/bidding-history ───");
    try {
        const res = await get("/api/public/analytics/bidding-history", analyticsRawKey);
        check("Status 200", res.status === 200, `Got ${res.status}`);
        check("Has dailyBids array", Array.isArray(res.data.dailyBids), preview(res.data, "dailyBids"));
        check("Has topBidders array", Array.isArray(res.data.topBidders), preview(res.data, "topBidders"));
        check("Has averageBidByMonth array", Array.isArray(res.data.averageBidByMonth), preview(res.data, "averageBidByMonth"));
    } catch (e) {
        check("Request succeeded", false, e.message);
    }

    // ------- 8. Alumni List -------
    console.log("\n─── 8. GET /api/public/alumni ───");
    try {
        const res = await get("/api/public/alumni", analyticsRawKey);
        check("Status 200", res.status === 200, `Got ${res.status}`);
        check("Has alumni array", Array.isArray(res.data.alumni), `alumni count: ${res.data.alumni?.length}`);
        check("Has total count", res.data.total !== undefined, `total: ${res.data.total}`);
        check("Has page number", res.data.page !== undefined, `page: ${res.data.page}`);
        check("Has totalPages", res.data.totalPages !== undefined, `totalPages: ${res.data.totalPages}`);
    } catch (e) {
        check("Request succeeded", false, e.message);
    }

    // ------- 9. Scope enforcement: wrong key → analytics should 403 -------
    console.log("\n─── 9. SCOPE: read:alumni_of_day key → /analytics/overview (expect 403) ───");
    try {
        const res = await get("/api/public/analytics/overview", alumniOfDayRawKey);
        check("Returns 403 Forbidden", res.status === 403, `Got ${res.status}: ${JSON.stringify(res.data)}`);
    } catch (e) {
        check("Request succeeded", false, e.message);
    }

    // ------- 10. Scope enforcement: analytics key → alumni endpoint -------
    console.log("\n─── 10. SCOPE: read:alumni_of_day key → /alumni (expect 403) ───");
    try {
        const res = await get("/api/public/alumni", alumniOfDayRawKey);
        check("Returns 403 Forbidden", res.status === 403, `Got ${res.status}: ${JSON.stringify(res.data)}`);
    } catch (e) {
        check("Request succeeded", false, e.message);
    }

    // ------- Cleanup & Summary -------
    await cleanupTestKeys();

    console.log("\n==========================================");
    console.log(`  Results: ${passed} PASSED, ${failed} FAILED`);
    console.log(`  Total:   ${passed + failed} tests`);
    console.log("==========================================\n");

    await sequelize.close();
    if (failed > 0) process.exit(1);
    process.exit(0);
}

runTests();
