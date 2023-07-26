const mongoose = require("mongoose");
const user = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    subscribe: { type: Boolean, default: false },
    expireAt: {
      type: Date,
      /* Defaults 7 days from now */
      default: new Date(new Date().valueOf() + 3600000),
      /* Remove doc 60 seconds after specified date */
      expires: 10,
    },
    /* Automatically add createdAt and updatedAt fields to schema */
  },
  { timestamps: true }
);
module.exports = mongoose.model("users", user);
