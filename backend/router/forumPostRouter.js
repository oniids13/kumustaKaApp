const {
  createForumPostController,
  getAllForumPostsController,
  editForumPostController,
  deleteForumPostController,
  createCommentController,
  getAllCommentsController,
} = require("../controller/forumController");
const { Router } = require("express");
const forumPostRouter = Router();
const passport = require("passport");
const upload = require("../middleware/upload");

//Posts router
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

forumPostRouter.put(
  "/editPost/:postId",
  passport.authenticate("jwt", { session: false }),
  upload.array("images", 5),
  editForumPostController
);

forumPostRouter.delete(
  "/deletePost/:postId",
  passport.authenticate("jwt", { session: false }),
  deleteForumPostController
);

// Comments Router
forumPostRouter.post(
  "/:postId/comment",
  passport.authenticate("jwt", { session: false }),
  createCommentController
);

forumPostRouter.get(
  "/:postId/allComments",
  passport.authenticate("jwt", { session: false }),
  getAllCommentsController
);

module.exports = forumPostRouter;
