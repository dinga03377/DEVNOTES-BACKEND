const express = require("express");
const crypto = require("crypto");
const Note = require("../models/Note");
const { body, validationResult} = require("express-validator");
const  protect  = require("../middleware/authMiddleware");
const uploadVoice = require("../middleware/uploadVoiceMiddleware");
const router = express.Router();

// post request

router.post("/", protect,

    [
        body("title")
        .notEmpty()
        .withMessage("Title is required")
        .isLength({ min: 3})
        .withMessage("Title must be at least 3 characters"),

        body("content")
        .notEmpty()
        .withMessage("Content is required"),
    ],
    
    async (req, res) => {
         // check errors
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({ error: errors.array()});
        }

        const { title, content, category, format, reminderAt } = req.body;

        try {
             const note = await Note.create({
             userId: req.user.id,
             title,
             content,
             category,
             format,
             reminderAt,
    });
    res.status(201).json(note);
    
        } catch (error) {
             res.status(500).json({ message: "Server error"});
        }
   
});

// get request for all notes(login-in user)

router.get("/", protect, async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.user.id});
        res.json(notes);

    } catch (error) {
         res.status(500).json({ error: "Server error"});
    }
    
});

// get request for a single

router.get("/:id", protect, async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id,
            userId: req.user.id});
            if (!note) return res.status(404).json({ error: "Note not found"});
            res.json(note);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server error"});
    }
});


// put request

router.put("/:id", protect,

    [
        body("title")
        .optional()
        .isLength({ min: 3})
        .withMessage("Title must be at least 3 characters"),

        body("content")
        .optional()
        .notEmpty()
        .withMessage("Content cannot be empty"),
    ],
    
    async (req, res) => {

         // check errors
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({ error: errors.array()});
        }

        try {
             const note = await Note.findOneAndUpdate(
              { _id: req.params.id, userId: req.user.id },
              req.body,
              { new: true}
            );

             if (!note){
                    return res.status(404).json({ error: "Not not found"});
                }
                res.json(note);
        } catch (error) {
             return res.status(500).json({ message: "Server error"});
        }
});

// delete request

router.delete("/:id", protect, async (req, res) => {
    try {
           const note = await Note.findOneAndDelete({
         _id: req.params.id, 
         userId: req.user.id 
    });

     if (!note){
        return res.status(404).json({ error: "Not not found"});
    }
    res.json({ message: "Note deleted successfully"});

    } catch (error) {
        return res.status(500).json({ message: "Server error"});
    }
});

// Toggle Pin Note
router.patch("/:id/pin", protect, async (req, res) => {

  try {

    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!note) {
      return res.status(404).json({
        error: "Note not found",
      });
    }

    note.pinned = !note.pinned;

    await note.save();

    res.json(note);

  } catch (error) {

    res.status(500).json({
      error: "Server error",
    });
  }
});
// Upload / replace a voice note attached to a note
router.patch(
  "/:id/voice",
  protect,
  uploadVoice.single("voiceNote"),
  async (req, res) => {

    try {

      if (!req.file) {
        return res.status(400).json({ error: "No audio file received" });
      }

      const note = await Note.findOne({
        _id: req.params.id,
        userId: req.user.id,
      });

      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      note.voiceNoteUrl = req.file.path;

      await note.save();

      res.json(note);

    } catch (error) {

      res.status(500).json({ error: "Server error" });
    }
  }
);

// Remove a voice note attached to a note
router.delete("/:id/voice", protect, async (req, res) => {

  try {

    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    note.voiceNoteUrl = null;

    await note.save();

    res.json(note);

  } catch (error) {

    res.status(500).json({ error: "Server error" });
  }
});

// Public — view a shared note by its token. No auth required, and only
// a safe, minimal set of fields is returned (never userId or reminderAt).
router.get("/shared/:token", async (req, res) => {

  try {

    const note = await Note.findOne({ shareToken: req.params.token });

    if (!note) {
      return res.status(404).json({ error: "Shared note not found" });
    }

    res.json({
      title: note.title,
      content: note.content,
      format: note.format,
      category: note.category,
      voiceNoteUrl: note.voiceNoteUrl,
      createdAt: note.createdAt,
    });

  } catch (error) {

    res.status(500).json({ error: "Server error" });
  }
});

// Turn sharing on for a note (idempotent — reuses the existing token if
// the note is already shared, rather than invalidating old links).
router.patch("/:id/share", protect, async (req, res) => {

  try {

    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    if (!note.shareToken) {
      note.shareToken = crypto.randomBytes(16).toString("hex");
      await note.save();
    }

    res.json(note);

  } catch (error) {

    res.status(500).json({ error: "Server error" });
  }
});

// Turn sharing off for a note
router.delete("/:id/share", protect, async (req, res) => {

  try {

    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    note.shareToken = null;

    await note.save();

    res.json(note);

  } catch (error) {

    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;