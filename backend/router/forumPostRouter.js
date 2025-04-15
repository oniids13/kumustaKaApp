const {
  createForumPostController,
  getAllForumPostsController,
} = require("../controller/forumController");
const { Router } = require("express");
const forumPostRouter = Router();
const passport = require("passport");

forumPostRouter.post(
  "/newPost",
  passport.authenticate("jwt", { session: false }),
  createForumPostController
);
forumPostRouter.get(
  "/allPosts",
  passport.authenticate("jwt", { session: false }),
  getAllForumPostsController
);

module.exports = forumPostRouter;
