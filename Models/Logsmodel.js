const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  accountno: {
    type: String,
    required: true,
  },
  activities: [
    {
      activity: {
        type: String,
      },
      time: {
        type: String,
      },
    },
  ],
});

module.exports = mongoose.model("Logs", logSchema);
