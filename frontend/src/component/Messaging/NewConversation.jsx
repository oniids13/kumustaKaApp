import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Select,
  Input,
  Spin,
  Alert,
  Checkbox,
  Avatar,
} from "antd";
import { MessageOutlined } from "@ant-design/icons";
import axios from "axios";
import "./Messaging.css";

const { Option } = Select;

const NewConversation = ({ onConversationCreated }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [title, setTitle] = useState("");
  const [isGroup, setIsGroup] = useState(false);

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    if (isModalVisible) {
      fetchUsers();
    }
  }, [isModalVisible]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:3000/api/communication/users",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setUsers(response.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again later.");
      setLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    if (selectedUserIds.length === 0) {
      setError("Please select at least one user to message.");
      return;
    }

    if (isGroup && !title.trim()) {
      setError("Please enter a title for the group conversation.");
      return;
    }

    setCreating(true);
    try {
      const response = await axios.post(
        "http://localhost:3000/api/communication/conversations",
        {
          participantIds: selectedUserIds,
          title: isGroup ? title : null,
          isGroup,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (onConversationCreated && response.data && response.data.id) {
        onConversationCreated(response.data.id);
      }

      handleCancel();
    } catch (err) {
      console.error("Error creating conversation:", err);
      setError("Failed to create conversation. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedUserIds([]);
    setTitle("");
    setIsGroup(false);
    setError(null);
  };

  const handleUserSelect = (value) => {
    setSelectedUserIds(value);
    setError(null);
  };

  const filterOption = (input, option) => {
    if (!option || !option.children) return false;
    return (
      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0 ||
      option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0
    );
  };

  return (
    <>
      <Button
        type="primary"
        icon={<MessageOutlined />}
        onClick={() => setIsModalVisible(true)}
        className="new-conversation-btn"
      >
        New Message
      </Button>

      <Modal
        title="New Conversation"
        open={isModalVisible}
        onOk={handleCreateConversation}
        onCancel={handleCancel}
        confirmLoading={creating}
        okText="Create"
        className="new-conversation-modal"
      >
        {error && (
          <Alert message={error} type="error" style={{ marginBottom: 16 }} />
        )}

        <div className="form-item">
          <label>Select Recipients:</label>
          {loading ? (
            <Spin size="small" />
          ) : (
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              placeholder="Select users to message"
              value={selectedUserIds}
              onChange={handleUserSelect}
              filterOption={filterOption}
              optionFilterProp="children"
            >
              {users.map((user) => (
                <Option key={user.id} value={user.id}>
                  <div className="user-option">
                    <Avatar
                      src={user.avatar || "/default-avatar.png"}
                      size="small"
                    />
                    <span>
                      {user.firstName || ""} {user.lastName || ""} (
                      {user.role || "User"})
                    </span>
                  </div>
                </Option>
              ))}
            </Select>
          )}
        </div>

        <div className="form-item checkbox-item">
          <Checkbox
            checked={isGroup}
            onChange={(e) => setIsGroup(e.target.checked)}
          >
            This is a group conversation
          </Checkbox>
        </div>

        {isGroup && (
          <div className="form-item">
            <label>Group Title:</label>
            <Input
              placeholder="Enter group title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default NewConversation;
