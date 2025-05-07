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
const {
  sundayNightUpdate,
  mondayMorningReset,
} = require("../model/goalTracker");

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

// Manual trigger routes for testing cron jobs (admin only)
goalTrackerRouter.post(
  "/admin/trigger-sunday-update",
  authenticate,
  async (req, res) => {
    try {
      // Check if user is admin (you might want to add proper admin authorization)
      if (req.user.role !== "ADMIN") {
        return res
          .status(403)
          .json({ message: "Only admins can trigger cron jobs" });
      }

      console.log("Manually triggering Sunday night update...");
      const result = await sundayNightUpdate();
      return res
        .status(200)
        .json({ message: "Sunday night update completed", result });
    } catch (error) {
      console.error("Error triggering Sunday night update:", error);
      return res
        .status(500)
        .json({ message: "Failed to trigger Sunday night update" });
    }
  }
);

goalTrackerRouter.post(
  "/admin/trigger-monday-reset",
  authenticate,
  async (req, res) => {
    try {
      // Check if user is admin (you might want to add proper admin authorization)
      if (req.user.role !== "ADMIN") {
        return res
          .status(403)
          .json({ message: "Only admins can trigger cron jobs" });
      }

      console.log("Manually triggering Monday morning reset...");
      const result = await mondayMorningReset();
      return res
        .status(200)
        .json({ message: "Monday morning reset completed", result });
    } catch (error) {
      console.error("Error triggering Monday morning reset:", error);
      return res
        .status(500)
        .json({ message: "Failed to trigger Monday morning reset" });
    }
  }
);

module.exports = goalTrackerRouter;
