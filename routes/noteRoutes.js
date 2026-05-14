const express = require("express");
const Note = require("../models/Note");
const { body, validationResult} = require("express-validator");
const  protect  = require("../middleware/authMiddleware");
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

        const { title, content, category} = req.body;

        try {
             const note = await Note.create({
             userId: req.user.id,
             title,
             content,
             category,
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
module.exports = router;