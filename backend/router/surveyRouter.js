// backend/routes/surveyRouter.js
const { Router } = require("express");
const passport = require("passport");
const {
  createSurveyController,
  getDailySurveyController,
  submitSurveyController,
  checkTodaysSubmissionController,
  getResponseHistoryController,
} = require("../controller/surveyController");

const { isAdmin, isStudent } = require("../middleware/roleCheck");

const surveyRouter = Router();

// Admin-only routes
surveyRouter.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  createSurveyController
);

surveyRouter.get(
  "/daily",
  passport.authenticate("jwt", { session: false }),
  isStudent,
  getDailySurveyController
);

surveyRouter.post(
  "/submit",
  passport.authenticate("jwt", { session: false }),
  isStudent,
  submitSurveyController
);

surveyRouter.get(
  "/status",
  passport.authenticate("jwt", { session: false }),
  isStudent,
  checkTodaysSubmissionController
);

surveyRouter.get(
  "/history",
  passport.authenticate("jwt", { session: false }),
  isStudent,
  getResponseHistoryController
);

module.exports = surveyRouter;
