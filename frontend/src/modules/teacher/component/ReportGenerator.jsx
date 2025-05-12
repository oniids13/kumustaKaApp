import React, { useState } from "react";
import axios from "axios";
import {
  Form,
  Button,
  DatePicker,
  Select,
  Checkbox,
  Card,
  Typography,
  Row,
  Col,
  Divider,
  Alert,
  message,
} from "antd";
import {
  FileTextOutlined,
  DownloadOutlined,
  LineChartOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ReportGenerator = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [reportFormat, setReportFormat] = useState("pdf");

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3000/api/analytics/generateReport",
        {
          ...values,
          startDate: values.dateRange[0].format("YYYY-MM-DD"),
          endDate: values.dateRange[1].format("YYYY-MM-DD"),
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          responseType: reportFormat === "pdf" ? "blob" : "json",
        }
      );

      if (reportFormat === "pdf" || reportFormat === "csv") {
        // Create a blob from the response data
        const blob = new Blob([response.data], {
          type: reportFormat === "pdf" ? "application/pdf" : "text/csv",
        });

        // Create a link element to trigger the download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `mental_health_report_${new Date()
            .toISOString()
            .slice(0, 10)}.${reportFormat}`
        );
        document.body.appendChild(link);
        link.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);

        message.success(
          `Report successfully downloaded as ${reportFormat.toUpperCase()}`
        );
      } else if (reportFormat === "preview") {
        setPreviewData(response.data);
        message.success("Report preview generated");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      message.error("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReportFormatChange = (value) => {
    setReportFormat(value);
    // Clear preview data when format changes
    if (value !== "preview") {
      setPreviewData(null);
    }
  };

  // Mock preview data
  const mockPreviewData = {
    title: "Mental Health Trends Report",
    period: "October 1, 2023 - November 30, 2023",
    summary: {
      totalResponses: 120,
      averageMood: "Neutral",
      topIssues: ["Academic Stress", "Social Anxiety", "Sleep Problems"],
      recommendedActions: [
        "Consider scheduling stress management workshops",
        "Provide more opportunities for social interaction in a supportive environment",
        "Share resources about sleep hygiene and its importance for mental health",
      ],
    },
    charts: [
      { title: "Mood Trends", type: "line" },
      { title: "Issue Categories", type: "pie" },
      { title: "Time of Day Reporting", type: "bar" },
    ],
  };

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Mental Health Report Generator</Title>
      <Paragraph type="secondary">
        Generate anonymized, aggregated reports on student mental health trends.
        All data is completely anonymous to protect student privacy.
      </Paragraph>

      <Row gutter={24}>
        <Col span={previewData ? 12 : 24}>
          <Card style={{ marginBottom: "20px" }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                includeCharts: true,
                includeTables: true,
                includeRecommendations: true,
                reportType: "comprehensive",
              }}
            >
              <Form.Item
                name="dateRange"
                label="Report Period"
                rules={[
                  { required: true, message: "Please select a date range" },
                ]}
              >
                <RangePicker style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="reportType"
                label="Report Type"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="comprehensive">Comprehensive Report</Option>
                  <Option value="summary">Summary Report</Option>
                  <Option value="trends">Trends Analysis</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Report Content">
                <Row>
                  <Col span={8}>
                    <Form.Item
                      name="includeCharts"
                      valuePropName="checked"
                      noStyle
                    >
                      <Checkbox>Include Charts</Checkbox>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="includeTables"
                      valuePropName="checked"
                      noStyle
                    >
                      <Checkbox>Include Tables</Checkbox>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="includeRecommendations"
                      valuePropName="checked"
                      noStyle
                    >
                      <Checkbox>Include Recommendations</Checkbox>
                    </Form.Item>
                  </Col>
                </Row>
              </Form.Item>

              <Form.Item
                name="outputFormat"
                label="Output Format"
                rules={[{ required: true }]}
                initialValue={reportFormat}
              >
                <Select onChange={handleReportFormatChange}>
                  <Option value="pdf">PDF Document</Option>
                  <Option value="csv">CSV (Data Only)</Option>
                  <Option value="preview">Preview in Browser</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={
                    reportFormat === "preview" ? (
                      <LineChartOutlined />
                    ) : (
                      <DownloadOutlined />
                    )
                  }
                >
                  {reportFormat === "preview"
                    ? "Generate Preview"
                    : `Generate ${reportFormat.toUpperCase()} Report`}
                </Button>
              </Form.Item>
            </Form>

            <Divider />

            <Alert
              message="Data Privacy Notice"
              description="Reports contain only aggregated data. No individual student responses are included or identifiable."
              type="info"
              showIcon
            />
          </Card>
        </Col>

        {(previewData || mockPreviewData) && reportFormat === "preview" && (
          <Col span={12}>
            <Card
              title={
                <span>
                  <FileTextOutlined /> Report Preview
                </span>
              }
            >
              <div className="report-preview">
                <Title level={3}>
                  {previewData?.title || mockPreviewData.title}
                </Title>
                <Text type="secondary">
                  {previewData?.period || mockPreviewData.period}
                </Text>

                <Divider />

                <Title level={4}>Summary</Title>
                <ul>
                  <li>
                    <strong>Total Responses:</strong>{" "}
                    {previewData?.summary.totalResponses ||
                      mockPreviewData.summary.totalResponses}
                  </li>
                  <li>
                    <strong>Average Mood:</strong>{" "}
                    {previewData?.summary.averageMood ||
                      mockPreviewData.summary.averageMood}
                  </li>
                </ul>

                <Title level={4}>Top Issues</Title>
                <ul>
                  {(
                    previewData?.summary.topIssues ||
                    mockPreviewData.summary.topIssues
                  ).map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>

                <Title level={4}>Recommended Actions</Title>
                <ul>
                  {(
                    previewData?.summary.recommendedActions ||
                    mockPreviewData.summary.recommendedActions
                  ).map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>

                <Divider />

                <Title level={4}>Included Charts</Title>
                <ul>
                  {(previewData?.charts || mockPreviewData.charts).map(
                    (chart, index) => (
                      <li key={index}>
                        {chart.title} ({chart.type} chart)
                      </li>
                    )
                  )}
                </ul>

                <Divider />

                <Alert
                  message="Preview Only"
                  description="This is a simplified preview. Generated reports will contain detailed charts and analysis."
                  type="warning"
                />
              </div>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default ReportGenerator;
