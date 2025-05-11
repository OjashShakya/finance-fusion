require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const mainRouter = require("./route/index.route");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");

const app = express();

// CORS setup
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001","http://localhost:3002","http://localhost:3003","https://financefusion-six.vercel.app"],
  credentials: true,
}));

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
connectDB();

// **Add session middleware**
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,  // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  }
}));

// **Initialize Passport session**
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api", mainRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
