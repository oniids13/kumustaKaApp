const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createNewPost = async (title, content, imageUrls, authorId) => {
  try {
    const newPost = await prisma.forumPost.create({
      data: {
        title,
        content,
        images: imageUrls,
        author: { connect: { id: authorId } },
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

const getAllPosts = async (status) => {
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return allPosts;
  } catch (error) {
    console.error("Error retrieving posts:", error);
    throw new Error("Error retrieving posts: " + error.message);
  }
};

const editForumPost = async (
  postId,
  title,
  content,
  currentImages,
  uploadedImages,
  authorId
) => {
  try {
    const updatedPost = await prisma.forumPost.update({
      where: { id: postId, authorId: authorId },
      data: {
        title,
        content,
        images: [...currentImages, ...uploadedImages],
      },
      select: {
        id: true,
        title: true,
        content: true,
        images: true,
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
    const deletedPost = await prisma.forumPost.delete({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        content: true,
        images: true,
      },
    });
    return deletedPost;
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

module.exports = {
  createNewPost,
  getAllPosts,
  getForumPost,
  editForumPost,
  deleteForumPost,
};
