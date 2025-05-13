const express = require("express");
const router = express.Router();
const communicationController = require("../controller/communicationController");
const passport = require("passport");

// Authentication middleware
const authenticate = passport.authenticate("jwt", { session: false });

// All routes require authentication
router.use(authenticate);

// Get all conversations for current user
router.get("/conversations", communicationController.getUserConversations);

// Get a specific conversation by ID
router.get("/conversations/:id", communicationController.getConversationById);

// Create a new conversation
router.post("/conversations", communicationController.createConversation);

// Create a new message in a conversation
router.post("/messages", communicationController.createMessage);

// Mark all messages in a conversation as read
router.put(
  "/conversations/:id/read",
  communicationController.markConversationAsRead
);

// Get users available for messaging
router.get("/users", communicationController.getMessageableUsers);

module.exports = router;
