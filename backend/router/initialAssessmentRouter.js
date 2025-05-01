const {
  createInitialAssessmentController,
  getInitialAssessmentController,
  submitInitialAssessmentController,
} = require("../controller/initialAssessmentController");

const { Router } = require("express");
const passport = require("passport");
const initialAssessmentRouter = Router();

initialAssessmentRouter.post(
  "/createInitialAssessment",
  passport.authenticate("jwt", { session: false }),
  createInitialAssessmentController
);
initialAssessmentRouter.get(
  "/getInitialAssessment",
  passport.authenticate("jwt", { session: false }),
  getInitialAssessmentController
);
initialAssessmentRouter.post(
  "/submitInitialAssessment",
  passport.authenticate("jwt", { session: false }),
  submitInitialAssessmentController
);

module.exports = initialAssessmentRouter;
