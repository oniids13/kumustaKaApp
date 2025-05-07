const {
  createGoalController,
  getWeeklyGoalsController,
  toggleGoalCompletionController,
  getYearlySummaryController,
  updateWeeklySummaryController,
} = require("../controller/goalTrackerController");

const { Router } = require("express");
const goalTrackerRouter = Router();
const passport = require("passport");

// Apply JWT authentication to all routes
const authenticate = passport.authenticate("jwt", { session: false });

// Goal routes
goalTrackerRouter.post("/", authenticate, createGoalController);
goalTrackerRouter.get("/weekly", authenticate, getWeeklyGoalsController);
goalTrackerRouter.put(
  "/:goalId/toggle",
  authenticate,
  toggleGoalCompletionController
);
goalTrackerRouter.get("/yearly", authenticate, getYearlySummaryController);
goalTrackerRouter.post(
  "/summary/update",
  authenticate,
  updateWeeklySummaryController
);

module.exports = goalTrackerRouter;
