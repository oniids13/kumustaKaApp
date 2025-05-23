import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Typography,
  Spin,
  Alert,
  message,
} from "antd";
import axios from "axios";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CreateIntervention = () => {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
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
      message.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: "20px" }}>Loading...</div>
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
    <div style={{ padding: "20px" }}>
      <Title level={2}>Create Intervention Plan</Title>
      {student && (
        <Text
          type="secondary"
          style={{ display: "block", marginBottom: "20px" }}
        >
          Creating intervention plan for {student.firstName} {student.lastName}
        </Text>
      )}

      <Card>
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
            label="Title"
            rules={[{ required: true, message: "Please enter a title" }]}
          >
            <Input placeholder="Enter intervention plan title" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter a description" }]}
          >
            <TextArea
              rows={4}
              placeholder="Enter detailed description of the intervention plan"
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select>
              <Option value="PENDING">Pending</Option>
              <Option value="IN_PROGRESS">In Progress</Option>
              <Option value="COMPLETED">Completed</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Create Intervention Plan
            </Button>
            <Button
              style={{ marginLeft: "10px" }}
              onClick={() => navigate("/counselor")}
            >
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateIntervention;
