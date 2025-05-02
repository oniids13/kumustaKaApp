const { Router } = require("express");
const passport = require("passport");

const {
  getDailySurveyController,
  submitSurveyResponseController,
  getSurveyHistoryController,
} = require("../controller/surveyController");

const surveyRouter = Router();

surveyRouter.get(
  "/daily",
  passport.authenticate("jwt", { session: false }),
  getDailySurveyController
);

surveyRouter.post(
  "/response",
  passport.authenticate("jwt", { session: false }),
  submitSurveyResponseController
);

surveyRouter.get(
  "/history",
  passport.authenticate("jwt", { session: false }),
  getSurveyHistoryController
);

module.exports = surveyRouter;
