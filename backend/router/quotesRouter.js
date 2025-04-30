const { Router } = require("express");
const { quotesController } = require("../controller/quotesController");
const passport = require("passport");
const quotesRouter = Router();

quotesRouter.get("/quotes", quotesController);

module.exports = quotesRouter;
