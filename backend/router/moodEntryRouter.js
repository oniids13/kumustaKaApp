const { Router } = require("express");
const passport = require("passport");
const {
  createMoodEntryController,
  getRecentMoodEntryController,
  checkTodaySubmissionController,
  getAllMoodEntriesController,
} = require("../controller/moodEntryController");
const moodEntryRouter = Router();

moodEntryRouter.post(
  "/create",
  passport.authenticate("jwt", { session: false }),
  createMoodEntryController
);

moodEntryRouter.post(
  "/newMoodEntry",
  passport.authenticate("jwt", { session: false }),
  createMoodEntryController
);

moodEntryRouter.get(
  "/weeklyMoodEntries/:weekNumber",
  passport.authenticate("jwt", { session: false }),
  getRecentMoodEntryController
);

moodEntryRouter.get(
  "/allMoodEntries",
  passport.authenticate("jwt", { session: false }),
  getAllMoodEntriesController
);

moodEntryRouter.get(
  "/checkToday",
  passport.authenticate("jwt", { session: false }),
  checkTodaySubmissionController
);

module.exports = moodEntryRouter;
