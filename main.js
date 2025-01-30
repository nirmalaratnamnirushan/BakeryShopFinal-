// Imports
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const authRouter = require("./routes/auth");
const appRouter = require("./routes/routes");
const bcrypt = require("bcrypt");
const path = require("path");
const collection = require("./models/consumer");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware Setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database Connection
mongoose
    .connect("mongodb://127.0.0.1/", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to the database!"))
    .catch((error) => console.error("Database connection error:", error));

// Express session setup
app.use(
    session({
        secret: process.env.SESSION_SECRET || "my_secret_key",
        saveUninitialized: true,
        resave: false,
    })
);

// Flash message middleware
app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});

// Authentication Routes
app.get("/login", (req, res) => res.render("login"));
app.get("/signup", (req, res) => res.render("signup", { title: "Signup" }));

// Register user
app.post("/signup", async(req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await collection.findOne({ email });
        if (existingUser) return res.status(400).send("User already exists.");

        const hashedPassword = await bcrypt.hash(password, 10);
        const userdata = new collection({ name, email, password: hashedPassword });
        await userdata.save();

        // res.status(201).send('User signed up successfully!');
        res.redirect("/login");
    } catch (error) {
        res.status(500).send("Error signing up.");
    }
});

// Login user
app.post("/login", async(req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).send("Email and password are required.");

        const user = await collection.findOne({ email });
        if (!user) return res.status(404).send("Email not found.");

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) return res.status(401).send("Incorrect password.");

        req.session.user = user;
        res.redirect("/");
    } catch (error) {
        res.status(500).send("An error occurred during login.");
    }
});

// Home Page
app.get("/home", async(req, res) => {
    if (!req.session.user) return res.redirect("/login");
    res.render("index", { title: "Home" });
});

// Logout Route
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).send("Logout failed.");
        res.redirect("/login");
    });
});

// Serve static files
app.use(express.static("uploads"));
app.use(express.static("public"));

// Template Engine
app.set("view engine", "ejs");

// Routes
app.use("/auth", authRouter);
app.use("/", appRouter);

// Start Server
app.listen(PORT, () =>
    console.log(`Server started at http://localhost:${PORT}`)
);

module.exports = app;