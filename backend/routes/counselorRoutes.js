const express = require("express");
const router = express.Router();
const counselorController = require("../controller/counselorController");
const { authMiddleware } = require("../middleware/authMiddleware");

// Get all students
router.get(
  "/students",
  authMiddleware,
  counselorController.getStudentsController
);

// Get student surveys
router.get(
  "/students/:studentId/surveys",
  authMiddleware,
  counselorController.getStudentSurveysController
);

// Get student moods
router.get(
  "/students/:studentId/moods",
  authMiddleware,
  counselorController.getStudentMoodsController
);

// Get all interventions
router.get(
  "/interventions",
  authMiddleware,
  counselorController.getInterventionsController
);

// Create intervention
router.post(
  "/interventions",
  authMiddleware,
  counselorController.createInterventionController
);

// Update intervention
router.put(
  "/interventions/:interventionId",
  authMiddleware,
  counselorController.updateInterventionController
);

// Delete intervention
router.delete(
  "/interventions/:interventionId",
  authMiddleware,
  counselorController.deleteInterventionController
);

// Generate report
router.post(
  "/reports/generate",
  authMiddleware,
  counselorController.generateReportController
);

// Get report history
router.get(
  "/reports",
  authMiddleware,
  counselorController.getReportHistoryController
);

// Download report
router.get(
  "/reports/:reportId/download",
  authMiddleware,
  counselorController.downloadReportController
);

// Get student initial assessment
router.get(
  "/students/:studentId/initial-assessment",
  authMiddleware,
  counselorController.getStudentInitialAssessment
);

// Get daily submissions
router.get(
  "/daily-submissions",
  authMiddleware,
  counselorController.getDailySubmissionCountsController
);

module.exports = router;
