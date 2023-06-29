const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,

    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email address",
    ],
  },
  role: {
    type: String,
    enum: ["underwriter", "underwriteradmin", "risk", "admin", "merchant"],

    default: "merchant",
  },
  status: {
    type: String,
    enum: [
      "BETA",
      "ALPHA",
      "GAMMA",
      "UNDER REVIEW",
      "DECLINED",
      "PRE-ACTIVE",
      "ACTIVE",
      "SUSPENDED",
      "TERMINATED",
    ],

    default: "SUSPENDED",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
