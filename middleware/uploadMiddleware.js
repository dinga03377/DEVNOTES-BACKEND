const multer = require("multer");

const cloudinary = require("../config/cloudinary");

const {
  CloudinaryStorage,
} = require("multer-storage-cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => ({
    folder: "devnotes_profiles",

    allowed_formats: [
      "jpg",
      "png",
      "jpeg",
      "webp",
    ],

    public_id:
      Date.now() +
      "-" +
      file.originalname.split(".")[0],
  }),
});

const upload = multer({
  storage,
});

module.exports = upload;