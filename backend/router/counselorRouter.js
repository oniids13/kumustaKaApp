const { Router } = require("express");
const passport = require("passport");
const {
  getStudentsController,
  getStudentSurveysController,
  getStudentMoodsController,
  getInterventionsController,
  createInterventionController,
  updateInterventionController,
  deleteInterventionController,
  generateReportController,
  getReportHistoryController,
  downloadReportController,
  getStudentInitialAssessment,
} = require("../controller/counselorController");

const counselorRouter = Router();

// Middleware to check if user is a counselor
const isCounselor = (req, res, next) => {
  if (req.user && req.user.role === "COUNSELOR") {
    return next();
  }
  return res
    .status(403)
    .json({ message: "Access denied: Counselor role required" });
};

// Student data endpoints
counselorRouter.get(
  "/students",
  passport.authenticate("jwt", { session: false }),
  isCounselor,
  getStudentsController
);

counselorRouter.get(
  "/student/:studentId/surveys",
  passport.authenticate("jwt", { session: false }),
  isCounselor,
  getStudentSurveysController
);

counselorRouter.get(
  "/student/:studentId/moods",
  passport.authenticate("jwt", { session: false }),
  isCounselor,
  getStudentMoodsController
);

// Intervention endpoints
counselorRouter.get(
  "/interventions",
  passport.authenticate("jwt", { session: false }),
  isCounselor,
  getInterventionsController
);

counselorRouter.post(
  "/interventions",
  passport.authenticate("jwt", { session: false }),
  isCounselor,
  createInterventionController
);

counselorRouter.put(
  "/interventions/:interventionId",
  passport.authenticate("jwt", { session: false }),
  isCounselor,
  updateInterventionController
);

counselorRouter.delete(
  "/interventions/:interventionId",
  passport.authenticate("jwt", { session: false }),
  isCounselor,
  deleteInterventionController
);

// Report endpoints
counselorRouter.post(
  "/reports/generate",
  passport.authenticate("jwt", { session: false }),
  isCounselor,
  generateReportController
);

counselorRouter.get(
  "/reports/history",
  passport.authenticate("jwt", { session: false }),
  isCounselor,
  getReportHistoryController
);

counselorRouter.get(
  "/reports/:reportId/download",
  passport.authenticate("jwt", { session: false }),
  isCounselor,
  downloadReportController
);

// Add initial assessment endpoint
counselorRouter.get(
  "/student/:studentId/initialAssessment",
  passport.authenticate("jwt", { session: false }),
  isCounselor,
  getStudentInitialAssessment
);

module.exports = counselorRouter;
