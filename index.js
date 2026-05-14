const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const sanitize = require("./middleware/mongoSanitize");
const xssClean = require("./middleware/xssMiddleware");
const path = require("path");

dotenv.config();

const app = express();
// middleware( body parser)
app.use(express.json());

// secure HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// 
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// preventing mongoDB injection
app.use(sanitize);

// prevent xss attacks
app.use(xssClean);


// General Rate Limiting ( anti-spam )
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // i5 minutes
    max: 100,  // maximum request per IP
    message: "Too many requests, try again later",
});

app.use(limiter);

// Strict limiter for login route
const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: "Too many login attempts, try again later"
});
app.use("/login", loginLimiter);

// routes
app.use("/api/auth", require("./routes/authRoutes"));

app.use("/api/notes", require("./routes/noteRoutes"));
app.use("/uploads", express.static("uploads"));

// test route
app.get("/", (req, res) =>{
    res.send("DevNotes API running...")
});


// connect Database
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB Connected")) 
.catch(err => console.log(err));
 
// starting the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});