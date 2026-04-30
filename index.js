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
// connect to db and setup middleware
const dbConnection = require("./db");
const { generateCsrfToken, validateCsrfToken } = require("./lib/csrfMiddleware");

const app = express();

const expressLayouts = require("express-ejs-layouts");

// setup ejs engine for the frontend
app.use(expressLayouts);
app.set("layout", "partials/layout");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// some default variables for the pages
app.locals.path = '';
app.locals.user = null;

// static files folder
app.use(express.static(path.join(__dirname, "public")));

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://cdn.datatables.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://cdn.datatables.net"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
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

// middleware to check user login status and send to templates
const jwt = require("jsonwebtoken");
const { User, Profile } = require("./models");
app.use(async (req, res, next) => {
    res.locals.path = req.path;
    res.locals.ANALYTICS_API_KEY = process.env.ANALYTICS_API_KEY || '';
    const token = req.cookies.jwt;
    res.locals.user = null;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.id, {
                attributes: ['id', 'email', 'is_verified', 'role', 'company_name'],
                include: [{ model: Profile, attributes: ['first_name', 'last_name'] }]
            });
            if (user) {
                res.locals.user = user.get({ plain: true });
                // put name in easy place to access
                res.locals.user.first_name = user.Profile ? user.Profile.first_name : null;
                res.locals.user.last_name = user.Profile ? user.Profile.last_name : null;
            }
        } catch (error) {
            // Token invalid or expired, leave user as null
        }
    }
    next();
});

// limit api calls to stop spamming
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500, // Increased for development and dashboard heavy usage
    message: { success: false, error: 'TOO_MANY_REQUESTS', message: "Too many requests from this IP, please try again later" },
});
app.use("/api/", apiLimiter);

// API Routes
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const bidRoutes = require("./routes/bidRoutes");
const developerRoutes = require("./routes/developerRoutes");
const publicApiRoutes = require("./routes/publicApiRoutes");
const analyticsRoutes = require("./routes/api/analytics");
const sponsorshipRouter = require("./routes/api/sponsorship");
const viewsRoutes = require("./routes/views");
// run background tasks (like picking the winner)
require("./lib/midnightTask");

// CSRF token endpoint for the frontend to call first
app.get("/api/auth/csrf-token", generateCsrfToken);

// apply csrf check on api requests for security
app.use("/api/", validateCsrfToken);

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/developer", developerRoutes);
app.use("/api/public", publicApiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/sponsorship", sponsorshipRouter);

// setup the main website pages
app.use("/", viewsRoutes);

// swagger setup for api docs
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



// show 404 page if route not found
app.use((req, res) => {
    res.status(404).render("404");
});

// sync db models and start the server
dbConnection.sync().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
}).catch((error) => {
    console.error("Unable to connect to the database:", error);
});