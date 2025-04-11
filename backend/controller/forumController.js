const { createNewPost } = require('../model/forumQueries');


const createForumPostController = async (req, res) => {
    const { title, content } = req.body;
    const userId = req.user.id;



    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const newPost = await createNewPost( title, content, userId );
        return res.status(201).json(newPost);
    } catch (error) {
        console.error("Error creating post:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


module.exports = {
    createForumPostController,
};