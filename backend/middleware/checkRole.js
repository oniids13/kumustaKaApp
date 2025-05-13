/**
 * Middleware to check if the authenticated user has the required role
 * @param {Array} allowedRoles - Array of role names that are allowed to access the route
 * @returns {Function} - Express middleware function
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // Make sure we have a user from auth middleware
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check if user's role is in the allowed roles array
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
        details: `Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    // User has the required role, proceed
    next();
  };
};

module.exports = checkRole;
