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
  Divider,
  Spin,
  Alert,
  Empty,
  Popconfirm,
  Descriptions,
  Badge,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const statusColors = {
  PENDING: "orange",
  IN_PROGRESS: "blue",
  COMPLETED: "green",
};

const InterventionPlans = () => {
  const [loading, setLoading] = useState(true);
  const [interventions, setInterventions] = useState([]);
  const [students, setStudents] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentIntervention, setCurrentIntervention] = useState(null);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();

  // New state variables for view modal
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewIntervention, setViewIntervention] = useState(null);

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    fetchInterventions();
    fetchStudents();
  }, []);

  const fetchInterventions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:3000/api/counselor/interventions",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data && response.data.interventions) {
        // Filter out completed interventions
        const activeInterventions = response.data.interventions.filter(
          (intervention) => intervention.status !== "COMPLETED"
        );
        setInterventions(activeInterventions);
      }
    } catch (err) {
      console.error("Error fetching interventions:", err);
      setError("Failed to load intervention plans. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/counselor/students",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data && response.data.students) {
        setStudents(response.data.students);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  const handleCreateIntervention = () => {
    setIsEditing(false);
    setCurrentIntervention(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditIntervention = (intervention) => {
    setIsEditing(true);
    setCurrentIntervention(intervention);
    form.setFieldsValue({
      studentId: intervention.studentId,
      title: intervention.title,
      description: intervention.description,
      status: intervention.status,
    });
    setIsModalVisible(true);
  };

  // New handler for viewing intervention details
  const handleViewIntervention = (intervention) => {
    setViewIntervention(intervention);
    setIsViewModalVisible(true);
  };

  const handleViewModalClose = () => {
    setIsViewModalVisible(false);
    setViewIntervention(null);
  };

  const handleDeleteIntervention = async (interventionId) => {
    try {
      await axios.delete(
        `http://localhost:3000/api/counselor/interventions/${interventionId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      message.success("Intervention plan deleted successfully");
      fetchInterventions();
    } catch (err) {
      console.error("Error deleting intervention:", err);
      message.error("Failed to delete intervention plan");
    }
  };

  const handleModalOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          if (isEditing && currentIntervention) {
            // Update existing intervention
            await axios.put(
              `http://localhost:3000/api/counselor/interventions/${currentIntervention.id}`,
              values,
              {
                headers: {
                  Authorization: `Bearer ${user.token}`,
                  "Content-Type": "application/json",
                },
              }
            );
            message.success("Intervention plan updated successfully");
          } else {
            // Create new intervention
            await axios.post(
              "http://localhost:3000/api/counselor/interventions",
              values,
              {
                headers: {
                  Authorization: `Bearer ${user.token}`,
                  "Content-Type": "application/json",
                },
              }
            );
            message.success("Intervention plan created successfully");
          }

          // Refresh data and close modal
          setIsModalVisible(false);
          form.resetFields();
          fetchInterventions();
        } catch (err) {
          console.error("Error saving intervention:", err);
          message.error(
            err.response?.data?.message ||
              "Failed to save intervention plan. Please try again."
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

  const getStudentName = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student
      ? `${student.firstName} ${student.lastName}`
      : "Unknown Student";
  };

  // Function to render status badge
  const renderStatusBadge = (status) => {
    let badgeStatus;

    switch (status) {
      case "PENDING":
        badgeStatus = "warning";
        break;
      case "IN_PROGRESS":
        badgeStatus = "processing";
        break;
      case "COMPLETED":
        badgeStatus = "success";
        break;
      default:
        badgeStatus = "default";
    }

    return <Badge status={badgeStatus} text={status} />;
  };

  const columns = [
    {
      title: "Student",
      dataIndex: "studentId",
      key: "student",
      render: (studentId) => getStudentName(studentId),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={statusColors[status] || "default"}>{status}</Tag>
      ),
      filters: [
        { text: "Pending", value: "PENDING" },
        { text: "In Progress", value: "IN_PROGRESS" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => moment(date).format("MMM DD, YYYY"),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "Last Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date) => moment(date).format("MMM DD, YYYY"),
      sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewIntervention(record)}
          />
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditIntervention(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this intervention plan?"
            onConfirm={() => handleDeleteIntervention(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading && interventions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: "20px" }}>Loading intervention plans...</div>
      </div>
    );
  }

  if (error) {
    return <Alert message={error} type="error" />;
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
          <Title level={2}>Active Intervention Plans</Title>
          <Text type="secondary">
            Manage ongoing and pending intervention plans for students
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateIntervention}
        >
          New Intervention Plan
        </Button>
      </div>

      {interventions.length > 0 ? (
        <Card>
          <Table
            dataSource={interventions}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ) : (
        <Empty description="No intervention plans found" />
      )}

      {/* Edit/Create Modal */}
      <Modal
        title={
          isEditing ? "Edit Intervention Plan" : "Create New Intervention Plan"
        }
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          name="interventionForm"
          initialValues={{ status: "PENDING" }}
        >
          <Form.Item
            name="studentId"
            label="Student"
            rules={[{ required: true, message: "Please select a student" }]}
          >
            <Select
              placeholder="Select a student"
              showSearch
              optionFilterProp="children"
              disabled={isEditing}
            >
              {students.map((student) => (
                <Option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Title"
            rules={[
              { required: true, message: "Please enter an intervention title" },
            ]}
          >
            <Input placeholder="Brief title for the intervention plan" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              {
                required: true,
                message: "Please enter a description of the intervention",
              },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Detailed description of the intervention plan, including goals and actions"
            />
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Select>
              <Option value="PENDING">Pending</Option>
              <Option value="IN_PROGRESS">In Progress</Option>
              <Option value="COMPLETED">Completed</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="Intervention Plan Details"
        visible={isViewModalVisible}
        onCancel={handleViewModalClose}
        footer={[
          <Button key="close" onClick={handleViewModalClose}>
            Close
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              handleViewModalClose();
              handleEditIntervention(viewIntervention);
            }}
          >
            Edit This Plan
          </Button>,
        ]}
        width={700}
      >
        {viewIntervention && (
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="Student">
              {getStudentName(viewIntervention.studentId)}
            </Descriptions.Item>
            <Descriptions.Item label="Title">
              {viewIntervention.title}
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              <div style={{ whiteSpace: "pre-wrap" }}>
                {viewIntervention.description}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {renderStatusBadge(viewIntervention.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {moment(viewIntervention.createdAt).format(
                "MMMM D, YYYY, h:mm a"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {moment(viewIntervention.updatedAt).format(
                "MMMM D, YYYY, h:mm a"
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default InterventionPlans;
