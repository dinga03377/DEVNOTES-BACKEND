const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    title: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    pinned: {
      type: Boolean,
      default: false,
    },
    category: {
    type: String,
    default: "Personal",
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notes", noteSchema);