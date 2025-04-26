const { Router } = require("express");
const passport = require("passport");
const {
  createEmergencyContactController,
} = require("../controller/emergencyContactController");
const emergencyContactRouter = Router();

emergencyContactRouter.post(
  "/newContact",
  passport.authenticate("jwt", { session: false }),
  createEmergencyContactController
);

module.exports = emergencyContactRouter;
