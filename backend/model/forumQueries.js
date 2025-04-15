const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createNewPost = async (title, content, authorId) => {
  try {
    const newPost = await prisma.forumPost.create({
      data: {
        title,
        content,
        author: { connect: { id: authorId } },
      },
      select: {
        id: true,
        title: true,
        content: true,
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
          },
        },
        comments: {
          // Now properly nested under ForumPost
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

module.exports = {
  createNewPost,
  getAllPosts,
};
