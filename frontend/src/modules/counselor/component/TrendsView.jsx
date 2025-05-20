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
  Statistic,
} from "antd";
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
  PieChart,
  Pie,
} from "recharts";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Custom colors for better visualization
const ZONE_COLORS = {
  "Green (Positive)": "#52c41a",
  "Yellow (Moderate)": "#faad14",
  "Red (Needs Attention)": "#ff4d4f",
};

const COLORS = [
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#0088FE",
  "#8884d8",
  "#82ca9d",
];

// Custom tooltip for better data display
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + entry.value, 0);
    return (
      <div
        style={{
          backgroundColor: "white",
          padding: "12px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <p
          style={{ margin: "0 0 8px 0", fontWeight: "bold", fontSize: "14px" }}
        >
          {label}
        </p>
        {payload.map((entry, index) => (
          <p
            key={index}
            style={{
              margin: "0 0 4px 0",
              color: entry.color,
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              fontSize: "13px",
            }}
          >
            <span>{entry.name}:</span>
            <span style={{ fontWeight: "bold" }}>{entry.value}</span>
          </p>
        ))}
        <p
          style={{
            margin: "8px 0 0 0",
            paddingTop: "8px",
            borderTop: "1px solid #eee",
            fontWeight: "bold",
            fontSize: "13px",
          }}
        >
          Total: {total}
        </p>
      </div>
    );
  }
  return null;
};

const TrendsView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moodData, setMoodData] = useState([]);
  const [dailyMoodData, setDailyMoodData] = useState([]);
  const [timeframeData, setTimeframeData] = useState([]);
  const [periodFilter, setPeriodFilter] = useState("week");
  const [dateRange, setDateRange] = useState([]);
  const [dailySubmissions, setDailySubmissions] = useState({
    moodEntriesCount: 0,
    surveyResponsesCount: 0,
  });

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    fetchTrendsData();
    fetchDailySubmissions();
  }, [periodFilter, dateRange]);

  const fetchTrendsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        period: periodFilter,
        ...(dateRange.length === 2 && {
          startDate: dateRange[0].format("YYYY-MM-DD"),
          endDate: dateRange[1].format("YYYY-MM-DD"),
        }),
      };

      const response = await axios.get(
        "http://localhost:3000/api/counselor/trends",
        {
          params,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data) {
        setMoodData(response.data.moodTrends || []);
        setDailyMoodData(response.data.dailyMoodTrends || []);
        setTimeframeData(response.data.timeframeTrends || []);
      }
    } catch (err) {
      console.error("Error fetching trends data:", err);
      setError(
        err.response?.data?.error ||
          "Failed to load trends data. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchDailySubmissions = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/counselor/daily-submissions",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setDailySubmissions(response.data);
    } catch (err) {
      console.error("Error fetching daily submissions:", err);
    }
  };

  const handlePeriodChange = (value) => {
    setPeriodFilter(value);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const calculateOverallStatus = (data) => {
    if (!data || !data.length) return [];

    let totalGreen = 0;
    let totalYellow = 0;
    let totalRed = 0;

    data.forEach((period) => {
      totalGreen += period["Green (Positive)"] || 0;
      totalYellow += period["Yellow (Moderate)"] || 0;
      totalRed += period["Red (Needs Attention)"] || 0;
    });

    const total = totalGreen + totalYellow + totalRed;
    if (total === 0) return [];

    return [
      {
        name: "Positive",
        value: Math.round((totalGreen / total) * 100),
        color: ZONE_COLORS["Green (Positive)"],
      },
      {
        name: "Moderate",
        value: Math.round((totalYellow / total) * 100),
        color: ZONE_COLORS["Yellow (Moderate)"],
      },
      {
        name: "Needs Attention",
        value: Math.round((totalRed / total) * 100),
        color: ZONE_COLORS["Red (Needs Attention)"],
      },
    ];
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
    return (
      <Alert
        message="Error Loading Data"
        description={error}
        type="error"
        showIcon
        style={{ margin: "20px" }}
      />
    );
  }

  const hasData =
    moodData.length > 0 || dailyMoodData.length > 0 || timeframeData.length > 0;

  if (!hasData) {
    return (
      <Alert
        message="No Data Available"
        description="There is no data available for the selected time period. Please try selecting a different period or date range."
        type="info"
        showIcon
        style={{ margin: "20px" }}
      />
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Mental Health Trends</Title>
      <Text type="secondary">
        View anonymized, aggregated data from student mental health surveys
      </Text>

      {/* Daily Submission Stats */}
      <Row gutter={16} style={{ marginTop: "20px", marginBottom: "30px" }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Today's Mood Entries"
              value={dailySubmissions.moodEntriesCount}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Today's Survey Submissions"
              value={dailySubmissions.surveyResponsesCount}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Overall Mental Health Status */}
      <Card
        title="Overall Mental Health Status"
        style={{ marginBottom: "30px" }}
      >
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={calculateOverallStatus(moodData)}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {calculateOverallStatus(moodData).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `${value}%`}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "8px",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

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
