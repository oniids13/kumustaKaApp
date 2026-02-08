const express = require("express");
const passport = require("passport");
const {
  getTrendsController,
  generateReportController,
  getStudentForumActivityController,
  getClassroomMoodOverviewController,
  getAcademicPerformanceController,
  getAllStudentsController,
  getDailySubmissionCountsController,
  getSectionStudentsController,
} = require("../controller/teacherController");

const router = express.Router();

// Middleware to check if user is a teacher
const isTeacher = (req, res, next) => {
  if (req.user && req.user.role === "TEACHER") {
    return next();
  }
  return res
    .status(403)
    .json({ message: "Access denied: Teacher role required" });
};

// Dashboard data
router.get(
  "/trends",
  passport.authenticate("jwt", { session: false }),
  isTeacher,
  getTrendsController
);
router.get(
  "/daily-submissions",
  passport.authenticate("jwt", { session: false }),
  isTeacher,
  getDailySubmissionCountsController
);
router.get(
  "/mood-overview",
  passport.authenticate("jwt", { session: false }),
  isTeacher,
  getClassroomMoodOverviewController
);
router.get(
  "/academic-performance",
  passport.authenticate("jwt", { session: false }),
  isTeacher,
  getAcademicPerformanceController
);
router.get(
  "/forum-activity",
  passport.authenticate("jwt", { session: false }),
  isTeacher,
  getStudentForumActivityController
);
router.get(
  "/students",
  passport.authenticate("jwt", { session: false }),
  isTeacher,
  getAllStudentsController
);

// Section students
router.get(
  "/section-students",
  passport.authenticate("jwt", { session: false }),
  isTeacher,
  getSectionStudentsController
);
// Report generation
router.post(
  "/reports",
  passport.authenticate("jwt", { session: false }),
  isTeacher,
  generateReportController
);

module.exports = router;
