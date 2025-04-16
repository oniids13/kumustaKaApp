const {
  createForumPostController,
  getAllForumPostsController,
} = require("../controller/forumController");
const { Router } = require("express");
const forumPostRouter = Router();
const passport = require("passport");
const upload = require("../middleware/upload");

forumPostRouter.post(
  "/newPost",
  passport.authenticate("jwt", { session: false }),
  upload.array("images", 5),
  createForumPostController
);
forumPostRouter.get(
  "/allPosts",
  passport.authenticate("jwt", { session: false }),
  getAllForumPostsController
);

module.exports = forumPostRouter;
