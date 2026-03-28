const { configDotenv } = require("dotenv");

configDotenv();

const express = require("express");
const helmet = require("helmet");
const dbConnection = require("./db");

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


dbConnection.sync({ force: true }).then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
}).catch((error) => {
    console.error("Unable to connect to the database:", error);
});