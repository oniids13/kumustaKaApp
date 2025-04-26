const { Router } = require("express");
const passport = require("passport");
const {
  createEmergencyContactController,
  getAllEmergencyContactController,
  updateEmergencyContactController,
} = require("../controller/emergencyContactController");
const emergencyContactRouter = Router();

emergencyContactRouter.post(
  "/newContact",
  passport.authenticate("jwt", { session: false }),
  createEmergencyContactController
);

emergencyContactRouter.get(
  "/allContact",
  passport.authenticate("jwt", { session: false }),
  getAllEmergencyContactController
);

emergencyContactRouter.put(
  "/updateContact/:contactId",
  passport.authenticate("jwt", { session: false }),
  updateEmergencyContactController
);

module.exports = emergencyContactRouter;
