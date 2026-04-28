const { configDotenv } = require("dotenv");

configDotenv();
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
// Connecting to databases and setting up middleware
const dbConnection = require("./db");
const { generateCsrfToken, validateCsrfToken } = require("./lib/csrfMiddleware");

const app = express();

const expressLayouts = require("express-ejs-layouts");

// EJS view engine setup for dashboard pages
app.use(expressLayouts);
app.set("layout", "partials/layout");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Default locals
app.locals.path = '';
app.locals.user = null;

// Serve static files (CSS, JS, images) for the dashboard
app.use(express.static(path.join(__dirname, "public")));

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "http://localhost:*", "ws://localhost:*"]
        }
    }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:8000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-TOKEN"],
    credentials: true,
}));

// Global middleware to pass user data to EJS templates
const jwt = require("jsonwebtoken");
const { User } = require("./models");
app.use(async (req, res, next) => {
    res.locals.path = req.path;
    const token = req.cookies.jwt;
    res.locals.user = null;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.id, {
                attributes: ['id', 'email', 'is_verified']
            });
            if (user) {
                res.locals.user = user.get({ plain: true });
            }
        } catch (error) {
            // Token invalid or expired, leave user as null
        }
    }
    next();
});

// Rate limiting so people don't spam the API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later",
});
app.use("/api/", apiLimiter);

// API Routes
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const bidRoutes = require("./routes/bidRoutes");
const developerRoutes = require("./routes/developerRoutes");
const publicApiRoutes = require("./routes/publicApiRoutes");
const analyticsRoutes = require("./routes/api/analytics");
const viewsRoutes = require("./routes/views");
// Running scheduled tasks (like picking the winner)
require("./lib/midnightTask");

// CSRF token endpoint for the frontend to call first
app.get("/api/auth/csrf-token", generateCsrfToken);

// Apply CSRF protection for security on all state-changing requests
app.use("/api/", validateCsrfToken);

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/developer", developerRoutes);
app.use("/api/public", publicApiRoutes);
app.use("/api/analytics", analyticsRoutes);

// Frontend web pages (served with EJS)
app.use("/", viewsRoutes);

// Setting up Swagger for documentation
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Phantasmagoria API",
            version: "1.0.0",
            description: "API documentation for the Phantasmagoria platform project. Includes endpoints for auth, profiles, and bidding.",
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "jwt",
                    description: "JWT token stored in a secure httpOnly cookie.",
                },
                csrfToken: {
                    type: "apiKey",
                    in: "header",
                    name: "X-CSRF-TOKEN",
                    description: "CSRF token obtained from GET /api/auth/csrf-token",
                },
            },
        },
        security: [
            {
                cookieAuth: [],
                csrfToken: [],
            },
        ],
    },
    apis: ["./routes/*.js", "./routes/api/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
        persistAuthorization: true
    }
}));



// 404 Handler
app.use((req, res) => {
    res.status(404).render("404");
});

// Finally, sync with the DB and start the server!
dbConnection.sync().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
}).catch((error) => {
    console.error("Unable to connect to the database:", error);
});