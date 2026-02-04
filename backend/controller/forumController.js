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
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Helper function to get user's section
const getUserSection = async (userId, role) => {
  if (role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { sectionId: true },
    });
    return student?.sectionId || null;
  } else if (role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      select: { sectionId: true },
    });
    return teacher?.sectionId || null;
  }
  return null;
};

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
    // Get user's section for students and teachers
    const sectionId = await getUserSection(userId, role);

    // Students must be in a section to post
    if (role === "STUDENT" && !sectionId) {
      return res.status(403).json({
        message:
          "You must be assigned to a section before you can create posts",
      });
    }

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
      role,
      sectionId
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
  const role = req.user.role;

  try {
    // Get user's section for filtering
    const sectionId = await getUserSection(userId, role);

    // Students must be in a section to view posts
    if (role === "STUDENT" && !sectionId) {
      return res.status(403).json({
        message: "You must be assigned to a section to view posts",
        publishedPosts: [],
        unpublishedPosts: [],
      });
    }

    // Get posts filtered by section for students and teachers
    // Counselors and admins can see all posts
    const publishedPosts = await getAllPosts(true, userId, sectionId, role);
    const unpublishedPosts = await getAllPosts(false, userId, sectionId, role);

    const allPosts = publishedPosts.concat(unpublishedPosts);

    // Return empty arrays instead of 404 when no posts found
    return res.status(200).json({
      success: "All Posts",
      publishedPosts,
      unpublishedPosts,
      sectionId, // Include section info for frontend
    });
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
    const userRole = req.user.role;

    console.log("Delete request - User ID:", userId);
    console.log("Delete request - User Role:", userRole);
    console.log("Delete request - Post ID:", postId);

    const post = await getForumPost(postId);
    console.log("Post data:", post);

    // Allow deletion if user is the author or a teacher
    if (!post) {
      console.log("Post not found");
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (post.authorId !== userId && userRole !== "TEACHER") {
      console.log("Unauthorized - User is not author or teacher");
      return res.status(403).json({
        message:
          "Unauthorized: Only post authors and teachers can delete posts",
      });
    }

    console.log("Authorizing deletion...");
    await deleteForumPost(postId);
    console.log("Post deleted successfully");

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
    const userRole = req.user.role;

    const deletedComment = await deleteComment(commentId, userId, userRole);

    return res.status(200).json(deletedComment);
  } catch (error) {
    console.error("Error deleting comment: ", error);
    return res
      .status(500)
      .json({ message: error.message || "Failed to delete comment" });
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

// Get pending posts count (for teachers)
const getPendingPostsCount = async (req, res) => {
  try {
    // Check if user is a teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.id },
      select: { sectionId: true },
    });

    if (!teacher) {
      return res
        .status(403)
        .json({ error: "Only teachers can access this endpoint" });
    }

    // Build where clause - filter by section if teacher has one
    const whereClause = {
      isPublished: false,
    };

    if (teacher.sectionId) {
      whereClause.sectionId = teacher.sectionId;
    }

    // Count unpublished posts in teacher's section
    const pendingCount = await prisma.forumPost.count({
      where: whereClause,
    });

    return res.status(200).json({ pendingCount });
  } catch (error) {
    console.error("Error getting pending posts count:", error);
    return res.status(500).json({ error: "Failed to get pending posts count" });
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
  getPendingPostsCount,
};
