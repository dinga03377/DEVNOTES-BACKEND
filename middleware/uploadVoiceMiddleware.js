const multer = require("multer");

const cloudinary = require("../config/cloudinary");

const {
  CloudinaryStorage,
} = require("multer-storage-cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => ({
    folder: "devnotes_voice_notes",

    resource_type: "video", // Cloudinary stores audio under the "video" resource type

    allowed_formats: [
      "webm",
      "mp3",
      "wav",
      "ogg",
      "m4a",
      "mp4",
    ],

    public_id:
      Date.now() +
      "-" +
      file.originalname.split(".")[0],
  }),
});

const uploadVoice = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB cap per voice note
  },
});

module.exports = uploadVoice;
