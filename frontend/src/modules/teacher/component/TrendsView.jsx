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

// Custom tooltip for daily mood chart
const DailyMoodTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
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
        "http://localhost:3000/api/teacher/trends",
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
        "http://localhost:3000/api/teacher/daily-submissions",
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

  const processMoodData = (data) => {
    if (!data || !data.length) return [];

    return data.map((period) => ({
      name: period.name,
      "Green (Positive)": period["Green (Positive)"] || 0,
      "Yellow (Moderate)": period["Yellow (Moderate)"] || 0,
      "Red (Needs Attention)": period["Red (Needs Attention)"] || 0,
      total:
        (period["Green (Positive)"] || 0) +
        (period["Yellow (Moderate)"] || 0) +
        (period["Red (Needs Attention)"] || 0),
    }));
  };

  const processDailyMoodData = (data) => {
    if (!data || !data.length) return [];

    return data.map((day) => ({
      name: day.date,
      Positive: day.positive || 0,
      Moderate: day.moderate || 0,
      "Needs Attention": day.needsAttention || 0,
    }));
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

      {/* Mental Health Zone Distribution */}
      {moodData.length > 0 && (
        <Row gutter={16}>
          <Col span={24}>
            <Card
              title={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0 8px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "16px", fontWeight: "500" }}>
                      Mental Health Zone Distribution
                    </span>
                    <Text
                      type="secondary"
                      style={{
                        display: "block",
                        fontSize: "13px",
                        marginTop: "4px",
                      }}
                    >
                      Distribution of student responses across mental health
                      zones
                    </Text>
                  </div>
                  <Select
                    defaultValue={periodFilter}
                    style={{ width: 120 }}
                    onChange={handlePeriodChange}
                  >
                    <Option value="week">Weekly</Option>
                    <Option value="month">Monthly</Option>
                    <Option value="semester">Semester</Option>
                  </Select>
                </div>
              }
              style={{ marginBottom: "20px" }}
            >
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={processMoodData(moodData)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  barGap={0}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "#d9d9d9" }}
                  />
                  <YAxis
                    label={{
                      value: "Number of Students",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle", fontSize: 12 },
                    }}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "#d9d9d9" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{
                      paddingBottom: "20px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="Green (Positive)"
                    stackId="a"
                    fill={ZONE_COLORS["Green (Positive)"]}
                    name="Green (Positive)"
                  />
                  <Bar
                    dataKey="Yellow (Moderate)"
                    stackId="a"
                    fill={ZONE_COLORS["Yellow (Moderate)"]}
                    name="Yellow (Moderate)"
                  />
                  <Bar
                    dataKey="Red (Needs Attention)"
                    stackId="a"
                    fill={ZONE_COLORS["Red (Needs Attention)"]}
                    name="Red (Needs Attention)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}

      {/* Daily Mood Trends and Time of Day Reporting */}
      <Row gutter={16}>
        {dailyMoodData.length > 0 && (
          <Col span={12}>
            <Card
              title={
                <div>
                  <span style={{ fontSize: "16px", fontWeight: "500" }}>
                    Daily Mood Trends
                  </span>
                  <Text
                    type="secondary"
                    style={{
                      display: "block",
                      fontSize: "13px",
                      marginTop: "4px",
                    }}
                  >
                    Daily distribution of student moods
                  </Text>
                </div>
              }
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={processDailyMoodData(dailyMoodData)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "#d9d9d9" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "#d9d9d9" }}
                  />
                  <Tooltip content={<DailyMoodTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{
                      paddingTop: "20px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Positive"
                    stroke={ZONE_COLORS["Green (Positive)"]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Moderate"
                    stroke={ZONE_COLORS["Yellow (Moderate)"]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Needs Attention"
                    stroke={ZONE_COLORS["Red (Needs Attention)"]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}

        {timeframeData.length > 0 && (
          <Col span={12}>
            <Card title="Time of Day Reporting">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={timeframeData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8">
                    {timeframeData.map((entry, index) => (
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
        )}
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
