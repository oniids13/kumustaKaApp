import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Card,
  Typography,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Spin,
  Alert,
  Tooltip,
  Avatar,
  Badge,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  LockOutlined,
  UnlockOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Password } = Input;

const UserManagement = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:3000/api/admin/users",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data && response.data.users) {
        console.log("API User data:", response.data.users);
        setUsers(response.data.users);
      } else {
        setError("No user data received from server");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(`Failed to fetch users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setIsEditMode(false);
    setCurrentUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditUser = (record) => {
    setIsEditMode(true);
    setCurrentUser(record);
    form.setFieldsValue({
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phone: record.phone,
      role: record.role,
      status: record.status,
    });
    setIsModalVisible(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`http://localhost:3000/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      message.success("User deleted successfully");
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      message.error(`Failed to delete user: ${err.message}`);
    }
  };

  const handleToggleUserStatus = async (record) => {
    const newStatus = record.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await axios.patch(
        `http://localhost:3000/api/admin/users/${record.id}/status`,
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      message.success(`User ${newStatus.toLowerCase()}`);
      fetchUsers();
    } catch (err) {
      console.error("Error updating user status:", err);
      message.error(`Failed to update user status: ${err.message}`);
    }
  };

  const handleModalOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          if (isEditMode && currentUser) {
            // Update existing user
            await axios.put(
              `http://localhost:3000/api/admin/users/${currentUser.id}`,
              values,
              {
                headers: {
                  Authorization: `Bearer ${user.token}`,
                  "Content-Type": "application/json",
                },
              }
            );
            message.success("User updated successfully");
          } else {
            // Create new user
            await axios.post("http://localhost:3000/api/admin/users", values, {
              headers: {
                Authorization: `Bearer ${user.token}`,
                "Content-Type": "application/json",
              },
            });
            message.success("User created successfully");
          }

          // Refresh user list from the server
          fetchUsers();
          setIsModalVisible(false);
          form.resetFields();
        } catch (err) {
          console.error("Error saving user:", err);
          message.error(
            `Failed to save user: ${
              err.message || "Please check the form and try again."
            }`
          );
        }
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const getFilteredUsers = () => {
    if (!searchText) return users;
    return users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(searchText.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        user.role.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const getStatusColor = (status) => {
    return status === "ACTIVE" ? "success" : "default";
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "purple";
      case "COUNSELOR":
        return "orange";
      case "TEACHER":
        return "green";
      case "STUDENT":
        return "blue";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "User",
      key: "user",
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.avatar}
            icon={<UserOutlined />}
            style={{
              backgroundColor: record.avatar ? "transparent" : "#722ed1",
            }}
          />
          <div>
            <div>{`${record.firstName} ${record.lastName}`}</div>
            <div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {record.email}
              </Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => <Tag color={getRoleColor(role)}>{role}</Tag>,
      filters: [
        { text: "Student", value: "STUDENT" },
        { text: "Teacher", value: "TEACHER" },
        { text: "Counselor", value: "COUNSELOR" },
        { text: "Admin", value: "ADMIN" },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Badge status={getStatusColor(status)} text={status} />
      ),
      filters: [
        { text: "Active", value: "ACTIVE" },
        { text: "Inactive", value: "INACTIVE" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Last Login",
      dataIndex: "lastLogin",
      key: "lastLogin",
      render: (lastLogin, record) => {
        // Print raw value for debugging
        console.log("Raw lastLogin in render:", lastLogin);

        if (lastLogin) {
          try {
            // Parse the date and display in a readable format
            const loginDate = new Date(lastLogin);
            if (!isNaN(loginDate.getTime())) {
              return loginDate.toLocaleString();
            }
          } catch (e) {
            console.error("Error formatting date:", e);
          }
        }

        // If we have a creation date, show that with a note
        if (record.createdAt) {
          try {
            const creationDate = new Date(record.createdAt);
            if (!isNaN(creationDate.getTime())) {
              return `Created ${creationDate.toLocaleDateString()} (No login)`;
            }
          } catch (e) {
            console.error("Error formatting creation date:", e);
          }
        }

        // As a last resort when no date data is available
        return "First Login Pending";
      },
      sorter: (a, b) => {
        // Simple sort - if we have login data use it, otherwise put those entries last
        if (!a.lastLogin) return 1;
        if (!b.lastLogin) return -1;
        return new Date(b.lastLogin) - new Date(a.lastLogin);
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => moment(date).format("MMM DD, YYYY"),
      sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip
            title={record.status === "ACTIVE" ? "Deactivate" : "Activate"}
          >
            <Button
              type="text"
              icon={
                record.status === "ACTIVE" ? (
                  <LockOutlined />
                ) : (
                  <UnlockOutlined />
                )
              }
              onClick={() => handleToggleUserStatus(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Are you sure you want to delete this user?"
              onConfirm={() => handleDeleteUser(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: "20px" }}>Loading user data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <Title level={2}>User Management</Title>
          <Text type="secondary">
            Manage user accounts, roles, and permissions
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateUser}
        >
          New User
        </Button>
      </div>

      {error && (
        <Alert
          message={error}
          type="warning"
          showIcon
          style={{ marginBottom: "20px" }}
        />
      )}

      <div style={{ marginBottom: "20px" }}>
        <Input
          placeholder="Search users by name, email, or role"
          prefix={<SearchOutlined />}
          onChange={handleSearch}
          allowClear
        />
      </div>

      <Card>
        <Table
          dataSource={getFilteredUsers()}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={isEditMode ? "Edit User" : "Create New User"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        destroyOnHidden={true}
      >
        <Form form={form} layout="vertical" name="userForm">
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: "Please enter first name" }]}
          >
            <Input placeholder="Enter first name" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: "Please enter last name" }]}
          >
            <Input placeholder="Enter last name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[{ required: false }]}
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>

          {!isEditMode && (
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please enter password" },
                { min: 8, message: "Password must be at least 8 characters" },
              ]}
            >
              <Password placeholder="Enter password" />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Please select a role" }]}
          >
            <Select placeholder="Select role">
              <Option value="STUDENT">Student</Option>
              <Option value="TEACHER">Teacher</Option>
              <Option value="COUNSELOR">Counselor</Option>
              <Option value="ADMIN">Admin</Option>
            </Select>
          </Form.Item>

          {isEditMode && (
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: "Please select status" }]}
            >
              <Select>
                <Option value="ACTIVE">Active</Option>
                <Option value="INACTIVE">Inactive</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
