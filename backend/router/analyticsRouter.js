const { Router } = require("express");
const passport = require("passport");
const {
  getTrendsController,
  generateReportController,
} = require("../controller/analyticsController");

const analyticsRouter = Router();

// Middleware to check if user is a teacher
const isTeacher = (req, res, next) => {
  if (req.user && req.user.role === "TEACHER") {
    return next();
  }
  return res
    .status(403)
    .json({ message: "Access denied: Teacher role required" });
};

// Get trends data
analyticsRouter.get(
  "/trends",
  passport.authenticate("jwt", { session: false }),
  isTeacher,
  getTrendsController
);

// Generate report
analyticsRouter.post(
  "/generateReport",
  passport.authenticate("jwt", { session: false }),
  isTeacher,
  generateReportController
);

module.exports = analyticsRouter;
