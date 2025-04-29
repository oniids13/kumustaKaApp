const { Router } = require("express");
const passport = require("passport");
const {
  getAllResourcesController,
} = require("../controller/resourcesController");
const resourcesRouter = Router();

resourcesRouter.get(
  "/allResources",
  passport.authenticate("jwt", { session: false }),
  getAllResourcesController
);

module.exports = resourcesRouter;
