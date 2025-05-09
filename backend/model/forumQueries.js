const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { cloudinary } = require("../services/cloudinary.service");

// Post Related Queries

const createNewPost = async (title, content, imageUrls, authorId, role) => {
  try {
    const newPost = await prisma.forumPost.create({
      data: {
        title,
        content,
        images: imageUrls,
        author: { connect: { id: authorId } },
        isPublished: role === "TEACHER" ? true : false,
      },
      select: {
        id: true,
        title: true,
        content: true,
        images: true,
        author: { select: { firstName: true, lastName: true } },
        authorId: true,
        isPublished: true,
        createdAt: true,
      },
    });
    return newPost;
  } catch (error) {
    throw new Error("Error creating post: " + error.message);
  }
};

const getAllPosts = async (status, currentUserId) => {
  try {
    const allPosts = await prisma.forumPost.findMany({
      where: {
        isPublished: status,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        reactions: {
          where: { type: "SPARK" },
          select: {
            id: true,
            studentId: true,
            teacherId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedPosts = allPosts.map((post) => {
      const sparkCount = post.reactions.length;

      const isSparked = post.reactions.some((r) => {
        r.studentId === currentUserId || r.teacherId === currentUserId;
      });

      return {
        ...post,
        sparkCount,
        isSparked,
      };
    });

    return formattedPosts;
  } catch (error) {
    console.error("Error retrieving posts:", error);
    throw new Error("Error retrieving posts: " + error.message);
  }
};

const editForumPost = async (
  postId,
  title,
  content,
  images,
  authorId,
  deletedImagePublicIds = []
) => {
  try {
    const idsToDelete = Array.isArray(deletedImagePublicIds)
      ? deletedImagePublicIds
      : [deletedImagePublicIds].filter(Boolean);

    if (idsToDelete.length > 0) {
      await Promise.all(
        idsToDelete.map((publicId) =>
          cloudinary.uploader
            .destroy(publicId)
            .catch((e) =>
              console.error(`Failed to delete image ${publicId}:`, e)
            )
        )
      );
    }

    const updatedPost = await prisma.forumPost.update({
      where: { id: postId, authorId: authorId },
      data: {
        title,
        content,
        images,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return updatedPost;
  } catch (error) {
    console.error("Error updating post:", error);
    throw new Error("Error updating post: " + error.message);
  }
};

const deleteForumPost = async (postId) => {
  try {
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: {
        images: true,
      },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    const images = post.images;

    await Promise.all(
      images.map(async (img) => {
        try {
          const publicId =
            typeof img === "string"
              ? img.split("/").pop().split(".")[0]
              : img.publicId;

          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (error) {
          console.error(`Error deleting image:`, error);
        }
      })
    );

    const deletedPost = await prisma.forumPost.delete({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        content: true,
        images: true,
      },
    });
    return { success: true, message: "Comment deleted successfully" };
  } catch (error) {
    console.error("Error deleting post:", error);
    throw new Error("Error deleting post: " + error.message);
  }
};

const publishForumPost = async (postId) => {
  try {
    await prisma.forumPost.update({
      where: { id: postId },
      data: { isPublished: true },
    });
  } catch (error) {
    console.error("Error publishing post:", error);
    throw new Error("Error publishing post: " + error.message);
  }
};

const getForumPost = async (postId) => {
  try {
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
    });
    return post;
  } catch (error) {
    console.error("Error retrieving post:", error);
    throw new Error("Error retrieving post: " + error.message);
  }
};

// Comment Related Queries

const createComment = async (content, postId, authorId) => {
  try {
    const newComment = await prisma.comment.create({
      data: {
        content,
        author: { connect: { id: authorId } },
        post: { connect: { id: postId } },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { firstName: true, lastName: true, id: true } },
        post: { select: { title: true } },
      },
    });
    return newComment;
  } catch (error) {
    console.error("Error creating comment");
    throw new Error("Error creating comment: " + error.message);
  }
};

const getAllComments = async (postId) => {
  try {
    const postComments = await prisma.forumPost.findUnique({
      where: { id: postId },
      include: {
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: true,
          },
        },
      },
    });

    return postComments;
  } catch (error) {
    console.error("Error fetching comments");
    throw new Error("Error fetching comments:" + error.message);
  }
};

const editComment = async (commendId, userId, content) => {
  try {
    const existingComment = await prisma.comment.findUnique({
      where: { id: commendId },
    });

    if (!existingComment) {
      throw new Error("Comment not found");
    }

    if (existingComment.authorId !== userId) {
      throw new Error("Unauthorized: You can only edit your own comments.");
    }

    const updatedComment = await prisma.comment.update({
      where: {
        id: commendId,
      },
      data: {
        content,
      },
      select: {
        id: true,
        content: true,
      },
    });

    return updatedComment;
  } catch (error) {
    console.error("Error updating comment");
    throw new Error("Error updating comment:" + error.message);
  }
};

const deleteComment = async (commentId, userId) => {
  try {
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (existingComment.authorId !== userId) {
      throw new Error("Unauthorized: You can only delete your own comments.");
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return { success: true, message: "Comment deleted successfully" };
  } catch (error) {
    console.error("Error deleting comment");
    throw new Error("Error deleting comment:" + error.message);
  }
};

// Reaction related queries

const sparkReaction = async (postId, userId, userRole) => {
  try {
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        postId,
        OR: [
          { studentId: userRole === "STUDENT" ? userId : undefined },
          { teacherId: userRole === "TEACHER" ? userId : undefined },
        ].filter(Boolean),
      },
    });

    const userExists =
      userRole === "STUDENT"
        ? await prisma.student.findUnique({ where: { userId } })
        : await prisma.teacher.findUnique({ where: { userId } });

    if (!userExists) {
      throw new Error(`${userRole} does not exist.`);
    }

    if (existingReaction) {
      await prisma.reaction.delete({
        where: { id: existingReaction.id },
      });
    } else {
      await prisma.reaction.create({
        data: {
          postId,
          [userRole === "STUDENT" ? "studentId" : "teacherId"]: userExists.id,
          type: "SPARK",
        },
      });
    }

    // 3. Get updated counts
    const sparkCount = await prisma.reaction.count({ where: { postId } });
    const isSparked = !existingReaction;

    return { sparkCount, isSparked };
  } catch (error) {
    console.error("Reaction Error:", error);
    throw error;
  }
};

module.exports = {
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
};
