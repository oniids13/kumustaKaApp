import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Typography,
  Spin,
  Alert,
} from "antd";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

const TrendsView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moodData, setMoodData] = useState([]);
  const [issueData, setIssueData] = useState([]);
  const [timeframeData, setTimeframeData] = useState([]);
  const [periodFilter, setPeriodFilter] = useState("month");
  const [dateRange, setDateRange] = useState([]);

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    fetchTrendsData();
  }, [periodFilter, dateRange]);

  const fetchTrendsData = async () => {
    setLoading(true);
    try {
      const params = {
        period: periodFilter,
        ...(dateRange.length === 2 && {
          startDate: dateRange[0].format("YYYY-MM-DD"),
          endDate: dateRange[1].format("YYYY-MM-DD"),
        }),
      };

      const response = await axios.get(
        "http://localhost:3000/api/analytics/trends",
        {
          params,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data) {
        setMoodData(response.data.moodTrends || []);
        setIssueData(response.data.issueCategories || []);
        setTimeframeData(response.data.timeframeTrends || []);
      }
    } catch (err) {
      console.error("Error fetching trends data:", err);
      setError("Failed to load trends data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (value) => {
    setPeriodFilter(value);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: "20px" }}>Loading trends data...</div>
      </div>
    );
  }

  if (error) {
    return <Alert message={error} type="error" />;
  }

  // Generate mock data if API didn't return any
  const mockMoodData = moodData.length
    ? moodData
    : [
        { name: "Week 1", happy: 40, neutral: 30, sad: 20, anxious: 10 },
        { name: "Week 2", happy: 35, neutral: 32, sad: 22, anxious: 11 },
        { name: "Week 3", happy: 37, neutral: 31, sad: 19, anxious: 13 },
        { name: "Week 4", happy: 42, neutral: 28, sad: 18, anxious: 12 },
      ];

  const mockIssueData = issueData.length
    ? issueData
    : [
        { name: "Academic Stress", value: 35 },
        { name: "Social Anxiety", value: 25 },
        { name: "Sleep Issues", value: 18 },
        { name: "Family Problems", value: 12 },
        { name: "Future Concerns", value: 10 },
      ];

  const mockTimeframeData = timeframeData.length
    ? timeframeData
    : [
        { name: "Morning", value: 25 },
        { name: "Afternoon", value: 35 },
        { name: "Evening", value: 40 },
      ];

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Mental Health Trends</Title>
      <Text type="secondary">
        View anonymized, aggregated data from student mental health surveys
      </Text>

      <div style={{ marginTop: "20px", marginBottom: "30px" }}>
        <Row gutter={16}>
          <Col span={12}>
            <Select
              defaultValue={periodFilter}
              style={{ width: 120 }}
              onChange={handlePeriodChange}
            >
              <Option value="week">Weekly</Option>
              <Option value="month">Monthly</Option>
              <Option value="semester">Semester</Option>
            </Select>
          </Col>
          <Col span={12}>
            <RangePicker onChange={handleDateRangeChange} />
          </Col>
        </Row>
      </div>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="Mood Trends Over Time" style={{ marginBottom: "20px" }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={mockMoodData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="happy" stroke="#00C49F" />
                <Line type="monotone" dataKey="neutral" stroke="#FFBB28" />
                <Line type="monotone" dataKey="sad" stroke="#FF8042" />
                <Line type="monotone" dataKey="anxious" stroke="#0088FE" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Top Issues Reported">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockIssueData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {mockIssueData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Time of Day Reporting">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={mockTimeframeData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8">
                  {mockTimeframeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: "30px" }}>
        <Alert
          message="Data Privacy Notice"
          description="All data shown is anonymized and aggregated to protect student privacy. No individual responses are identifiable."
          type="info"
          showIcon
        />
      </div>
    </div>
  );
};

export default TrendsView;
