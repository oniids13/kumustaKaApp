const {
  createNewPost,
  getAllPosts,
  getForumPost,
  editForumPost,
  deleteForumPost,
} = require("../model/forumQueries");
const { uploadImage } = require("../services/cloudinary.service");
const fs = require("fs");

const createForumPostController = async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;

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

    const newPost = await createNewPost(title, content, imageUrls, userId);
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
  try {
    const publishedPosts = await getAllPosts(true);
    const unpublishedPosts = await getAllPosts(false);

    const allPosts = publishedPosts.concat(unpublishedPosts);
    if (allPosts.length > 0) {
      return res
        .status(201)
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

module.exports = {
  createForumPostController,
  getAllForumPostsController,
  editForumPostController,
  deleteForumPostController,
};
