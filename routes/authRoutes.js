const express = require("express");
const { body, validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const upload = require("../middleware/uploadMiddleware");
const protect  = require("../middleware/authMiddleware");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

// Register

router.post("/register", 

    // validation rules
    [
        body("name")
        .notEmpty()
        .withMessage("Name is required")
        .isLength({min: 4})
        .withMessage("Name must be at least 4 characters"),

        body("email")
        .isEmail()
        .withMessage("Valid email is required")
        .normalizeEmail(),

        body("password")
        .isStrongPassword()
        .withMessage("Password must include uppercase, number,symbol"),
    ],
    
    async (req, res) => {
        
        // check errors
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({ error: errors.array()});
        }
    const { name, email, password} = req.body;

    try {
        // check if user exist
        const existingUser = await User.findOne({ email });
        if ( existingUser) {
            return res.status(400).json({ message: "Email already exists"})
        }

        // hashe password
        const hashedPassword = await bcrypt.hash(password, 10);

        // save user
         const user = await User.create({
           name,
           email,
           password: hashedPassword
         });
         res.status(201).json({ message: "User registered successfully", 
            user,
         })
    } catch (error) {
        res.status(500).json({ message: "Server error"})
    }
});
 // image uploads
router.post(
"/profile-image",
protect,
upload.single("profileImage"),
async (req, res) => {

try {

const user = await User.findById(req.user.id);

user.profileImage = req.file.path;

await user.save();

res.json(user);

} catch (error) {

res.status(500).json({
message: error.message
});

}

}
);

// users profile
router.get("/profile", protect, async (req, res) => {
  try {

    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//login

router.post("/login",
    
    // validation rules
    [
        body("email")
        .isEmail()
        .withMessage("Valid email is required")
        .normalizeEmail(),

        body("password")
        .notEmpty()
        .withMessage("Password is required"),
    ],
    
    async (req, res) => {

         // check errors
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({ error: errors.array()});
        }

    const { email, password} = req.body;

    try {
        // find user
         const user = await User.findOne({email});
    if (!user) return res.status(400).json({error: "Invalid credentials"});

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) return res.status(400).json({error: "Invalid credentials"});

    // Generate token
    const token = jwt.sign(
        {id: user._id},
        process.env.JWT_SECRET,
        { expiresIn: "1d"}
    );
    res.json({
      token,
      name: user.name,
      email: user.email
    });

    } catch (error) {
        res.status(500).json({ message: "Login error"});
    }
});

// forget-password route
router.post("/forgot-password", async (req, res) => {
  console.log("FORGOT PASSWORD ROUTE HIT");
  const { email } = req.body;

  try {
    // 1. Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // 2. Generate token (raw)
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 3. Hash token (this is what we store in DB)
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // 4. Save to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save();

    // 5. Create reset URL (frontend link)
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    // 6. Send response (later → email)
    await sendEmail({
  email: user.email,
  subject: "Password Reset Request",
  message: `
    <h2>Password Reset</h2>
    <p>You requested a password reset</p>
    <a href="${resetUrl}" target="_blank">
      Click here to reset password
    </a>
    <p>This link expires in 10 minutes</p>
  `,
});

res.json({
  message: "Reset email sent successfully",
});

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// reset-password
router.post("/reset-password/:token", async (req, res) => {
  const { password } = req.body;

  try {
    // 1. Hash token from URL
    const hashedToken = require("crypto")
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    // 2. Find user with token + not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    // 3. Hash new password
    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 4. Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({
      message: "Password reset successful",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});
module.exports = router;