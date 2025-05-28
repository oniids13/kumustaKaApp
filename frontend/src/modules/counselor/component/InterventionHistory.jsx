import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Typography,
  Tag,
  Space,
  Empty,
  Spin,
  Alert,
  Button,
  Modal,
  Descriptions,
  Avatar,
} from "antd";
import { EyeOutlined, UserOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";

const { Title, Text } = Typography;

const statusColors = {
  PENDING: "orange",
  IN_PROGRESS: "blue",
  COMPLETED: "green",
};

const InterventionHistory = () => {
  const [loading, setLoading] = useState(true);
  const [interventions, setInterventions] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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
        // Filter for completed interventions only
        const completedInterventions = response.data.interventions.filter(
          (intervention) => intervention.status === "COMPLETED"
        );
        setInterventions(completedInterventions);
      }
    } catch (err) {
      console.error("Error fetching interventions:", err);
      setError("Failed to load intervention history. Please try again later.");
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

  const getStudentName = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student
      ? `${student.firstName} ${student.lastName}`
      : "Unknown Student";
  };

  const getStudent = (studentId) => {
    return students.find((s) => s.id === studentId);
  };

  const handleViewIntervention = (intervention) => {
    setSelectedIntervention(intervention);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedIntervention(null);
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
      render: (text) => (
        <div style={{ maxWidth: 200 }}>
          {text.length > 50 ? `${text.substring(0, 50)}...` : text}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={statusColors[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => moment(date).format("MMM DD, YYYY"),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "Completed",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date) => moment(date).format("MMM DD, YYYY"),
      sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewIntervention(record)}
        >
          View
        </Button>
      ),
    },
  ];

  if (loading && interventions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: "20px" }}>Loading intervention history...</div>
      </div>
    );
  }

  if (error) {
    return <Alert message={error} type="error" />;
  }

  const student = selectedIntervention
    ? getStudent(selectedIntervention.studentId)
    : null;

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Title level={2}>Intervention History</Title>
        <Text type="secondary">
          View history of completed student intervention plans
        </Text>
      </div>

      {interventions.length > 0 ? (
        <Card>
          <Table
            dataSource={interventions}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800 }}
          />
        </Card>
      ) : (
        <Empty
          description="No intervention history yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}

      {/* Detailed View Modal */}
      <Modal
        title="Intervention Plan Details"
        open={modalVisible}
        onCancel={handleCloseModal}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {selectedIntervention && (
          <div>
            {/* Student Information Header */}
            <Card style={{ marginBottom: 16, background: "#f0f2f5" }}>
              <Space align="center" size="large">
                <Avatar
                  size={48}
                  src={student?.avatar}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: "#1890ff" }}
                />
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {student
                      ? `${student.firstName} ${student.lastName}`
                      : "Unknown Student"}
                  </Title>
                  {student?.email && (
                    <Text type="secondary">{student.email}</Text>
                  )}
                </div>
              </Space>
            </Card>

            {/* Intervention Details */}
            <Descriptions
              title="Intervention Information"
              bordered
              column={1}
              size="middle"
            >
              <Descriptions.Item label="Title">
                {selectedIntervention.title}
              </Descriptions.Item>

              <Descriptions.Item label="Status">
                <Tag
                  color={statusColors[selectedIntervention.status] || "default"}
                >
                  {selectedIntervention.status}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Description">
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {selectedIntervention.description}
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Created Date">
                {moment(selectedIntervention.createdAt).format(
                  "MMMM DD, YYYY [at] h:mm A"
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Last Updated">
                {moment(selectedIntervention.updatedAt).format(
                  "MMMM DD, YYYY [at] h:mm A"
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Duration">
                {moment(selectedIntervention.updatedAt).diff(
                  moment(selectedIntervention.createdAt),
                  "days"
                )}{" "}
                days
              </Descriptions.Item>
            </Descriptions>

            {/* Additional Information */}
            <Card
              title="Intervention Summary"
              style={{ marginTop: 16 }}
              size="small"
            >
              <Text type="secondary">
                This intervention plan was created on{" "}
                {moment(selectedIntervention.createdAt).format("MMMM DD, YYYY")}{" "}
                and completed on{" "}
                {moment(selectedIntervention.updatedAt).format("MMMM DD, YYYY")}
                . Total duration:{" "}
                {moment(selectedIntervention.updatedAt).diff(
                  moment(selectedIntervention.createdAt),
                  "days"
                )}{" "}
                days.
              </Text>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InterventionHistory;
