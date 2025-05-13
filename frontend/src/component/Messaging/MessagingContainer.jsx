import React, { useState } from "react";
import { Row, Col, Divider, Badge } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import ConversationList from "./ConversationList";
import ConversationView from "./ConversationView";
import NewConversation from "./NewConversation";
import "./Messaging.css";

const MessagingContainer = () => {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSelectConversation = (conversationId) => {
    setSelectedConversationId(conversationId);
  };

  const handleConversationUpdated = () => {
    // Trigger refresh of the conversation list
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleNewConversation = (conversationId) => {
    setSelectedConversationId(conversationId);
    handleConversationUpdated();
  };

  return (
    <div className="messaging-container">
      <div className="messaging-header">
        <h2>
          <MessageOutlined /> Messages
        </h2>
        <NewConversation onConversationCreated={handleNewConversation} />
      </div>

      <Row className="messaging-content">
        <Col
          xs={24}
          sm={24}
          md={8}
          lg={6}
          className="conversation-list-container"
        >
          <ConversationList
            key={refreshTrigger}
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversationId}
          />
        </Col>

        <Col
          xs={24}
          sm={24}
          md={16}
          lg={18}
          className="conversation-view-container"
        >
          <ConversationView
            conversationId={selectedConversationId}
            onConversationUpdated={handleConversationUpdated}
          />
        </Col>
      </Row>
    </div>
  );
};

export default MessagingContainer;
