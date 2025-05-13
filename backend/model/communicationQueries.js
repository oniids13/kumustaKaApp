const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get conversations for a user
 * @param {string} userId - User ID
 * @returns {Array} List of conversations with latest message
 */
const getUserConversations = async (userId) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          include: {
            sender: {
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
        updatedAt: "desc",
      },
    });

    // Format the conversations and add unread count
    const formattedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        // Count unread messages
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: {
              not: userId,
            },
            recipients: {
              some: {
                id: userId,
              },
            },
            isRead: false,
          },
        });

        // Generate title for direct conversations (if not already set)
        let title = conversation.title;
        if (!title && !conversation.isGroup) {
          const otherParticipant = conversation.participants.find(
            (p) => p.id !== userId
          );
          if (otherParticipant) {
            title = `${otherParticipant.firstName} ${otherParticipant.lastName}`;
          }
        }

        return {
          id: conversation.id,
          title: title,
          participants: conversation.participants,
          latestMessage: conversation.messages[0] || null,
          unreadCount,
          isGroup: conversation.isGroup,
          updatedAt: conversation.updatedAt,
        };
      })
    );

    return formattedConversations;
  } catch (error) {
    console.error("Error getting user conversations:", error);
    throw error;
  }
};

/**
 * Get a single conversation by ID
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - Current user ID to verify access
 * @returns {Object} Conversation with messages
 */
const getConversationById = async (conversationId, userId) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found or access denied");
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId,
        },
        recipients: {
          some: {
            id: userId,
          },
        },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Generate title for direct conversations
    let title = conversation.title;
    if (!title && !conversation.isGroup) {
      const otherParticipant = conversation.participants.find(
        (p) => p.id !== userId
      );
      if (otherParticipant) {
        title = `${otherParticipant.firstName} ${otherParticipant.lastName}`;
      }
    }

    return {
      ...conversation,
      title,
    };
  } catch (error) {
    console.error("Error getting conversation by ID:", error);
    throw error;
  }
};

/**
 * Create a new message in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} content - Message content
 * @param {string} senderId - Sender's user ID
 * @returns {Object} Created message
 */
const createMessage = async (conversationId, content, senderId) => {
  try {
    // Get the conversation first to validate and get recipients
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            id: senderId,
          },
        },
      },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found or access denied");
    }

    // Get recipients (all participants except sender)
    const recipients = conversation.participants.filter(
      (p) => p.id !== senderId
    );

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        conversationId,
        recipients: {
          connect: recipients.map((r) => ({ id: r.id })),
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return message;
  } catch (error) {
    console.error("Error creating message:", error);
    throw error;
  }
};

/**
 * Create a new conversation
 * @param {Array} participantIds - Array of user IDs to include in the conversation
 * @param {string} creatorId - ID of the user creating the conversation
 * @param {string} title - Optional title for group conversations
 * @param {boolean} isGroup - Whether this is a group conversation
 * @returns {Object} Created conversation
 */
const createConversation = async (
  participantIds,
  creatorId,
  title = null,
  isGroup = false
) => {
  try {
    // Verify all participants exist
    const participants = await prisma.user.findMany({
      where: {
        id: {
          in: participantIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (participants.length !== participantIds.length) {
      throw new Error("One or more participants not found");
    }

    // For direct messages, check if a conversation already exists between these users
    if (!isGroup && participantIds.length === 2) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: {
              id: {
                in: participantIds,
              },
            },
          },
          AND: [
            {
              participants: {
                some: {
                  id: participantIds[0],
                },
              },
            },
            {
              participants: {
                some: {
                  id: participantIds[1],
                },
              },
            },
          ],
        },
        include: {
          participants: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          },
        },
      });

      if (existingConversation) {
        return existingConversation;
      }
    }

    // Create the new conversation
    const conversation = await prisma.conversation.create({
      data: {
        title,
        isGroup,
        participants: {
          connect: participantIds.map((id) => ({ id })),
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return conversation;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

/**
 * Mark all messages in a conversation as read for a user
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 */
const markConversationAsRead = async (conversationId, userId) => {
  try {
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId,
        },
        recipients: {
          some: {
            id: userId,
          },
        },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    throw error;
  }
};

/**
 * Get all teachers and counselors for starting new conversations
 * @returns {Array} List of users who can be messaged
 */
const getMessageableUsers = async (userId) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ["TEACHER", "COUNSELOR"],
        },
        id: {
          not: userId, // Don't include current user
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
      },
      orderBy: {
        lastName: "asc",
      },
    });

    return users;
  } catch (error) {
    console.error("Error getting messageable users:", error);
    throw error;
  }
};

/**
 * Get students for teachers and counselors
 * @param {string} userId - ID of teacher or counselor
 * @returns {Array} List of students
 */
const getStudentsForMessaging = async (userId) => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (
      !currentUser ||
      (currentUser.role !== "TEACHER" && currentUser.role !== "COUNSELOR")
    ) {
      throw new Error("Only teachers and counselors can access student lists");
    }

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
      orderBy: {
        lastName: "asc",
      },
    });

    return students;
  } catch (error) {
    console.error("Error getting students for messaging:", error);
    throw error;
  }
};

module.exports = {
  getUserConversations,
  getConversationById,
  createMessage,
  createConversation,
  markConversationAsRead,
  getMessageableUsers,
  getStudentsForMessaging,
};
