import React, { useState, useEffect } from "react";
import { Table, Card, Typography, Tag, Space, Empty, Spin, Alert } from "antd";
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
          />
        </Card>
      ) : (
        <Empty
          description="No intervention history yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </div>
  );
};

export default InterventionHistory;
