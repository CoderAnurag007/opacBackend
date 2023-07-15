const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // Load environment variables from .env file
const jwt = require("jsonwebtoken");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://opac.netlify.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Check if the origin is allowed or if it's a preflight request
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors(corsOptions));

const publicroutes = [
  "/",
  "/api/login",
  "/api/register",
  "/api/forgot-password",
  "/api/change-password",
  "/api/mail",
];

// Middleware function to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  // Exclude specific routes from token verification
  if (publicroutes.includes(req.path)) {
    return next();
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Check the token expiration
    if (!decoded.exp || decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ error: "Token expired" });
    }
    // Add the decoded token to the request object
    req.user = decoded;
    next();
  });
};

// Global middleware for token verification
app.use(verifyToken);

const GetPathNoEndSlash = (path) => {
  if (path && path.length > 1 && path.slice(-1) == "/") {
    return path.slice(0, -1);
  }
  return path;
};

// Body parsing
var bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json());

// Cors

// app.use(
//   cors({
//     origin: "http://localhost:3000", // Replace with your allowed origin(s)
//     methods: ["GET", "POST", "PUT", "DELETE"], // Specify the allowed HTTP methods
//     allowedHeaders: ["Content-Type", "Authorization"], // Specify the allowed headers
//   })
// );

// Mongo Connection
mongoose
  .connect(process.env.MONGOURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    // Use the API routes as middleware
    app.use("/api", apiRoutes);
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
  });

// Import the API routes from api.js
const apiRoutes = require("../routes/main");

// // Serve static files in production mode only
// app.use("/", (request, response) => {
//   response.send("Access Denied..");
// });
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
