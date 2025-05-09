const {
  createNewPost,
  getAllPosts,
  getForumPost,
  editForumPost,
  deleteForumPost,
  createComment,
  getAllComments,
  editComment,
  deleteComment,
  sparkReaction,
  publishForumPost,
} = require("../model/forumQueries");
const { uploadImage } = require("../services/cloudinary.service");
const fs = require("fs");

// Post Related Controller

const createForumPostController = async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  if (!req.user) {
    console.log(userId);

    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const url = await uploadImage(file.path, userId);
          imageUrls.push(url);
        } finally {
          fs.unlinkSync(file.path);
        }
      }
    }

    const newPost = await createNewPost(
      title,
      content,
      imageUrls,
      userId,
      role
    );
    return res.status(201).json(newPost);
  } catch (error) {
    console.error("Error creating post:", error);

    // Cleanup remaining files in case of error

    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create forum post",
    });
  }
};

const getAllForumPostsController = async (req, res) => {
  const userId = req.user.id;

  try {
    const publishedPosts = await getAllPosts(true, userId);
    const unpublishedPosts = await getAllPosts(false, userId);

    const allPosts = publishedPosts.concat(unpublishedPosts);
    if (allPosts.length > 0) {
      return res
        .status(200)
        .json({ success: "All Posts", publishedPosts, unpublishedPosts });
    }

    return res.status(404).json({ message: "No posts found" });
  } catch (error) {
    console.error("Error retrieving posts:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const editForumPostController = async (req, res) => {
  try {
    const { title, content, deletedImages } = req.body;
    const postId = req.params.postId;
    const authorId = req.user.id;
    const newImages = req.files || [];

    const deletedImagesIds = deletedImages ? JSON.parse(deletedImages) : [];

    const uploadedImages = await Promise.all(
      newImages.map(async (file) => {
        try {
          const result = await uploadImage(file.path, authorId);
          return result;
        } finally {
          fs.unlinkSync(file.path);
        }
      })
    );

    const currentPost = await getForumPost(postId);

    const currentImages = Array.isArray(currentPost?.images)
      ? currentPost.images
      : [];

    const updatedImages = [
      ...currentImages.filter((img) => {
        const publicId = typeof img === "string" ? img : img.publicId;
        return !deletedImagesIds.includes(publicId);
      }),
      ...uploadedImages,
    ];

    const updatedPost = await editForumPost(
      postId,
      title,
      content,
      updatedImages,
      authorId,
      deletedImagesIds
    );

    res.status(201).json(updatedPost);
  } catch (error) {
    console.error("Error in controller:", error);

    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const deleteForumPostController = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;
    const post = await getForumPost(postId);

    if (!post || post.authorId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await deleteForumPost(postId);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error in delete controller:", error);
    res.status(500).json({
      message: error.message || "Failed to delete post",
    });
  }
};

// Comment Related Controller

const createCommentController = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No user data found" });
    }

    const { content } = req.body;
    const { postId } = req.params;
    const userId = req.user.id;

    const newComment = await createComment(content, postId, userId);
    return res.status(201).json(newComment);
  } catch (error) {
    console.error("Error in creating comment controller:", error);
    res.status(500).json({
      message: error.message || "Error creating comment",
    });
  }
};

const getAllCommentsController = async (req, res) => {
  try {
    const { postId } = req.params;

    const allComments = await getAllComments(postId);

    return res.status(200).json(allComments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      message: error.message || "Error fetching comments",
    });
  }
};

const editCommentController = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const updatedComment = await editComment(commentId, userId, content);

    return res.status(201).json(updatedComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    return res
      .status(500)
      .json({ message: error.message || "Error updating comment" });
  }
};

const deleteCommentController = async (req, res) => {
  try {
    const { commentId } = req.params;

    const userId = req.user.id;

    const deletedComment = await deleteComment(commentId, userId);

    return res.status(200).json(deletedComment);
  } catch (error) {
    console.error("Error deleting comment: ", error);
    return res.status(500);
  }
};

const sparkReactionController = async (req, res) => {
  const { postId } = req.params;
  const { id, role } = req.user;

  if (role !== "STUDENT" && role !== "TEACHER") {
    return res.status(403).json({
      message: "Only students and teachers can react to posts",
    });
  }

  try {
    const result = await sparkReaction(postId, id, role);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error handling reaction:", error);
    return res.status(500).json({
      error: error.message || "Failed to process reaction",
    });
  }
};

const publishForumPostController = async (req, res) => {
  try {
    const { postId } = req.params;
    const role = req.user.role;

    if (role !== "TEACHER") {
      return res.status(403).json({
        message: "Only teachers can publish posts",
      });
    }
    const result = await publishForumPost(postId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error publishing post:", error);
    return res.status(500).json({
      error: error.message || "Failed to publish post",
    });
  }
};

module.exports = {
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
};
