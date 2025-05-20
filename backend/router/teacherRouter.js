const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const {
  getTrendsController,
  generateReportController,
  getStudentForumActivityController,
  getClassroomMoodOverviewController,
  getAcademicPerformanceController,
  getAllStudentsController,
  getDailySubmissionCountsController,
} = require("../controller/teacherController");

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
router.get("/trends", auth, isTeacher, getTrendsController);
router.get(
  "/daily-submissions",
  auth,
  isTeacher,
  getDailySubmissionCountsController
);
router.get(
  "/mood-overview",
  auth,
  isTeacher,
  getClassroomMoodOverviewController
);
router.get(
  "/academic-performance",
  auth,
  isTeacher,
  getAcademicPerformanceController
);
router.get(
  "/forum-activity",
  auth,
  isTeacher,
  getStudentForumActivityController
);
router.get("/students", auth, isTeacher, getAllStudentsController);

// Report generation
router.post("/reports", auth, isTeacher, generateReportController);

module.exports = router;
