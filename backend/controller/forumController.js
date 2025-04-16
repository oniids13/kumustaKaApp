const { createNewPost, getAllPosts } = require("../model/forumQueries");
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

module.exports = {
  createForumPostController,
  getAllForumPostsController,
};
