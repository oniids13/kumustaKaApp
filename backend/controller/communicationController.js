const communicationQueries = require("../model/communicationQueries");

/**
 * Get conversations for the current user
 */
const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await communicationQueries.getUserConversations(
      userId
    );
    res.json(conversations);
  } catch (error) {
    console.error("Error in getUserConversations controller:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

/**
 * Get a single conversation by ID
 */
const getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const conversation = await communicationQueries.getConversationById(
      id,
      userId
    );
    res.json(conversation);
  } catch (error) {
    console.error("Error in getConversationById controller:", error);
    if (error.message === "Conversation not found or access denied") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to fetch conversation" });
  }
};

/**
 * Create a new message in a conversation
 */
const createMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user.id;

    if (!conversationId || !content) {
      return res
        .status(400)
        .json({ message: "Conversation ID and content are required" });
    }

    const message = await communicationQueries.createMessage(
      conversationId,
      content,
      senderId
    );
    res.status(201).json(message);
  } catch (error) {
    console.error("Error in createMessage controller:", error);
    if (error.message === "Conversation not found or access denied") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to create message" });
  }
};

/**
 * Create a new conversation
 */
const createConversation = async (req, res) => {
  try {
    const { participantIds, title, isGroup } = req.body;
    const creatorId = req.user.id;

    if (
      !participantIds ||
      !Array.isArray(participantIds) ||
      participantIds.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "At least one participant is required" });
    }

    // Always include the creator if not already in the participants
    if (!participantIds.includes(creatorId)) {
      participantIds.push(creatorId);
    }

    const conversation = await communicationQueries.createConversation(
      participantIds,
      creatorId,
      title || null,
      isGroup || false
    );

    res.status(201).json(conversation);
  } catch (error) {
    console.error("Error in createConversation controller:", error);
    if (error.message === "One or more participants not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to create conversation" });
  }
};

/**
 * Mark all messages in a conversation as read
 */
const markConversationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await communicationQueries.markConversationAsRead(id, userId);
    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error in markConversationAsRead controller:", error);
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
};

/**
 * Get users available for messaging (teachers and counselors for students,
 * students for teachers and counselors)
 */
const getMessageableUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let users;
    if (userRole === "STUDENT") {
      // Students can message teachers and counselors
      users = await communicationQueries.getMessageableUsers(userId);
    } else if (userRole === "TEACHER" || userRole === "COUNSELOR") {
      // Teachers and counselors can message students
      users = await communicationQueries.getStudentsForMessaging(userId);
    } else {
      // Admin can message everyone
      const teachers = await communicationQueries.getMessageableUsers(userId);
      const students = await communicationQueries.getStudentsForMessaging(
        userId
      );
      users = [...teachers, ...students];
    }

    res.json(users);
  } catch (error) {
    console.error("Error in getMessageableUsers controller:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

module.exports = {
  getUserConversations,
  getConversationById,
  createMessage,
  createConversation,
  markConversationAsRead,
  getMessageableUsers,
};
