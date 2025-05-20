const passport = require("passport");
const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Authentication middleware using JWT strategy
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const auth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized - Invalid or expired token",
        details: info ? info.message : "Authentication failed",
      });
    }

    // Attach the user to the request object
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Authentication middleware using JWT token directly
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRETKEY);
    req.user = verified;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { auth, authenticateToken };
