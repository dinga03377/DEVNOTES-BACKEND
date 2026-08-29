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
    format: {
    type: String,
    enum: ["html", "markdown"],
    default: "html",
},
    reminderAt: {
    type: Date,
    default: null,
},
    voiceNoteUrl: {
    type: String,
    default: null,
},
    shareToken: {
    type: String,
    default: null,
    unique: true,
    sparse: true,
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notes", noteSchema);