import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Typography,
  Spin,
  Alert,
  message,
  Avatar,
  Space,
} from "antd";
import { UserOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CreateIntervention = () => {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
    } else {
      setLoading(false);
    }
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/counselor/student/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data && response.data.student) {
        setStudent(response.data.student);
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      // Don't show error message since intervention creation still works
      // Instead, we'll just show a generic student info
      setStudent({
        firstName: "Selected",
        lastName: "Student",
        email: "",
        avatar: "",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      const response = await axios.post(
        "http://localhost:3000/api/counselor/interventions",
        {
          studentId,
          title: values.title,
          description: values.description,
          status: values.status,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data) {
        message.success("Intervention plan created successfully");
        navigate("/counselor");
      }
    } catch (error) {
      console.error("Error creating intervention:", error);
      message.error(
        error.response?.data?.error || "Failed to create intervention plan"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: "20px" }}>Loading student information...</div>
      </div>
    );
  }

  if (!studentId) {
    return (
      <Alert
        message="Error"
        description="No student selected for intervention plan"
        type="error"
        showIcon
      />
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header with student info */}
      <Card style={{ marginBottom: "20px", background: "#f0f2f5" }}>
        <Space align="center" style={{ marginBottom: "10px" }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/counselor")}
            type="text"
          >
            Back to Dashboard
          </Button>
        </Space>

        <Space align="center" size="large">
          <Avatar
            size={64}
            src={student?.avatar}
            icon={<UserOutlined />}
            style={{ backgroundColor: "#1890ff" }}
          />
          <div>
            <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
              Create Intervention Plan
            </Title>
            {student && (
              <Text style={{ fontSize: "16px", color: "#666" }}>
                for {student.firstName} {student.lastName}
                {student.email && (
                  <div style={{ fontSize: "14px" }}>{student.email}</div>
                )}
              </Text>
            )}
          </div>
        </Space>
      </Card>

      {/* Intervention Form */}
      <Card title="Intervention Plan Details">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: "PENDING",
          }}
        >
          <Form.Item
            name="title"
            label="Intervention Title"
            rules={[{ required: true, message: "Please enter a title" }]}
          >
            <Input
              placeholder="Enter a descriptive title for this intervention plan"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Intervention Description"
            rules={[{ required: true, message: "Please enter a description" }]}
          >
            <TextArea
              rows={6}
              placeholder="Describe the intervention plan in detail. Include objectives, methods, timeline, and expected outcomes."
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Initial Status"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select size="large">
              <Option value="PENDING">Pending - Not yet started</Option>
              <Option value="IN_PROGRESS">
                In Progress - Currently active
              </Option>
              <Option value="COMPLETED">Completed - Finished</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginTop: "30px" }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
              >
                Create Intervention Plan
              </Button>
              <Button size="large" onClick={() => navigate("/counselor")}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateIntervention;
