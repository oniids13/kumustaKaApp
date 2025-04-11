const { PrismaClient } = require('@prisma/client');
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
            author: { select: {firstName: true, lastName: true}},
            authorId: true,
            isPublished: true,
            createdAt: true,
        }
        });
        return newPost;
    } catch (error) {
        throw new Error('Error creating post: ' + error.message);
    }
}

module.exports = {
    createNewPost,
};