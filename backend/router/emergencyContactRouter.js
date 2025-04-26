const { Router } = require("express");
const passport = require("passport");
const {
  createEmergencyContactController,
  getAllEmergencyContactController,
  updateEmergencyContactController,
  deleteEmergenctContactController,
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

emergencyContactRouter.delete(
  "/deleteContact/:contactId",
  passport.authenticate("jwt", { session: false }),
  deleteEmergenctContactController
);

module.exports = emergencyContactRouter;
