const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables from .env file
const app = express();
var bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json());

mongoose
  .connect(process.env.MONGOURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
  });

// Import the API routes from api.js
const apiRoutes = require("./routes/main");

// Use the API routes as middleware
app.use("/api", apiRoutes);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
