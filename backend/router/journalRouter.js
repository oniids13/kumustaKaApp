const { Router } = require("express");
const passport = require("passport");
const {
  createJournalController,
  getAllJournalsController,
  editJournalController,
  deleteJournalController,
} = require("../controller/journalController");

const journalRouter = Router();

journalRouter.post(
  "/newJournal",
  passport.authenticate("jwt", { session: false }),
  createJournalController
);

journalRouter.get(
  "/allJournal",
  passport.authenticate("jwt", { session: false }),
  getAllJournalsController
);

journalRouter.patch(
  "/editJournal/:journalId",
  passport.authenticate("jwt", { session: false }),
  editJournalController
);

journalRouter.delete(
  "/deleteJournal/:journalId",
  passport.authenticate("jwt", { session: false }),
  deleteJournalController
);

module.exports = journalRouter;
