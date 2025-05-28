import React, { useState } from "react";
import axios from "axios";
import {
  Form,
  Button,
  Card,
  Typography,
  Row,
  Col,
  Divider,
  Alert,
  message,
  Radio,
} from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import moment from "moment";

const { Title, Paragraph } = Typography;

const ReportGenerator = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Calculate date range based on period selection
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

      const response = await axios.post(
        "http://localhost:3000/api/teacher/reports",
        {
          reportType: "trends",
          includeCharts: true,
          includeTables: false,
          includeRecommendations: false,
          outputFormat: "pdf",
          startDate,
          endDate,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          responseType: "blob",
        }
      );

      // Create a blob from the response data
      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      // Create a link element to trigger the download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `mental_health_trends_report_${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`
      );
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      message.success(
        "Mental health trends report successfully downloaded as PDF"
      );
    } catch (error) {
      console.error("Error generating report:", error);
      message.error("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Mental Health Trends Report Generator</Title>
      <Paragraph type="secondary">
        Generate PDF reports with mental health trend charts organized by month.
        All data is completely anonymous to protect student privacy.
      </Paragraph>

      <Row gutter={24}>
        <Col span={24}>
          <Card style={{ marginBottom: "20px" }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                timePeriod: "1month",
              }}
            >
              <Form.Item
                name="timePeriod"
                label="Report Period"
                rules={[
                  { required: true, message: "Please select a time period" },
                ]}
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
                  loading={loading}
                  icon={<DownloadOutlined />}
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
        </Col>
      </Row>
    </div>
  );
};

export default ReportGenerator;
