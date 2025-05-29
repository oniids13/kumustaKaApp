import React, { useState, useEffect, useRef } from "react";
import { Input, Button, Avatar, Spin, Alert, Empty, List, Tooltip } from "antd";
import { SendOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import "./Messaging.css";

const ConversationView = ({ conversationId, onConversationUpdated }) => {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  // Get the correct user ID from various possible structures
  const getUserId = () => {
    return user.id || user.userId || user.user?.id || null;
  };

  // Fetch conversation and messages
  useEffect(() => {
    if (conversationId) {
      fetchConversation();
    } else {
      setConversation(null);
      setMessages([]);
      setLoading(false);
    }
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:3000/api/communication/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setConversation(response.data);
      setMessages(response.data.messages || []);
      setLoading(false);

      // Mark conversation as read
      await axios.put(
        `http://localhost:3000/api/communication/conversations/${conversationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (onConversationUpdated) {
        onConversationUpdated();
      }
    } catch (err) {
      console.error("Error fetching conversation:", err);
      setError("Failed to load conversation. Please try again later.");
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const response = await axios.post(
        "http://localhost:3000/api/communication/messages",
        {
          conversationId,
          content: newMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setMessages([...messages, response.data]);
      setNewMessage("");

      if (onConversationUpdated) {
        onConversationUpdated();
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (!conversationId) {
    return (
      <div className="conversation-placeholder">
        <Empty
          description="Select a conversation or start a new one"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <div>Loading conversation...</div>
      </div>
    );
  }

  if (error) {
    return <Alert message={error} type="error" />;
  }

  // If conversation is still null after loading, show an error
  if (!conversation) {
    return <Alert message="Conversation not found" type="error" />;
  }

  const formatTime = (dateTime) => {
    const messageDate = moment(dateTime);
    const now = moment();

    if (messageDate.isSame(now, "day")) {
      return messageDate.format("h:mm A");
    } else if (messageDate.isSame(now.subtract(1, "days"), "day")) {
      return "Yesterday " + messageDate.format("h:mm A");
    } else {
      return messageDate.format("MMM D, h:mm A");
    }
  };

  return (
    <div className="conversation-view">
      <div className="conversation-header">
        <div className="conversation-info">
          <Avatar
            src={
              conversation && conversation.isGroup
                ? "/group-avatar.png"
                : (conversation &&
                    conversation.participants &&
                    conversation.participants.find((p) => p.id !== user.id)
                      ?.avatar) ||
                  "/default-avatar.png"
            }
            size="large"
          />
          <div className="conversation-title">
            {conversation ? conversation.title : ""}
          </div>
        </div>
        <div className="conversation-participants">
          {conversation &&
            conversation.isGroup &&
            conversation.participants && (
              <div className="participant-avatars">
                {conversation.participants.map((participant) => (
                  <Tooltip
                    key={participant.id}
                    title={`${participant.firstName} ${participant.lastName} (${participant.role})`}
                  >
                    <Avatar
                      src={participant.avatar || "/default-avatar.png"}
                      size="small"
                    />
                  </Tooltip>
                ))}
              </div>
            )}
        </div>
      </div>

      <div className="message-list" ref={messageListRef}>
        {messages.length === 0 ? (
          <Empty
            description="No messages yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="empty-messages"
          />
        ) : (
          messages.map((message) => {
            // Convert both IDs to strings for comparison to handle type mismatches
            const currentUserId = String(getUserId() || '');
            const messageSenderId = String(message.sender.id);
            const isOwnMessage = messageSenderId === currentUserId && currentUserId !== '';

            return (
              <div
                key={message.id}
                className={`message-item ${
                  isOwnMessage ? "own-message" : "other-message"
                }`}
              >
                {!isOwnMessage && (
                  <Avatar
                    src={message.sender.avatar || "/default-avatar.png"}
                    size="small"
                  />
                )}
                <div className="message-content">
                  {!isOwnMessage && (
                    <div className="message-sender">
                      {message.sender.firstName} {message.sender.lastName}
                      <span className="sender-role">({message.sender.role})</span>
                    </div>
                  )}
                  <div className="message-bubble">
                    {message.content}
                    <div className="message-time">
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onPressEnter={handleSendMessage}
          disabled={sending}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSendMessage}
          loading={sending}
          disabled={!newMessage.trim()}
        />
      </div>
    </div>
  );
};

export default ConversationView;
