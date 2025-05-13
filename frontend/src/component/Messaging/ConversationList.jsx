import React, { useState, useEffect } from "react";
import { List, Avatar, Badge, Spin, Alert, Input, Empty } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import "./Messaging.css";

const { Search } = Input;

const ConversationList = ({ onSelectConversation, selectedConversationId }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:3000/api/communication/conversations",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setConversations(response.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError("Failed to load conversations. Please try again later.");
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const filteredConversations = conversations.filter((conversation) => {
    if (!conversation || !conversation.title) return false;

    return (
      conversation.title.toLowerCase().includes(searchText.toLowerCase()) ||
      (conversation.latestMessage &&
        conversation.latestMessage.content &&
        conversation.latestMessage.content
          .toLowerCase()
          .includes(searchText.toLowerCase()))
    );
  });

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <div>Loading conversations...</div>
      </div>
    );
  }

  if (error) {
    return <Alert message={error} type="error" />;
  }

  return (
    <div className="conversation-list">
      <div className="search-container">
        <Search
          placeholder="Search conversations"
          allowClear
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
          prefix={<SearchOutlined />}
        />
      </div>

      {filteredConversations.length === 0 ? (
        <Empty
          description="No conversations found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className="empty-conversations"
        />
      ) : (
        <List
          dataSource={filteredConversations}
          renderItem={(conversation) => (
            <List.Item
              className={`conversation-item ${
                selectedConversationId === conversation.id ? "selected" : ""
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <List.Item.Meta
                avatar={
                  <Badge count={conversation.unreadCount || 0} size="small">
                    <Avatar
                      src={
                        conversation.isGroup
                          ? "/group-avatar.png"
                          : (conversation.participants &&
                              conversation.participants.find(
                                (p) => p && p.id !== user.id
                              )?.avatar) ||
                            "/default-avatar.png"
                      }
                    />
                  </Badge>
                }
                title={conversation.title || "Untitled Conversation"}
                description={
                  conversation.latestMessage &&
                  conversation.latestMessage.sender
                    ? `${
                        conversation.latestMessage.sender.firstName || "User"
                      }: ${
                        conversation.latestMessage.content &&
                        conversation.latestMessage.content.length > 30
                          ? conversation.latestMessage.content.substring(
                              0,
                              30
                            ) + "..."
                          : conversation.latestMessage.content || ""
                      }`
                    : "No messages yet"
                }
              />
              <div className="conversation-time">
                {conversation.latestMessage &&
                conversation.latestMessage.createdAt
                  ? moment(conversation.latestMessage.createdAt).fromNow()
                  : conversation.updatedAt
                  ? moment(conversation.updatedAt).fromNow()
                  : ""}
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default ConversationList;
