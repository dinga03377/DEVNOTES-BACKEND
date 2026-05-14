const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {

    try {

      token = req.headers.authorization.split(" ")[1];

      // ❌ no token
      if (!token) {
        return res.status(401).json({
          message: "No token provided",
        });
      }

      // ✅ verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      next();

    } catch (error) {

      console.log(error);

      return res.status(401).json({
        message: "Invalid token",
      });
    }

  } else {

    return res.status(401).json({
      message: "Not authorized",
    });
  }
};

module.exports = protect;