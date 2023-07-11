const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../Models/UserModel");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Imap = require("imap");
// Registration API

router.post("/register", async (req, res) => {
  try {
    const { name, password, role, email } = req.body;

    // Check if the username already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(e)
        .json({ message: "User already exists, Login to Proceed" });
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
    const secretKey = process.env.JWT_SECRET_KEY || "secretKey";

    // Set the expiration time (e.g., 1 hour)
    const expiresIn = "2h";

    // Generate the JWT
    const token = jwt.sign({ email: email }, secretKey, {
      expiresIn,
    });

    let subject = "Opac Account Activation";
    let message = `<!DOCTYPE html>
    <html>
    <head>
      <title>Login Page</title>
    </head>
    <body>
      <h1>Login Page</h1>
      <p>Please click the link below to login:</p>
      <a href="https://opacfrontend.netlify.app/login?logintoken=${token}">Login</a>
    </body>
    </html>`;
    await sendEmail(email, subject, message);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(403).json({ message: error.message });
  }
});

// Login API

router.post("/login", async (req, res) => {
  try {
    const { email, password, logintoken } = req.body;
    if (logintoken) {
      console.log(logintoken);
      try {
        const decoded = jwt.verify(
          logintoken,
          process.env.JWT_SECRET_KEY || "secretKey"
        );
        // console.log(decoded);
        const tokenmail = decoded.email;
        if (tokenmail.toLowerCase() != email.toLowerCase()) {
          return res.status(404).json({
            message: "Entered Email Not matching with Registerd Email",
          });
        }
        const user = await User.findOne({ email: tokenmail });
        console.log(user);
        if (!user) {
          return res
            .status(404)
            .json({ message: "Not Registered Properly , Register Again" });
        }
        user.status = "ACTIVE";
        await user.save();
        const token = generateToken(user._id, user.role);
        // Return the token
        res.status(200).json({ token: token });
      } catch (error) {
        if (error.name == "TokenExpiredError") {
          let subject = "Opac Account Activation";
          const secretKey = process.env.JWT_SECRET_KEY || "secretKey";
          const expiresIn = "2h";
          const token = jwt.sign({ email: email }, secretKey, {
            expiresIn,
          });
          let html = `<!DOCTYPE html>
          <html>
          <head>
            <title>Login Page</title>
          </head>
          <body>
            <h1>Login Page</h1>
            <p>Please click the link below to login:</p>
            <a href="https://opacfrontend.netlify.app/login?logintoken=${token}">Login</a>
          </body>
          </html>`;
          await sendEmail(email, subject, html);
          return res.status(404).json({
            message: "Link is Expired Please Check mail to get New Link",
          });
        } else {
          return res.status(404).json({ message: "Invalid token provided." });
        }
      }
    } else {
      // Find the user by username (email)
      const user = await User.findOne({ email });

      // If user not found, return error
      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found! Create Account First" });
      }

      // Verify the password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      // If password is not valid, return error
      if (!isPasswordValid) {
        return res
          .status(404)
          .json({ message: "Invalid username or password" });
      }

      if (user.status == "SUSPENDED") {
        let subject = "Opac Account Activation";
        const secretKey = process.env.JWT_SECRET_KEY || "secretKey";
        const expiresIn = "2h";
        const token = jwt.sign({ email: user.email }, secretKey, {
          expiresIn,
        });
        let message = `<!DOCTYPE html>
        <html>
        <head>
          <title>Login Page</title>
        </head>
        <body>
          <h1>Login Page</h1>
          <p>Please click the link below to login:</p>
          <a href="https://opacfrontend.netlify.app/login?logintoken=${token}">Login</a>
        </body>
        </html>`;
        await sendEmail(user.email, subject, message);
        return res.status(404).json({
          message: "Please Activate your Account from link sent to your mail ",
        });
      }

      // Generate a JWT
      const token = generateToken(user._id, user.role);

      // Return the token
      res.status(200).json({ token: token });
    }
  } catch (error) {
    console.log(error.message);
    res.status(403).json({ message: "Unexpected Error Occured!" });
  }
});

// Function to generate a JWT
function generateToken(userId, role) {
  // Set the JWT secret key
  const secretKey = process.env.JWT_SECRET_KEY || "secretKey";

  // Set the expiration time (e.g., 1 hour)
  const expiresIn = "2h";

  // Generate the JWT
  const token = jwt.sign({ userId: userId, role: role }, secretKey, {
    expiresIn,
  });

  return token;
}
function generateResetToken(userId) {
  // Set the JWT secret key
  const secretKey = process.env.JWT_SECRET_KEY || "secretKey";

  // Set the expiration time (e.g., 1 hour)
  const expiresIn = "2h";

  // Generate the JWT
  const token = jwt.sign({ userId: userId }, secretKey, {
    expiresIn,
  });

  return token;
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
    let subject = "Password Ressetting ";
    let message = `<!DOCTYPE html>
    <html>
    <head>
      <title>Password Reset Page</title>
    </head>
    <body>
      <h1>Password Reset Page</h1>
      <p>Please click the link below to Set New Password:</p>
      <a href="https://opacfrontend.netlify.app/new-password?token=${resetToken}">Set New Password</a>
    </body>
    </html>`;
    sendEmail(email, subject, message);

    // Send reset password email
    // await sendResetEmail(user.email, resetToken);

    res.status(200).json({
      url: `https://opacfrontend.netlify.app/new-password?token=${resetToken}`,
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
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user data
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: "Server error" });
  }
});

async function sendEmail(recipientEmail, subject, message) {
  const senderEmail = "testing@surprisetreat.com";
  const username = "AKIASJ7TEBOUSDH6BPP6";
  const senderPassword = "BLCLwUEPbPJNs5oQzoQqbX9LYzr6AB8w86u27G6X8cC1";
  try {
    // Create a SMTP transporter
    const transporter = nodemailer.createTransport({
      host: "email-smtp.us-east-1.amazonaws.com",
      port: 465, // Replace with the appropriate port for your server
      secure: true, // Set to true if using a secure connection (e.g., port 465)
      auth: {
        user: username,
        pass: senderPassword,
      },
      tls: {
        rejectUnauthorized: false, // Set to true if the server certificate should be verified
      },
    });

    // Compose the email
    const mailOptions = {
      from: senderEmail,
      to: recipientEmail,
      subject: subject,
      html: message,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return "sent";
  } catch (error) {
    console.error("Error occurred while sending email:", error);
    return "error";
  }
}

// Export the router
module.exports = router;
