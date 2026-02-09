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
  Tabs,
  Row,
  Col,
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
import axios from "axios";
import moment from "moment";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const ZONE_COLORS = { green: "#52c41a", yellow: "#faad14", red: "#ff4d4f" };
const GENDER_COLORS = ["#1890ff", "#ff69b4", "#722ed1", "#8c8c8c"];

const Reports = ({ sectionId: parentSectionId }) => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [students, setStudents] = useState([]);
  const [reportHistory, setReportHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsPeriod, setAnalyticsPeriod] = useState("3months");
  const [activeTab, setActiveTab] = useState("analytics");

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    fetchStudents();
    fetchReportHistory();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [analyticsPeriod, parentSectionId]);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const params = { period: analyticsPeriod };
      if (parentSectionId) params.sectionId = parentSectionId;

      const response = await axios.get(
        "http://localhost:3000/api/counselor/analytics/dashboard",
        {
          headers: { Authorization: `Bearer ${user.token}` },
          params,
        }
      );
      setAnalyticsData(response.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:3000/api/counselor/students",
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (response.data?.students) setStudents(response.data.students);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to load students.");
    } finally {
      setLoading(false);
    }
  };

  const fetchReportHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:3000/api/counselor/reports/history",
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (response.data?.reports) setReportHistory(response.data.reports);
    } catch (err) {
      console.error("Error fetching report history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleGenerateReport = async (values) => {
    setGenerating(true);
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
        "http://localhost:3000/api/counselor/reports/generate",
        {
          studentId: values.studentId,
          reportType: "trends",
          outputFormat: "pdf",
          includeCharts: true,
          includeTables: false,
          includeRecommendations: true,
          startDate,
          endDate,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `mental_health_report_${moment().format("YYYY-MM-DD")}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success("Report downloaded successfully");
      fetchReportHistory();
    } catch (err) {
      console.error("Error generating report:", err);
      message.error("Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (reportId) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/counselor/reports/${reportId}/download`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
          responseType: "blob",
        }
      );
      const report = reportHistory.find((r) => r.id === reportId);
      const format = report?.format || "pdf";
      const blob = new Blob([response.data], {
        type: format === "pdf" ? "application/pdf" : "text/csv",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report_${report?.createdAt || "download"}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success("Report downloaded");
    } catch (err) {
      console.error("Error downloading report:", err);
      message.error("Failed to download report.");
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : "Unknown Student";
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case "critical": return <AlertOutlined style={{ color: "#ff4d4f" }} />;
      case "warning": return <WarningOutlined style={{ color: "#faad14" }} />;
      case "positive": return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "analysis": return <BulbOutlined style={{ color: "#1890ff" }} />;
      default: return <InfoCircleOutlined style={{ color: "#8c8c8c" }} />;
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case "critical": return "#fff1f0";
      case "warning": return "#fffbe6";
      case "positive": return "#f6ffed";
      case "analysis": return "#e6f7ff";
      default: return "#fafafa";
    }
  };

  const getInsightBorderColor = (type) => {
    switch (type) {
      case "critical": return "#ffa39e";
      case "warning": return "#ffe58f";
      case "positive": return "#b7eb8f";
      case "analysis": return "#91d5ff";
      default: return "#d9d9d9";
    }
  };

  // =====================
  // ANALYTICS DASHBOARD
  // =====================
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
      return <Empty description="No analytics data available" />;
    }

    const {
      genderAnalytics,
      sectionAnalytics,
      monthlyTrends,
      quarterlyTrends,
      riskIndicators,
      overallStats,
      prescriptiveInsights,
    } = analyticsData;

    return (
      <div>
        {/* Period Selector */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
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
        </div>

        {/* Overall Stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Students"
                value={overallStats.totalStudents}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Avg Mood"
                value={overallStats.overallAvgMood || "N/A"}
                suffix={overallStats.overallAvgMood ? "/ 5" : ""}
                prefix={<HeartOutlined />}
                valueStyle={{
                  color: overallStats.overallAvgMood >= 3.5 ? "#52c41a"
                    : overallStats.overallAvgMood >= 2.5 ? "#faad14" : "#ff4d4f",
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Avg Survey Score"
                value={overallStats.overallAvgScore || "N/A"}
                suffix={overallStats.overallAvgScore ? "%" : ""}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Participation"
                value={overallStats.overallParticipation || 0}
                suffix="%"
                valueStyle={{
                  color: overallStats.overallParticipation >= 70 ? "#52c41a" : "#faad14",
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Risk Indicators */}
        <Card
          title={<span><AlertOutlined style={{ color: "#ff4d4f", marginRight: 8 }} />Risk Assessment Overview</span>}
          style={{ marginBottom: 24 }}
          size="small"
        >
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: "center" }}>
                <Progress
                  type="circle"
                  percent={overallStats.totalStudents > 0 ? Math.round((riskIndicators.highRisk / overallStats.totalStudents) * 100) : 0}
                  size={80}
                  strokeColor="#ff4d4f"
                  format={() => riskIndicators.highRisk}
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
                  percent={overallStats.totalStudents > 0 ? Math.round((riskIndicators.moderateRisk / overallStats.totalStudents) * 100) : 0}
                  size={80}
                  strokeColor="#faad14"
                  format={() => riskIndicators.moderateRisk}
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
                  percent={overallStats.totalStudents > 0 ? Math.round((riskIndicators.lowRisk / overallStats.totalStudents) * 100) : 0}
                  size={80}
                  strokeColor="#52c41a"
                  format={() => riskIndicators.lowRisk}
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
                  value={riskIndicators.decliningMoodCount}
                  prefix={<FallOutlined />}
                  valueStyle={{ color: riskIndicators.decliningMoodCount > 0 ? "#ff4d4f" : "#52c41a" }}
                />
                <Statistic
                  title="Low Participation"
                  value={riskIndicators.lowParticipationCount}
                  valueStyle={{ fontSize: 16, color: riskIndicators.lowParticipationCount > 0 ? "#faad14" : "#52c41a" }}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>
          </Row>
        </Card>

        {/* Gender Analytics */}
        {genderAnalytics.length > 0 && (
          <Card
            title={<span><ManOutlined style={{ color: "#1890ff", marginRight: 4 }} /><WomanOutlined style={{ color: "#ff69b4", marginRight: 8 }} />Gender-Based Mental Health Comparison</span>}
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Row gutter={16}>
              <Col xs={24} lg={12}>
                <Title level={5} style={{ textAlign: "center" }}>Zone Distribution by Gender</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={genderAnalytics} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="gender" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="zones.green" name="Green (Positive)" fill={ZONE_COLORS.green} stackId="zones" />
                    <Bar dataKey="zones.yellow" name="Yellow (Moderate)" fill={ZONE_COLORS.yellow} stackId="zones" />
                    <Bar dataKey="zones.red" name="Red (Needs Attention)" fill={ZONE_COLORS.red} stackId="zones" />
                  </BarChart>
                </ResponsiveContainer>
              </Col>
              <Col xs={24} lg={12}>
                <Title level={5} style={{ textAlign: "center" }}>Average Mood by Gender</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={genderAnalytics.filter((g) => g.avgMood)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="gender" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgMood" name="Avg Mood (1-5)" fill="#1890ff">
                      {genderAnalytics.filter((g) => g.avgMood).map((entry, idx) => (
                        <Cell key={idx} fill={GENDER_COLORS[idx % GENDER_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Col>
            </Row>

            {/* Gender stats table */}
            <Table
              dataSource={genderAnalytics}
              rowKey="gender"
              pagination={false}
              size="small"
              style={{ marginTop: 16 }}
              columns={[
                { title: "Gender", dataIndex: "gender", key: "gender", render: (v) => <Text strong>{v}</Text> },
                { title: "Students", dataIndex: "totalStudents", key: "students" },
                { title: "Avg Mood", dataIndex: "avgMood", key: "mood", render: (v) => v ? `${v}/5` : "N/A" },
                { title: "Red Zone %", dataIndex: "redZonePercentage", key: "red", render: (v) => <Tag color={v > 30 ? "red" : v > 15 ? "orange" : "green"}>{v}%</Tag> },
                { title: "Avg Anxiety", dataIndex: "avgAnxiety", key: "anxiety", render: (v) => v ?? "N/A" },
                { title: "Avg Depression", dataIndex: "avgDepression", key: "depression", render: (v) => v ?? "N/A" },
                { title: "Avg Stress", dataIndex: "avgStress", key: "stress", render: (v) => v ?? "N/A" },
              ]}
            />
          </Card>
        )}

        {/* Section Comparison */}
        {sectionAnalytics.length > 1 && (
          <Card
            title={<span><BarChartOutlined style={{ color: "#722ed1", marginRight: 8 }} />Cross-Section Mental Health Comparison</span>}
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Row gutter={16}>
              <Col xs={24} lg={12}>
                <Title level={5} style={{ textAlign: "center" }}>Zone Distribution by Section</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sectionAnalytics} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sectionName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="zones.green" name="Green" fill={ZONE_COLORS.green} stackId="zones" />
                    <Bar dataKey="zones.yellow" name="Yellow" fill={ZONE_COLORS.yellow} stackId="zones" />
                    <Bar dataKey="zones.red" name="Red" fill={ZONE_COLORS.red} stackId="zones" />
                  </BarChart>
                </ResponsiveContainer>
              </Col>
              <Col xs={24} lg={12}>
                <Title level={5} style={{ textAlign: "center" }}>DASS-21 Assessment by Section</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sectionAnalytics.filter((s) => s.avgAnxiety)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sectionName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgAnxiety" name="Anxiety" fill="#ff4d4f" stackId="dass" />
                    <Bar dataKey="avgDepression" name="Depression" fill="#1890ff" stackId="dass" />
                    <Bar dataKey="avgStress" name="Stress" fill="#faad14" stackId="dass" />
                  </BarChart>
                </ResponsiveContainer>
              </Col>
            </Row>

            <Table
              dataSource={sectionAnalytics}
              rowKey="sectionId"
              pagination={false}
              size="small"
              style={{ marginTop: 16 }}
              columns={[
                { title: "Section", dataIndex: "sectionName", key: "name", render: (v) => <Text strong>{v}</Text> },
                { title: "Students", dataIndex: "totalStudents", key: "students" },
                { title: "Avg Mood", dataIndex: "avgMood", key: "mood", render: (v) => v ? <Tag color={v >= 3.5 ? "green" : v >= 2.5 ? "orange" : "red"}>{v}/5</Tag> : "N/A" },
                { title: "Participation", dataIndex: "participationRate", key: "part", render: (v) => <Tag color={v >= 70 ? "green" : "orange"}>{v}%</Tag> },
                { title: "Anxiety", dataIndex: "avgAnxiety", key: "anx", render: (v) => v ?? "N/A" },
                { title: "Depression", dataIndex: "avgDepression", key: "dep", render: (v) => v ?? "N/A" },
                { title: "Stress", dataIndex: "avgStress", key: "stress", render: (v) => v ?? "N/A" },
              ]}
            />
          </Card>
        )}

        {/* Monthly Trends */}
        {monthlyTrends.length > 0 && (
          <Card
            title={<span><RiseOutlined style={{ color: "#1890ff", marginRight: 8 }} />Monthly Trends</span>}
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Row gutter={16}>
              <Col xs={24} lg={12}>
                <Title level={5} style={{ textAlign: "center" }}>Zone Distribution Over Time</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyTrends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthLabel" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="green" name="Green" fill={ZONE_COLORS.green} stackId="stack" />
                    <Bar dataKey="yellow" name="Yellow" fill={ZONE_COLORS.yellow} stackId="stack" />
                    <Bar dataKey="red" name="Red" fill={ZONE_COLORS.red} stackId="stack" />
                  </BarChart>
                </ResponsiveContainer>
              </Col>
              <Col xs={24} lg={12}>
                <Title level={5} style={{ textAlign: "center" }}>Average Mood & Red Zone % Trend</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthLabel" />
                    <YAxis yAxisId="left" domain={[0, 5]} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="avgMood" name="Avg Mood" stroke="#1890ff" strokeWidth={2} dot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="redPercentage" name="Red Zone %" stroke="#ff4d4f" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Col>
            </Row>

            <Table
              dataSource={monthlyTrends}
              rowKey="month"
              pagination={false}
              size="small"
              style={{ marginTop: 16 }}
              scroll={{ x: true }}
              columns={[
                { title: "Month", dataIndex: "monthLabel", key: "month", render: (v) => <Text strong>{v}</Text> },
                { title: "Total Surveys", dataIndex: "totalSurveys", key: "surveys" },
                { title: "Green", dataIndex: "green", key: "green", render: (v) => <Tag color="green">{v}</Tag> },
                { title: "Yellow", dataIndex: "yellow", key: "yellow", render: (v) => <Tag color="orange">{v}</Tag> },
                { title: "Red", dataIndex: "red", key: "red", render: (v) => <Tag color="red">{v}</Tag> },
                { title: "Red %", dataIndex: "redPercentage", key: "redPct", render: (v) => <Text type={v > 30 ? "danger" : undefined}>{v}%</Text> },
                { title: "Avg Mood", dataIndex: "avgMood", key: "mood", render: (v) => v ? `${v}/5` : "N/A" },
              ]}
            />
          </Card>
        )}

        {/* Quarterly Trends */}
        {quarterlyTrends.length > 0 && (
          <Card
            title={<span><BarChartOutlined style={{ color: "#13c2c2", marginRight: 8 }} />Quarterly Comparison</span>}
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Row gutter={16}>
              <Col xs={24} lg={14}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={quarterlyTrends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="green" name="Green" fill={ZONE_COLORS.green} />
                    <Bar dataKey="yellow" name="Yellow" fill={ZONE_COLORS.yellow} />
                    <Bar dataKey="red" name="Red" fill={ZONE_COLORS.red} />
                  </BarChart>
                </ResponsiveContainer>
              </Col>
              <Col xs={24} lg={10}>
                <Table
                  dataSource={quarterlyTrends}
                  rowKey="quarter"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: "Quarter", dataIndex: "quarter", key: "q", render: (v) => <Text strong>{v}</Text> },
                    { title: "Surveys", dataIndex: "totalSurveys", key: "s" },
                    { title: "Red %", dataIndex: "redPercentage", key: "r", render: (v) => <Tag color={v > 30 ? "red" : v > 15 ? "orange" : "green"}>{v}%</Tag> },
                    { title: "Avg Mood", dataIndex: "avgMood", key: "m", render: (v) => v ?? "N/A" },
                  ]}
                />
              </Col>
            </Row>
          </Card>
        )}

        {/* DASS-21 Initial Assessment Overview */}
        {overallStats.assessmentStats && (
          <Card
            title={<span><HeartOutlined style={{ color: "#eb2f96", marginRight: 8 }} />DASS-21 Initial Assessment Overview</span>}
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Row gutter={[16, 16]}>
              <Col xs={8}>
                <Card size="small" style={{ textAlign: "center" }}>
                  <Statistic
                    title="Avg Anxiety Score"
                    value={overallStats.assessmentStats.avgAnxiety}
                    valueStyle={{ color: overallStats.assessmentStats.avgAnxiety > 15 ? "#ff4d4f" : overallStats.assessmentStats.avgAnxiety > 8 ? "#faad14" : "#52c41a" }}
                  />
                  <Tag color={overallStats.assessmentStats.avgAnxiety > 15 ? "red" : overallStats.assessmentStats.avgAnxiety > 8 ? "orange" : "green"} style={{ marginTop: 8 }}>
                    {overallStats.assessmentStats.avgAnxiety > 15 ? "Severe" : overallStats.assessmentStats.avgAnxiety > 8 ? "Moderate" : "Normal"}
                  </Tag>
                </Card>
              </Col>
              <Col xs={8}>
                <Card size="small" style={{ textAlign: "center" }}>
                  <Statistic
                    title="Avg Depression Score"
                    value={overallStats.assessmentStats.avgDepression}
                    valueStyle={{ color: overallStats.assessmentStats.avgDepression > 14 ? "#ff4d4f" : overallStats.assessmentStats.avgDepression > 10 ? "#faad14" : "#52c41a" }}
                  />
                  <Tag color={overallStats.assessmentStats.avgDepression > 14 ? "red" : overallStats.assessmentStats.avgDepression > 10 ? "orange" : "green"} style={{ marginTop: 8 }}>
                    {overallStats.assessmentStats.avgDepression > 14 ? "Severe" : overallStats.assessmentStats.avgDepression > 10 ? "Moderate" : "Normal"}
                  </Tag>
                </Card>
              </Col>
              <Col xs={8}>
                <Card size="small" style={{ textAlign: "center" }}>
                  <Statistic
                    title="Avg Stress Score"
                    value={overallStats.assessmentStats.avgStress}
                    valueStyle={{ color: overallStats.assessmentStats.avgStress > 19 ? "#ff4d4f" : overallStats.assessmentStats.avgStress > 15 ? "#faad14" : "#52c41a" }}
                  />
                  <Tag color={overallStats.assessmentStats.avgStress > 19 ? "red" : overallStats.assessmentStats.avgStress > 15 ? "orange" : "green"} style={{ marginTop: 8 }}>
                    {overallStats.assessmentStats.avgStress > 19 ? "Severe" : overallStats.assessmentStats.avgStress > 15 ? "Moderate" : "Normal"}
                  </Tag>
                </Card>
              </Col>
            </Row>
          </Card>
        )}

        {/* Prescriptive Insights */}
        {prescriptiveInsights.length > 0 && (
          <Card
            title={<span><BulbOutlined style={{ color: "#fa8c16", marginRight: 8 }} />Prescriptive Insights & Recommendations</span>}
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
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 20, marginTop: 2 }}>
                      {getInsightIcon(insight.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: 15 }}>{insight.title}</Text>
                      <Tag
                        color={insight.severity === "high" ? "red" : insight.severity === "medium" ? "orange" : "green"}
                        style={{ marginLeft: 8 }}
                      >
                        {insight.severity.toUpperCase()}
                      </Tag>
                      <Paragraph style={{ margin: "8px 0 4px" }}>{insight.description}</Paragraph>
                      <div style={{ backgroundColor: "rgba(255,255,255,0.6)", padding: "8px 12px", borderRadius: 6, marginTop: 4 }}>
                        <Text strong style={{ color: "#595959" }}>Recommendation: </Text>
                        <Text>{insight.recommendation}</Text>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </Space>
          </Card>
        )}

        {/* Intervention Summary */}
        <Card
          title="Intervention Summary"
          size="small"
          style={{ marginBottom: 24 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Active Interventions"
                value={riskIndicators.activeInterventions}
                valueStyle={{ color: "#1890ff" }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Completed Interventions"
                value={riskIndicators.completedInterventions}
                valueStyle={{ color: "#52c41a" }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
          </Row>
        </Card>
      </div>
    );
  };

  // =====================
  // GENERATE REPORT TAB
  // =====================
  const renderGenerateReport = () => (
    <div>
      <Card>
        <Title level={4}>Generate New Trends Report</Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerateReport}
          initialValues={{ studentId: "all", timePeriod: "1month" }}
        >
          <Form.Item
            name="studentId"
            label="Student"
            rules={[{ required: true, message: "Please select a student" }]}
          >
            <Select placeholder="Select a student or all students" loading={loading} allowClear>
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
                avatar={<FilePdfOutlined style={{ fontSize: "24px", color: "#ff4d4f" }} />}
                title="Mental Health Trends Report"
                description={`Generated on ${moment(item.createdAt).format("MMMM D, YYYY")} - ${
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

  // =====================
  // MAIN RENDER
  // =====================
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
        Comprehensive mental health analytics with descriptive and prescriptive
        insights. Generate downloadable PDF reports for documentation.
      </Paragraph>

      {error && (
        <Alert message={error} type="error" style={{ marginBottom: 16 }} />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />
    </div>
  );
};

export default Reports;
