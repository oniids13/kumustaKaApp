import React, { useState, useEffect } from "react";
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
  Tabs,
  Spin,
  Empty,
  Space,
  Statistic,
  Tag,
  Progress,
  Table,
} from "antd";
import {
  DownloadOutlined,
  FilePdfOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  HeartOutlined,
  RiseOutlined,
  FallOutlined,
  ManOutlined,
  WomanOutlined,
  BulbOutlined,
  AlertOutlined,
} from "@ant-design/icons";
import moment from "moment";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const { Title, Text, Paragraph } = Typography;

const ZONE_COLORS = { green: "#52c41a", yellow: "#faad14", red: "#ff4d4f" };
const GENDER_COLORS = ["#1890ff", "#ff69b4", "#722ed1", "#8c8c8c"];

const ReportGenerator = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsPeriod, setAnalyticsPeriod] = useState("3months");
  const [activeTab, setActiveTab] = useState("analytics");

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    fetchAnalytics();
  }, [analyticsPeriod]);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:3000/api/teacher/analytics/dashboard",
        {
          headers: { Authorization: `Bearer ${user.token}` },
          params: { period: analyticsPeriod },
        }
      );
      setAnalyticsData(response.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setAnalyticsData(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case "critical":
        return <AlertOutlined style={{ color: "#ff4d4f" }} />;
      case "warning":
        return <WarningOutlined style={{ color: "#faad14" }} />;
      case "positive":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "analysis":
        return <BulbOutlined style={{ color: "#1890ff" }} />;
      default:
        return <InfoCircleOutlined style={{ color: "#8c8c8c" }} />;
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case "critical":
        return "#fff1f0";
      case "warning":
        return "#fffbe6";
      case "positive":
        return "#f6ffed";
      case "analysis":
        return "#e6f7ff";
      default:
        return "#fafafa";
    }
  };

  const getInsightBorderColor = (type) => {
    switch (type) {
      case "critical":
        return "#ffa39e";
      case "warning":
        return "#ffe58f";
      case "positive":
        return "#b7eb8f";
      case "analysis":
        return "#91d5ff";
      default:
        return "#d9d9d9";
    }
  };

  const renderAnalyticsDashboard = () => {
    if (analyticsLoading) {
      return (
        <div style={{ textAlign: "center", padding: "60px" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading analytics...</div>
        </div>
      );
    }

    if (!analyticsData) {
      return (
        <Empty
          description={
            analyticsData === null
              ? "Failed to load analytics. You may not be assigned to a class yet."
              : "No analytics data available for your class."
          }
        />
      );
    }

    const {
      genderAnalytics,
      sectionAnalytics,
      monthlyTrends,
      quarterlyTrends,
      riskIndicators,
      overallStats,
      prescriptiveInsights,
      sectionName,
    } = analyticsData;

    return (
      <div>
        <div
          style={{
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Text strong>Analysis Period:</Text>
          <Radio.Group
            value={analyticsPeriod}
            onChange={(e) => setAnalyticsPeriod(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="1month">1 Month</Radio.Button>
            <Radio.Button value="3months">3 Months</Radio.Button>
            <Radio.Button value="6months">6 Months</Radio.Button>
            <Radio.Button value="12months">12 Months</Radio.Button>
          </Radio.Group>
          {sectionName && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              Class: {sectionName}
            </Tag>
          )}
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Students"
                value={overallStats?.totalStudents ?? 0}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Avg Mood"
                value={overallStats?.overallAvgMood ?? "N/A"}
                suffix={overallStats?.overallAvgMood ? "/ 5" : ""}
                prefix={<HeartOutlined />}
                valueStyle={{
                  color:
                    overallStats?.overallAvgMood >= 3.5
                      ? "#52c41a"
                      : overallStats?.overallAvgMood >= 2.5
                        ? "#faad14"
                        : "#ff4d4f",
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Avg Survey Score"
                value={overallStats?.overallAvgScore ?? "N/A"}
                suffix={overallStats?.overallAvgScore ? "%" : ""}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Participation"
                value={overallStats?.overallParticipation ?? 0}
                suffix="%"
                valueStyle={{
                  color:
                    overallStats?.overallParticipation >= 70 ? "#52c41a" : "#faad14",
                }}
              />
            </Card>
          </Col>
        </Row>

        <Card
          title={
            <span>
              <AlertOutlined style={{ color: "#ff4d4f", marginRight: 8 }} />
              Risk Assessment Overview
            </span>
          }
          style={{ marginBottom: 24 }}
          size="small"
        >
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: "center" }}>
                <Progress
                  type="circle"
                  percent={
                    overallStats?.totalStudents > 0
                      ? Math.round(
                          (riskIndicators?.highRisk / overallStats.totalStudents) *
                            100
                        )
                      : 0
                  }
                  size={80}
                  strokeColor="#ff4d4f"
                  format={() => riskIndicators?.highRisk ?? 0}
                />
                <div style={{ marginTop: 8 }}>
                  <Tag color="red">High Risk</Tag>
                </div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: "center" }}>
                <Progress
                  type="circle"
                  percent={
                    overallStats?.totalStudents > 0
                      ? Math.round(
                          (riskIndicators?.moderateRisk /
                            overallStats.totalStudents) *
                            100
                        )
                      : 0
                  }
                  size={80}
                  strokeColor="#faad14"
                  format={() => riskIndicators?.moderateRisk ?? 0}
                />
                <div style={{ marginTop: 8 }}>
                  <Tag color="orange">Moderate Risk</Tag>
                </div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: "center" }}>
                <Progress
                  type="circle"
                  percent={
                    overallStats?.totalStudents > 0
                      ? Math.round(
                          (riskIndicators?.lowRisk /
                            overallStats.totalStudents) *
                            100
                        )
                      : 0
                  }
                  size={80}
                  strokeColor="#52c41a"
                  format={() => riskIndicators?.lowRisk ?? 0}
                />
                <div style={{ marginTop: 8 }}>
                  <Tag color="green">Low Risk</Tag>
                </div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: "center" }}>
                <Statistic
                  title="Declining Mood"
                  value={riskIndicators?.decliningMoodCount ?? 0}
                  prefix={<FallOutlined />}
                  valueStyle={{
                    color:
                      (riskIndicators?.decliningMoodCount ?? 0) > 0
                        ? "#ff4d4f"
                        : "#52c41a",
                  }}
                />
                <Statistic
                  title="Low Participation"
                  value={riskIndicators?.lowParticipationCount ?? 0}
                  valueStyle={{
                    fontSize: 16,
                    color:
                      (riskIndicators?.lowParticipationCount ?? 0) > 0
                        ? "#faad14"
                        : "#52c41a",
                  }}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>
          </Row>
        </Card>

        {genderAnalytics?.length > 0 && (
          <Card
            title={
              <span>
                <ManOutlined style={{ color: "#1890ff", marginRight: 4 }} />
                <WomanOutlined style={{ color: "#ff69b4", marginRight: 8 }} />
                Gender-Based Mental Health Comparison
              </span>
            }
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Row gutter={16}>
              <Col xs={24} lg={12}>
                <Title level={5} style={{ textAlign: "center" }}>
                  Zone Distribution by Gender
                </Title>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={genderAnalytics}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="gender" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="zones.green"
                      name="Green (Positive)"
                      fill={ZONE_COLORS.green}
                      stackId="zones"
                    />
                    <Bar
                      dataKey="zones.yellow"
                      name="Yellow (Moderate)"
                      fill={ZONE_COLORS.yellow}
                      stackId="zones"
                    />
                    <Bar
                      dataKey="zones.red"
                      name="Red (Needs Attention)"
                      fill={ZONE_COLORS.red}
                      stackId="zones"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Col>
              <Col xs={24} lg={12}>
                <Title level={5} style={{ textAlign: "center" }}>
                  Average Mood by Gender
                </Title>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={genderAnalytics.filter((g) => g.avgMood)}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="gender" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgMood" name="Avg Mood (1-5)" fill="#1890ff">
                      {genderAnalytics
                        .filter((g) => g.avgMood)
                        .map((entry, idx) => (
                          <Cell
                            key={idx}
                            fill={
                              GENDER_COLORS[idx % GENDER_COLORS.length]
                            }
                          />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Col>
            </Row>
          </Card>
        )}

        {monthlyTrends?.length > 0 && (
          <Card
            title={
              <span>
                <RiseOutlined style={{ color: "#1890ff", marginRight: 8 }} />
                Monthly Trends
              </span>
            }
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Row gutter={16}>
              <Col xs={24} lg={12}>
                <Title level={5} style={{ textAlign: "center" }}>
                  Zone Distribution Over Time
                </Title>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={monthlyTrends}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthLabel" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="green"
                      name="Green"
                      fill={ZONE_COLORS.green}
                      stackId="stack"
                    />
                    <Bar
                      dataKey="yellow"
                      name="Yellow"
                      fill={ZONE_COLORS.yellow}
                      stackId="stack"
                    />
                    <Bar
                      dataKey="red"
                      name="Red"
                      fill={ZONE_COLORS.red}
                      stackId="stack"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Col>
              <Col xs={24} lg={12}>
                <Title level={5} style={{ textAlign: "center" }}>
                  Average Mood & Red Zone % Trend
                </Title>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={monthlyTrends}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthLabel" />
                    <YAxis yAxisId="left" domain={[0, 5]} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 100]}
                      unit="%"
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="avgMood"
                      name="Avg Mood"
                      stroke="#1890ff"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="redPercentage"
                      name="Red Zone %"
                      stroke="#ff4d4f"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Col>
            </Row>
          </Card>
        )}

        {prescriptiveInsights?.length > 0 && (
          <Card
            title={
              <span>
                <BulbOutlined
                  style={{ color: "#fa8c16", marginRight: 8 }}
                />
                Prescriptive Insights & Recommendations
              </span>
            }
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
              {prescriptiveInsights.map((insight, idx) => (
                <Card
                  key={idx}
                  size="small"
                  style={{
                    backgroundColor: getInsightColor(insight.type),
                    borderColor: getInsightBorderColor(insight.type),
                    borderLeft: `4px solid ${getInsightBorderColor(insight.type)}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ fontSize: 20, marginTop: 2 }}>
                      {getInsightIcon(insight.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: 15 }}>
                        {insight.title}
                      </Text>
                      <Tag
                        color={
                          insight.severity === "high"
                            ? "red"
                            : insight.severity === "medium"
                              ? "orange"
                              : "green"
                        }
                        style={{ marginLeft: 8 }}
                      >
                        {insight.severity?.toUpperCase() || "INFO"}
                      </Tag>
                      <Paragraph style={{ margin: "8px 0 4px" }}>
                        {insight.description}
                      </Paragraph>
                      <div
                        style={{
                          backgroundColor: "rgba(255,255,255,0.6)",
                          padding: "8px 12px",
                          borderRadius: 6,
                          marginTop: 4,
                        }}
                      >
                        <Text strong style={{ color: "#595959" }}>
                          Recommendation:{" "}
                        </Text>
                        <Text>{insight.recommendation}</Text>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </Space>
          </Card>
        )}

        {(!prescriptiveInsights || prescriptiveInsights.length === 0) &&
          overallStats?.totalStudents === 0 && (
            <Alert
              message="No Class Assigned"
              description="You are not currently assigned to a class/section. Analytics and reports will be available once you are assigned. Contact your administrator."
              type="info"
              showIcon
            />
          )}
      </div>
    );
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
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
          includeTables: true,
          includeRecommendations: true,
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

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `mental_health_report_${moment().format("YYYY-MM-DD")}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      message.success(
        "Report downloaded successfully. Includes descriptive analysis, prescriptive insights, and recommendations based on your class data."
      );
    } catch (error) {
      console.error("Error generating report:", error);
      message.error("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderGenerateReport = () => (
    <div>
      <Card>
        <Title level={4}>Generate Class Report</Title>
        <Paragraph type="secondary">
          Generate a PDF report with descriptive analysis, prescriptive
          insights, and recommendations based on real student data from your
          class.
        </Paragraph>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ timePeriod: "3months" }}
        >
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
              loading={loading}
              icon={<DownloadOutlined />}
              size="large"
            >
              Generate PDF Report
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <Alert
          message="Report Contents"
          description="The report includes: (1) Summary statistics for your class, (2) Descriptive analysis of risk indicators and overall trends, (3) Prescriptive insights and evidence-based recommendations, (4) Zone trend tables and time-of-day patterns. All data is specific to students in your assigned class."
          type="info"
          showIcon
        />

        <Divider />

        <Alert
          message="Data Privacy"
          description="Reports contain aggregated class-level data. Individual student names may appear in prescriptive insights only when referral to the guidance counselor is recommended, and only for the purpose of supporting student welfare."
          type="info"
          showIcon
        />
      </Card>
    </div>
  );

  const tabItems = [
    {
      key: "analytics",
      label: (
        <span>
          <BarChartOutlined />
          Analytics Dashboard
        </span>
      ),
      children: renderAnalyticsDashboard(),
    },
    {
      key: "generate",
      label: (
        <span>
          <FilePdfOutlined />
          Generate Report
        </span>
      ),
      children: renderGenerateReport(),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Reports & Analytics</Title>
      <Paragraph type="secondary">
        Comprehensive mental health analytics for your class with descriptive and
        prescriptive analysis. Generate downloadable PDF reports with
        evidence-based recommendations.
      </Paragraph>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />
    </div>
  );
};

export default ReportGenerator;
