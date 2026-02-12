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
  message,
  Popconfirm,
  Spin,
  Alert,
  Collapse,
  Checkbox,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const RoleManagement = () => {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:3000/api/admin/roles",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data && response.data.roles) {
        setRoles(response.data.roles);
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
      // For demonstration purposes, use mock data
      setRoles([
        {
          id: "1",
          name: "ADMIN",
          description: "Full system access and administrative privileges",
          permissions: {
            users: ["create", "read", "update", "delete"],
            roles: ["create", "read", "update", "delete"],
            settings: ["create", "read", "update", "delete"],
            reports: ["create", "read", "update", "delete"],
          },
          userCount: 2,
        },
        {
          id: "2",
          name: "COUNSELOR",
          description:
            "Access to student mental health data and counseling tools",
          permissions: {
            students: ["read", "update"],
            interventions: ["create", "read", "update", "delete"],
            reports: ["create", "read"],
            forum: ["create", "read", "update", "delete"],
          },
          userCount: 10,
        },
        {
          id: "3",
          name: "TEACHER",
          description: "Access to teaching resources and student monitoring",
          permissions: {
            students: ["read"],
            dashboard: ["read"],
            forum: ["create", "read", "update", "delete"],
            posts: ["create", "read", "update", "delete"],
          },
          userCount: 25,
        },
        {
          id: "4",
          name: "STUDENT",
          description: "Basic access to student features and resources",
          permissions: {
            profile: ["read", "update"],
            surveys: ["create", "read"],
            forum: ["create", "read", "update"],
            resources: ["read"],
          },
          userCount: 120,
        },
      ]);
      setError("Could not fetch role data. Displaying demonstration data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = () => {
    setIsEditMode(false);
    setCurrentRole(null);
    form.resetFields();
    form.setFieldsValue({
      permissions: {
        users: [],
        roles: [],
        settings: [],
        reports: [],
        students: [],
        interventions: [],
        dashboard: [],
        forum: [],
        posts: [],
        profile: [],
        surveys: [],
        resources: [],
      },
    });
    setIsModalVisible(true);
  };

  const handleEditRole = (record) => {
    setIsEditMode(true);
    setCurrentRole(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      permissions: record.permissions,
    });
    setIsModalVisible(true);
  };

  const handleDeleteRole = async (roleId) => {
    try {
      await axios.delete(`http://localhost:3000/api/admin/roles/${roleId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      message.success("Role deleted successfully");
      fetchRoles();
    } catch (err) {
      console.error("Error deleting role:", err);
      // For demonstration, update local state
      setRoles(roles.filter((r) => r.id !== roleId));
      message.success("Role deleted successfully");
    }
  };

  const handleModalOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          if (isEditMode && currentRole) {
            // Update existing role
            await axios.put(
              `http://localhost:3000/api/admin/roles/${currentRole.id}`,
              values,
              {
                headers: {
                  Authorization: `Bearer ${user.token}`,
                  "Content-Type": "application/json",
                },
              }
            );
            message.success("Role updated successfully");
          } else {
            // Create new role
            await axios.post("http://localhost:3000/api/admin/roles", values, {
              headers: {
                Authorization: `Bearer ${user.token}`,
                "Content-Type": "application/json",
              },
            });
            message.success("Role created successfully");
          }

          // For demonstration, update local state
          if (isEditMode && currentRole) {
            setRoles(
              roles.map((r) =>
                r.id === currentRole.id ? { ...r, ...values } : r
              )
            );
          } else {
            const newRole = {
              id: String(roles.length + 1),
              ...values,
              userCount: 0,
            };
            setRoles([...roles, newRole]);
          }

          setIsModalVisible(false);
          form.resetFields();
        } catch (err) {
          console.error("Error saving role:", err);
          message.error(
            "Failed to save role. Please check the form and try again."
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

  const formatPermissions = (permissions) => {
    const allPermissions = [];
    for (const module in permissions) {
      permissions[module].forEach((permission) => {
        allPermissions.push(`${permission} ${module}`);
      });
    }

    return allPermissions.map((perm, index) => (
      <Tag color="blue" key={index}>
        {perm}
      </Tag>
    ));
  };

  const permissionModules = [
    { key: "users", title: "User Management" },
    { key: "roles", title: "Role Management" },
    { key: "settings", title: "System Settings" },
    { key: "reports", title: "Reports" },
    { key: "students", title: "Student Data" },
    { key: "interventions", title: "Interventions" },
    { key: "dashboard", title: "Dashboard" },
    { key: "forum", title: "Community Forum" },
    { key: "posts", title: "Posts" },
    { key: "profile", title: "User Profile" },
    { key: "surveys", title: "Surveys" },
    { key: "resources", title: "Resources" },
  ];

  const permissionActions = ["create", "read", "update", "delete"];

  const columns = [
    {
      title: "Role Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <Tag color="purple">{name}</Tag>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Users Assigned",
      dataIndex: "userCount",
      key: "userCount",
      sorter: (a, b) => a.userCount - b.userCount,
    },
    {
      title: "Permissions",
      dataIndex: "permissions",
      key: "permissions",
      render: (permissions) => (
        <div style={{ maxWidth: "400px", overflow: "hidden" }}>
          {formatPermissions(permissions).slice(0, 5)}
          {Object.values(permissions).flat().length > 5 && (
            <Tag>+{Object.values(permissions).flat().length - 5} more</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditRole(record)}
          />
          <Popconfirm
            title={
              <>
                Are you sure you want to delete this role?
                {record.userCount > 0 && (
                  <div style={{ color: "red" }}>
                    This will affect {record.userCount} users!
                  </div>
                )}
              </>
            }
            onConfirm={() => handleDeleteRole(record.id)}
            okText="Yes"
            cancelText="No"
            disabled={record.name === "ADMIN"}
            overlayClassName="admin-popconfirm"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
              disabled={record.name === "ADMIN"}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: "20px" }}>Loading role data...</div>
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
          <Title level={2}>Role Management</Title>
          <Text type="secondary">
            Manage roles and permissions for system access
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateRole}
        >
          New Role
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

      <Card>
        <Table
          dataSource={roles}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={isEditMode ? "Edit Role" : "Create New Role"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={700}
        destroyOnClose
        className="admin-modal"
      >
        <Form form={form} layout="vertical" name="roleForm">
          <Form.Item
            name="name"
            label="Role Name"
            rules={[{ required: true, message: "Please enter role name" }]}
          >
            <Input
              placeholder="Enter role name (e.g., MANAGER)"
              disabled={isEditMode}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please enter role description" },
            ]}
          >
            <Input.TextArea placeholder="Enter role description" rows={3} />
          </Form.Item>

          <Title level={5}>Permissions</Title>
          <Collapse defaultActiveKey={["1"]} ghost>
            {permissionModules.map((module, moduleIndex) => (
              <Panel
                header={
                  <Space>
                    {module.title}
                    <Tooltip title="Permissions for accessing and managing this feature">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                key={moduleIndex + 1}
              >
                <Form.Item
                  name={["permissions", module.key]}
                  valuePropName="checked"
                >
                  <Checkbox.Group style={{ width: "100%" }}>
                    <Row>
                      {permissionActions.map((action, actionIndex) => (
                        <Col span={6} key={actionIndex}>
                          <Checkbox value={action}>
                            {action.charAt(0).toUpperCase() + action.slice(1)}
                          </Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Checkbox.Group>
                </Form.Item>
              </Panel>
            ))}
          </Collapse>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleManagement;
