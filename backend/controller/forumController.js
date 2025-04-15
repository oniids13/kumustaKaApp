const { createNewPost, getAllPosts } = require("../model/forumQueries");

const createForumPostController = async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;

  if (!req.user) {
    console.log(userId);

    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const newPost = await createNewPost(title, content, userId);
    return res.status(201).json(newPost);
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({ message: "Internal server error" });
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
