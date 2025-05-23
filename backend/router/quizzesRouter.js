const { Router } = require("express");
const {
  createQuestionController,
  getDailyQuestionsController,
  submitAttemptController,
  getAttemptHistoryController,
  checkAttemptTodayController,
} = require("../controller/quizzesController");
const quizzesRouter = Router();
const passport = require("passport");

quizzesRouter.get(
  "/dailyQuestions",
  passport.authenticate("jwt", { session: false }),
  getDailyQuestionsController
);
quizzesRouter.get(
  "/attempts/history",
  passport.authenticate("jwt", { session: false }),
  getAttemptHistoryController
);

quizzesRouter.post(
  "/attempts",
  passport.authenticate("jwt", { session: false }),
  submitAttemptController
);

quizzesRouter.post(
  "/questions",
  passport.authenticate("jwt", { session: false }),
  createQuestionController
);

quizzesRouter.get(
  "/attempts/today",
  passport.authenticate("jwt", { session: false }),
  checkAttemptTodayController
);
module.exports = quizzesRouter;
