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
  Button,
  Tabs,
  Empty,
  Statistic,
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
import moment from "moment";
import {
  FaExclamationTriangle,
  FaCheckCircle,
  FaMehBlank,
} from "react-icons/fa";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const COLORS = [
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#0088FE",
];

const StudentAnalytics = ({ initialStudentId }) => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(
    initialStudentId || null
  );
  const [surveyData, setSurveyData] = useState([]);
  const [moodData, setMoodData] = useState([]);
  const [dateRange, setDateRange] = useState([
    moment().subtract(30, "days"),
    moment(),
  ]);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    averageMood: null,
    surveyCompletion: 0,
    latestZone: null,
    redFlags: 0,
  });

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentData();
    }
  }, [selectedStudent, dateRange]);

  // This effect handles the case when initialStudentId is provided after component mount
  useEffect(() => {
    if (initialStudentId && initialStudentId !== selectedStudent) {
      setSelectedStudent(initialStudentId);
    }
  }, [initialStudentId]);

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
        // Auto-select the first student if no initialStudentId is provided
        if (!selectedStudent && response.data.students.length > 0) {
          setSelectedStudent(response.data.students[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to load students. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      // Format dates for API request
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      // Fetch survey data
      const surveyResponse = await axios.get(
        `http://localhost:3000/api/counselor/student/${selectedStudent}/surveys`,
        {
          params: { startDate, endDate },
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      // Fetch mood data
      const moodResponse = await axios.get(
        `http://localhost:3000/api/counselor/student/${selectedStudent}/moods`,
        {
          params: { startDate, endDate },
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (surveyResponse.data && moodResponse.data) {
        setSurveyData(surveyResponse.data.surveys || []);
        setMoodData(moodResponse.data.moods || []);

        // Calculate summary statistics
        const calculatedSummary = calculateSummary(
          surveyResponse.data.surveys || [],
          moodResponse.data.moods || []
        );
        setSummary(calculatedSummary);
      }
    } catch (err) {
      console.error("Error fetching student data:", err);
      setError("Failed to load student data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (surveys, moods) => {
    // Calculate average mood
    let totalMood = 0;
    moods.forEach((mood) => {
      totalMood += mood.moodLevel;
    });
    const avgMood = moods.length > 0 ? totalMood / moods.length : null;

    // Calculate survey completion rate
    const daysInRange = dateRange[1].diff(dateRange[0], "days") + 1;
    const surveyCompletionRate = (surveys.length / daysInRange) * 100;

    // Get latest zone (if any)
    const latestZone = surveys.length > 0 ? surveys[0].zone : null;

    // Count red flags (red zones or very low moods)
    let redFlagCount = 0;
    surveys.forEach((survey) => {
      if (survey.zone === "Red (Needs Attention)") {
        redFlagCount++;
      }
    });
    moods.forEach((mood) => {
      if (mood.moodLevel <= 2) {
        redFlagCount++;
      }
    });

    return {
      averageMood: avgMood,
      surveyCompletion: Math.round(surveyCompletionRate),
      latestZone: latestZone,
      redFlags: redFlagCount,
    };
  };

  const handleStudentChange = (value) => {
    setSelectedStudent(value);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleCreateIntervention = () => {
    // Redirect or open intervention creation modal
    window.location.href = `/counselor/interventions/create?studentId=${selectedStudent}`;
  };

  if (loading && !selectedStudent) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: "20px" }}>Loading student data...</div>
      </div>
    );
  }

  if (error) {
    return <Alert message={error} type="error" />;
  }

  const renderSummaryCards = () => {
    const selectedStudentData = students.find((s) => s.id === selectedStudent);
    const studentName = selectedStudentData
      ? `${selectedStudentData.firstName} ${selectedStudentData.lastName}`
      : "Selected Student";

    return (
      <>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card>
              <Title level={4}>{studentName}'s Mental Health Overview</Title>
              <Paragraph type="secondary">
                Summary of mental health indicators for the selected date range
              </Paragraph>
            </Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: "16px" }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Average Mood"
                value={
                  summary.averageMood ? summary.averageMood.toFixed(1) : "N/A"
                }
                suffix={summary.averageMood ? "/5" : ""}
                valueStyle={{
                  color:
                    summary.averageMood > 3
                      ? "#3f8600"
                      : summary.averageMood > 2
                      ? "#faad14"
                      : "#cf1322",
                }}
              />
              <Text type="secondary">From mood entries</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Survey Completion"
                value={summary.surveyCompletion}
                suffix="%"
                valueStyle={{
                  color:
                    summary.surveyCompletion > 80
                      ? "#3f8600"
                      : summary.surveyCompletion > 50
                      ? "#faad14"
                      : "#cf1322",
                }}
              />
              <Text type="secondary">Completion rate</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Latest Zone"
                value={summary.latestZone || "N/A"}
                valueStyle={{
                  color:
                    summary.latestZone === "Green (Positive)"
                      ? "#3f8600"
                      : summary.latestZone === "Yellow (Moderate)"
                      ? "#faad14"
                      : summary.latestZone === "Red (Needs Attention)"
                      ? "#cf1322"
                      : "#000000",
                  fontSize: "16px",
                }}
              />
              <Text type="secondary">Most recent survey</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Red Flags"
                value={summary.redFlags}
                valueStyle={{
                  color: summary.redFlags > 0 ? "#cf1322" : "#3f8600",
                }}
                prefix={
                  summary.redFlags > 0 ? (
                    <FaExclamationTriangle />
                  ) : (
                    <FaCheckCircle />
                  )
                }
              />
              <Text type="secondary">Alerts requiring attention</Text>
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  const renderMoodChart = () => {
    const chartData = moodData
      .map((entry) => ({
        date: moment(entry.createdAt).format("MMM DD"),
        mood: entry.moodLevel,
      }))
      .reverse();

    return (
      <Card title="Mood Tracking" style={{ marginTop: "16px" }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis
                domain={[0, 5]}
                ticks={[1, 2, 3, 4, 5]}
                label={{
                  value: "Mood Level",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                formatter={(value) => {
                  const labels = [
                    "Terrible",
                    "Bad",
                    "Neutral",
                    "Good",
                    "Excellent",
                  ];
                  return [`${value} - ${labels[value - 1]}`, "Mood"];
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty description="No mood data available for the selected date range" />
        )}
      </Card>
    );
  };

  const renderSurveyChart = () => {
    // Count zones for pie chart
    const zoneCount = {
      "Green (Positive)": 0,
      "Yellow (Moderate)": 0,
      "Red (Needs Attention)": 0,
    };

    surveyData.forEach((survey) => {
      if (Object.prototype.hasOwnProperty.call(zoneCount, survey.zone)) {
        zoneCount[survey.zone]++;
      }
    });

    const pieData = Object.keys(zoneCount).map((zone) => ({
      name: zone,
      value: zoneCount[zone],
    }));

    return (
      <Card title="Survey Responses by Zone" style={{ marginTop: "16px" }}>
        {surveyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.name === "Green (Positive)"
                        ? "#00C49F"
                        : entry.name === "Yellow (Moderate)"
                        ? "#FFBB28"
                        : "#FF8042"
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Empty description="No survey data available for the selected date range" />
        )}
      </Card>
    );
  };

  const renderInterventionButton = () => {
    return (
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <Button type="primary" size="large" onClick={handleCreateIntervention}>
          Create Intervention Plan
        </Button>
      </div>
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Student Mental Health Analytics</Title>
      <Text type="secondary">
        View detailed mental health data for individual students
      </Text>

      <div style={{ marginTop: "20px", marginBottom: "30px" }}>
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>Select Student:</Text>
            <Select
              style={{ width: "100%" }}
              placeholder="Select a student"
              onChange={handleStudentChange}
              value={selectedStudent}
              loading={loading && !selectedStudent}
            >
              {students.map((student) => (
                <Option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={12}>
            <Text strong>Date Range:</Text>
            <RangePicker
              style={{ width: "100%" }}
              value={dateRange}
              onChange={handleDateRangeChange}
            />
          </Col>
        </Row>
      </div>

      {selectedStudent ? (
        <Spin spinning={loading}>
          {renderSummaryCards()}

          <Tabs defaultActiveKey="mood" style={{ marginTop: "16px" }}>
            <TabPane tab="Mood Tracking" key="mood">
              {renderMoodChart()}
            </TabPane>
            <TabPane tab="Survey Analysis" key="survey">
              {renderSurveyChart()}
            </TabPane>
          </Tabs>

          {renderInterventionButton()}
        </Spin>
      ) : (
        <Empty description="Please select a student to view their analytics" />
      )}
    </div>
  );
};

export default StudentAnalytics;
