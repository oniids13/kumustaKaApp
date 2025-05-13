const passport = require("passport");

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

module.exports = auth;
