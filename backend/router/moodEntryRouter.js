const { Router } = require("express");
const passport = require("passport");
const {
  createMoodEntryController,
  getAllMoodEntryController,
} = require("../controller/moodEntryController");
const moodEntryRouter = Router();

moodEntryRouter.post(
  "/newMoodEntry",
  passport.authenticate("jwt", { session: false }),
  createMoodEntryController
);

moodEntryRouter.get(
  "/allMoodEntries",
  passport.authenticate("jwt", { session: false }),
  getAllMoodEntryController
);

module.exports = moodEntryRouter;
