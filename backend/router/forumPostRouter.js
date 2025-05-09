const {
  createForumPostController,
  getAllForumPostsController,
  editForumPostController,
  deleteForumPostController,
  createCommentController,
  getAllCommentsController,
  editCommentController,
  deleteCommentController,
  sparkReactionController,
  publishForumPostController,
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
  "/comment/:postId",
  passport.authenticate("jwt", { session: false }),
  createCommentController
);

forumPostRouter.get(
  "/allComments/:postId",
  passport.authenticate("jwt", { session: false }),
  getAllCommentsController
);

forumPostRouter.patch(
  "/editComment/:commentId/",
  passport.authenticate("jwt", { session: false }),
  editCommentController
);

forumPostRouter.delete(
  "/deleteComment/:commentId/",
  passport.authenticate("jwt", { session: false }),
  deleteCommentController
);

forumPostRouter.post(
  "/reaction/:postId",
  passport.authenticate("jwt", { session: false }),
  sparkReactionController
);

forumPostRouter.patch(
  "/publishPost/:postId",
  passport.authenticate("jwt", { session: false }),
  publishForumPostController
);

module.exports = forumPostRouter;
