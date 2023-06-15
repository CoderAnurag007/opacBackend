const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../Models/UserModel");
const jwt = require("jsonwebtoken");

// Registration API

router.post("/register", async (req, res) => {
  try {
    const { username, password, role, email } = req.body;

    // Check if the username already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with hashed password
    const newUser = new User({
      username,
      password: hashedPassword,
      role,
      email,
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login API

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by username (email)
    const user = await User.findOne({ email });

    // If user not found, return error
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // If password is not valid, return error
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate a JWT
    const token = generateToken(user._id);

    // Return the token
    res.status(200).json({ token: token, role: user.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Function to generate a JWT
function generateToken(userId) {
  // Set the JWT secret key
  const secretKey = process.env.JWT_SECRET_KEY || "secretKey";

  // Set the expiration time (e.g., 1 hour)
  const expiresIn = "1h";

  // Generate the JWT
  const token = jwt.sign({ userId }, secretKey, { expiresIn });

  return token;
}

// Export the router
module.exports = router;
