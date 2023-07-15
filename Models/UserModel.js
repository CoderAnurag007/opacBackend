const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,

    trim: true,
  },
  surname: {
    type: String,
    required: true,

    trim: true,
  },
  companyName: {
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

    default: "BETA",
  },
  accountno: {
    type: String,
  },
  profile: {
    profiletype: {
      type: String,
      enum: ["Underwriter", "UnderwriterAdmin", "Risk", "Admin", "Merchant"],
      default: "Merchant",
    },
  },

  businesses: [
    {
      buisnessno: {
        type: String,
      },
      channels: [
        {
          channelno: {
            type: String,
          },
        },
      ],
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

        default: "BETA",
      },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
