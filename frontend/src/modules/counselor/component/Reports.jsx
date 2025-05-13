import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Select,
  DatePicker,
  Radio,
  Checkbox,
  Form,
  Divider,
  Spin,
  message,
  Alert,
  List,
  Skeleton,
  Empty,
  Space,
  Result,
} from "antd";
import {
  DownloadOutlined,
  FileTextOutlined,
  BarChartOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

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
      // Format dates for API request
      const formattedValues = {
        ...values,
        startDate: values.dateRange[0].format("YYYY-MM-DD"),
        endDate: values.dateRange[1].format("YYYY-MM-DD"),
      };
      delete formattedValues.dateRange;

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
        type: values.outputFormat === "pdf" ? "application/pdf" : "text/csv",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `mental_health_report_${moment().format("YYYY-MM-DD")}.${
          values.outputFormat
        }`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success("Report generated and downloaded successfully");
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
        `mental_health_report_${report?.createdAt || "download"}.${format}`
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

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Mental Health Reports</Title>
      <Text type="secondary">
        Generate comprehensive reports on student mental health data
      </Text>

      {error && (
        <Alert message={error} type="error" style={{ marginTop: "16px" }} />
      )}

      <Card style={{ marginTop: "20px" }}>
        <Title level={4}>Generate New Report</Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerateReport}
          initialValues={{
            reportType: "comprehensive",
            outputFormat: "pdf",
            includeCharts: true,
            includeTables: true,
            includeRecommendations: true,
            dateRange: [moment().subtract(30, "days"), moment()],
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
            name="dateRange"
            label="Date Range"
            rules={[{ required: true, message: "Please select a date range" }]}
          >
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="reportType" label="Report Type">
            <Radio.Group>
              <Radio value="comprehensive">Comprehensive</Radio>
              <Radio value="summary">Summary</Radio>
              <Radio value="trend">Trend Analysis</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="outputFormat" label="Output Format">
            <Radio.Group>
              <Radio.Button value="pdf">
                <FilePdfOutlined /> PDF
              </Radio.Button>
              <Radio.Button value="csv">
                <FileExcelOutlined /> CSV
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="Include in Report">
            <Space direction="horizontal">
              <Form.Item name="includeCharts" valuePropName="checked" noStyle>
                <Checkbox>Charts</Checkbox>
              </Form.Item>
              <Form.Item name="includeTables" valuePropName="checked" noStyle>
                <Checkbox>Data Tables</Checkbox>
              </Form.Item>
              <Form.Item
                name="includeRecommendations"
                valuePropName="checked"
                noStyle
              >
                <Checkbox>Recommendations</Checkbox>
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<DownloadOutlined />}
              loading={generating}
            >
              Generate Report
            </Button>
          </Form.Item>
        </Form>
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
                  item.format === "pdf" ? (
                    <FilePdfOutlined
                      style={{ fontSize: "24px", color: "#ff4d4f" }}
                    />
                  ) : (
                    <FileExcelOutlined
                      style={{ fontSize: "24px", color: "#52c41a" }}
                    />
                  )
                }
                title={`${
                  item.reportType.charAt(0).toUpperCase() +
                  item.reportType.slice(1)
                } Report`}
                description={`Generated on ${moment(item.createdAt).format(
                  "MMMM D, YYYY"
                )} - ${
                  item.studentId === "all"
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

  function getStudentName(studentId) {
    const student = students.find((s) => s.id === studentId);
    return student
      ? `${student.firstName} ${student.lastName}`
      : "Unknown Student";
  }
};

export default Reports;
