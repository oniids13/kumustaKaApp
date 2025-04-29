const { Router } = require("express");
const passport = require("passport");
const {
  createMoodEntryController,
  getRecentMoodEntryController,
  checkTodaySubmissionController,
} = require("../controller/moodEntryController");
const moodEntryRouter = Router();

moodEntryRouter.post(
  "/newMoodEntry",
  passport.authenticate("jwt", { session: false }),
  createMoodEntryController
);

moodEntryRouter.get(
  "/weeklyMoodEntries",
  passport.authenticate("jwt", { session: false }),
  getRecentMoodEntryController
);

moodEntryRouter.get(
  "/checkToday",
  passport.authenticate("jwt", { session: false }),
  checkTodaySubmissionController
);

module.exports = moodEntryRouter;
