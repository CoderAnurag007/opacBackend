const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../Models/UserModel");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Registration API

router.post("/register", async (req, res) => {
  try {
    const { name, password, role, email } = req.body;

    // Check if the username already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with hashed password
    const newUser = new User({
      name,
      password: hashedPassword,
      role,
      email,
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(403).json({ error: error.message });
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
      return res.status(404).json({ message: "Invalid username or password" });
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // If password is not valid, return error
    if (!isPasswordValid) {
      return res.status(404).json({ message: "Invalid username or password" });
    }

    // Generate a JWT
    const token = generateToken(user._id, user.role);

    // Return the token
    res.status(200).json({ token: token });
  } catch (error) {
    console.log(error.message);
    res.status(403).json({ error: error.message });
  }
});

// Function to generate a JWT
function generateToken(userId, role) {
  // Set the JWT secret key
  const secretKey = process.env.JWT_SECRET_KEY || "secretKey";

  // Set the expiration time (e.g., 1 hour)
  const expiresIn = "2m";

  // Generate the JWT
  const token = jwt.sign({ userId: userId, role: role }, secretKey, {
    expiresIn,
  });

  return token;
}

// Generate a JWT for password reset
function generateResetToken(userId) {
  const secretKey = process.env.JWT_SECRET_KEY || "secretKey";
  const expiresIn = "1h";
  const token = jwt.sign({ userId }, secretKey, { expiresIn });
  return token;
}

// Send reset password email
async function sendResetEmail(email, resetToken) {
  const transporter = nodemailer.createTransport({
    // Set up your email configuration here (e.g., SMTP)
    // Example for Gmail:
    service: "Gmail",
    auth: {
      user: "tempemailforcoding@gmail.com",
      pass: "Temp@123456",
    },
  });

  const mailOptions = {
    from: "tempemailforcoding@gmail.com",
    to: email,
    subject: "Password Reset",
    html: `
      <p>Please click the following link to reset your password:</p>
      <a href="http://localhost:3000/reset-password?token=${resetToken}">Reset Password</a>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// Forgot Password Api

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    // If user not found, return error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a reset token
    const resetToken = generateResetToken(user._id);

    // Send reset password email
    // await sendResetEmail(user.email, resetToken);

    res.status(200).json({
      url: `http://localhost:3000/new-password?token=${resetToken}`,
      resetToken: resetToken,
      message: "Password reset email sent",
    });
  } catch (error) {
    console.error(error);
    res.status(403).json({ message: "Internal server error" });
  }
});

router.post("/change-password", async (req, res) => {
  const { token, password } = req.body;
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "POST");

  try {
    // Verify the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY || "secretKey"
    );

    // Get the userId from the token payload
    const userId = decoded.userId;

    // Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    // Send a success response
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(403).json({ error: "Failed to change password" });
  }
});

// API endpoint to get user data
router.get("/user", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email }); // Replace with your own logic to fetch user data from the database

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the user data
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: "Server error" });
  }
});

// Export the router
module.exports = router;
