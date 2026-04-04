const { configDotenv } = require("dotenv");

configDotenv();
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const dbConnection = require("./db");
// const { User, Profile } = require("./models"); // Removed unused imports
const { generateCsrfToken, validateCsrfToken } = require("./lib/csrfMiddleware");

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:8000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-TOKEN"],
    credentials: true,
}));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later",
});
app.use("/api/", apiLimiter);

// Routes
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const bidRoutes = require("./routes/bidRoutes");
const developerRoutes = require("./routes/developerRoutes");
const publicApiRoutes = require("./routes/publicApiRoutes");

// Scheduled Tasks
require("./lib/midnightTask");

// CSRF token endpoint (must be before CSRF validation middleware)
app.get("/api/auth/csrf-token", generateCsrfToken);

// Apply CSRF protection to all state-changing API requests
app.use("/api/", validateCsrfToken);

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/developer", developerRoutes);
app.use("/api/public", publicApiRoutes);

// Swagger configuration
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
    apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
        persistAuthorization: true
    }
}));



dbConnection.sync({ alter: true }).then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
}).catch((error) => {
    console.error("Unable to connect to the database:", error);
});