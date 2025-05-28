import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Form,
  Divider,
  Spin,
  message,
  Alert,
  List,
  Skeleton,
  Empty,
  Space,
  Radio,
  Select,
} from "antd";
import { DownloadOutlined, FilePdfOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [students, setStudents] = useState([]);
  const [reportHistory, setReportHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    fetchStudents();
    fetchReportHistory();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
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
      setError("Failed to load students. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchReportHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:3000/api/counselor/reports/history",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data && response.data.reports) {
        setReportHistory(response.data.reports);
      }
    } catch (err) {
      console.error("Error fetching report history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleGenerateReport = async (values) => {
    setGenerating(true);
    try {
      // Calculate date range based on period
      const endDate = moment().format("YYYY-MM-DD");
      let startDate;

      switch (values.timePeriod) {
        case "1month":
          startDate = moment().subtract(1, "month").format("YYYY-MM-DD");
          break;
        case "3months":
          startDate = moment().subtract(3, "months").format("YYYY-MM-DD");
          break;
        case "6months":
          startDate = moment().subtract(6, "months").format("YYYY-MM-DD");
          break;
        case "12months":
          startDate = moment().subtract(12, "months").format("YYYY-MM-DD");
          break;
        default:
          startDate = moment().subtract(1, "month").format("YYYY-MM-DD");
      }

      const formattedValues = {
        studentId: values.studentId,
        reportType: "trends",
        outputFormat: "pdf",
        includeCharts: true,
        includeTables: false,
        includeRecommendations: true,
        startDate,
        endDate,
      };

      const response = await axios.post(
        "http://localhost:3000/api/counselor/reports/generate",
        formattedValues,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
          responseType: "blob", // Important for handling file downloads
        }
      );

      // Create a blob and download the file
      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `mental_health_trends_report_${moment().format("YYYY-MM-DD")}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success(
        "Mental health trends report successfully downloaded as PDF"
      );
      fetchReportHistory(); // Refresh report history
    } catch (err) {
      console.error("Error generating report:", err);
      message.error("Failed to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (reportId) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/counselor/reports/${reportId}/download`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          responseType: "blob",
        }
      );

      // Find the report to get its format
      const report = reportHistory.find((r) => r.id === reportId);
      const format = report?.format || "pdf";

      // Create a blob and download the file
      const blob = new Blob([response.data], {
        type: format === "pdf" ? "application/pdf" : "text/csv",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `mental_health_trends_report_${
          report?.createdAt || "download"
        }.${format}`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success("Report downloaded successfully");
    } catch (err) {
      console.error("Error downloading report:", err);
      message.error("Failed to download report. Please try again.");
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student
      ? `${student.firstName} ${student.lastName}`
      : "Unknown Student";
  };

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Mental Health Trends Report Generator</Title>
      <Paragraph type="secondary">
        Generate PDF reports with mental health trend charts organized by month.
        All data is aggregated and anonymized to protect student privacy.
      </Paragraph>

      {error && (
        <Alert message={error} type="error" style={{ marginTop: "16px" }} />
      )}

      <Card style={{ marginTop: "20px" }}>
        <Title level={4}>Generate New Trends Report</Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerateReport}
          initialValues={{
            studentId: "all",
            timePeriod: "1month",
          }}
        >
          <Form.Item
            name="studentId"
            label="Student"
            rules={[{ required: true, message: "Please select a student" }]}
          >
            <Select
              placeholder="Select a student or all students"
              loading={loading}
              allowClear
            >
              <Option value="all">All Students</Option>
              {students.map((student) => (
                <Option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="timePeriod"
            label="Report Period"
            rules={[{ required: true, message: "Please select a time period" }]}
          >
            <Radio.Group>
              <Radio.Button value="1month">Last Month</Radio.Button>
              <Radio.Button value="3months">Last 3 Months</Radio.Button>
              <Radio.Button value="6months">Last 6 Months</Radio.Button>
              <Radio.Button value="12months">Last 12 Months</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<DownloadOutlined />}
              loading={generating}
              size="large"
            >
              Generate PDF Trends Report
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <Alert
          message="Report Information"
          description="This report will contain monthly trend charts showing mental health patterns over the selected time period. All data is aggregated and anonymized."
          type="info"
          showIcon
        />

        <Divider />

        <Alert
          message="Data Privacy Notice"
          description="Reports contain only aggregated data. No individual student responses are included or identifiable."
          type="info"
          showIcon
        />
      </Card>

      <Divider orientation="left">Report History</Divider>

      {historyLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : reportHistory.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={reportHistory}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="download"
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => downloadReport(item.id)}
                >
                  Download
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <FilePdfOutlined
                    style={{ fontSize: "24px", color: "#ff4d4f" }}
                  />
                }
                title={`Mental Health Trends Report`}
                description={`Generated on ${moment(item.createdAt).format(
                  "MMMM D, YYYY"
                )} - ${
                  item.studentId === null || item.studentId === "all"
                    ? "All Students"
                    : getStudentName(item.studentId)
                }`}
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="No report history found" />
      )}
    </div>
  );
};

export default Reports;
