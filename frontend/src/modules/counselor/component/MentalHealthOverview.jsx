import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Alert,
  Table,
  Tag,
  Statistic,
  Progress,
  Button,
  Space,
  Empty,
} from "antd";
import {
  WarningOutlined,
  LineChartOutlined,
  UserOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const { Title, Text, Paragraph } = Typography;

// Custom colors for better visualization
const ZONE_COLORS = {
  "Green (Positive)": "#52c41a",
  "Yellow (Moderate)": "#faad14",
  "Red (Needs Attention)": "#ff4d4f",
};

const MentalHealthOverview = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const [zoneStats, setZoneStats] = useState({
    red: 0,
    yellow: 0,
    green: 0,
    total: 0,
  });
  const [moodData, setMoodData] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    fetchStudentsWithData();
    fetchMoodData();
  }, []);

  const fetchStudentsWithData = async () => {
    setLoading(true);
    try {
      // Fetch all students
      const studentsResponse = await axios.get(
        "http://localhost:3000/api/counselor/students",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (studentsResponse.data && studentsResponse.data.students) {
        const allStudents = studentsResponse.data.students;
        setStudents(allStudents);

        // Fetch last 30 days of survey data for all students
        const startDate = moment().subtract(30, "days").format("YYYY-MM-DD");
        const endDate = moment().format("YYYY-MM-DD");

        // Fetch mental health data for students
        const mentalHealthData = await Promise.all(
          allStudents.map(async (student) => {
            try {
              // Fetch latest survey for the student
              const surveyResponse = await axios.get(
                `http://localhost:3000/api/counselor/student/${student.id}/surveys`,
                {
                  params: { startDate, endDate },
                  headers: {
                    Authorization: `Bearer ${user.token}`,
                  },
                }
              );

              // Fetch mood data for the student
              const moodResponse = await axios.get(
                `http://localhost:3000/api/counselor/student/${student.id}/moods`,
                {
                  params: { startDate, endDate },
                  headers: {
                    Authorization: `Bearer ${user.token}`,
                  },
                }
              );

              // Fetch initial assessment data
              const initialAssessmentResponse = await axios.get(
                `http://localhost:3000/api/counselor/student/${student.id}/initialAssessment`,
                {
                  headers: {
                    Authorization: `Bearer ${user.token}`,
                  },
                }
              );

              const surveys = surveyResponse.data.surveys || [];
              const moods = moodResponse.data.moods || [];
              const initialAssessment = initialAssessmentResponse.data || null;

              // Find latest survey and mood
              const latestSurvey = surveys.length > 0 ? surveys[0] : null;
              const latestMood = moods.length > 0 ? moods[0] : null;

              // Calculate average mood
              const avgMood =
                moods.length > 0
                  ? moods.reduce((sum, m) => sum + m.moodLevel, 0) /
                    moods.length
                  : null;

              // Count red flags
              let redFlags = 0;
              surveys.forEach((survey) => {
                if (survey.zone === "Red (Needs Attention)") {
                  redFlags++;
                }
              });
              moods.forEach((mood) => {
                if (mood.moodLevel <= 2) {
                  redFlags++;
                }
              });

              return {
                ...student,
                latestSurvey,
                latestMood,
                avgMood,
                redFlags,
                surveys,
                moods,
                initialAssessment,
              };
            } catch (error) {
              console.error(
                `Error fetching data for student ${student.id}:`,
                error
              );
              return {
                ...student,
                latestSurvey: null,
                latestMood: null,
                avgMood: null,
                redFlags: 0,
                surveys: [],
                moods: [],
                initialAssessment: null,
                error: true,
              };
            }
          })
        );

        // Calculate zone statistics
        let redCount = 0;
        let yellowCount = 0;
        let greenCount = 0;

        mentalHealthData.forEach((student) => {
          if (student.latestSurvey) {
            const zone = student.latestSurvey.zone;
            if (zone === "Red (Needs Attention)") redCount++;
            else if (zone === "Yellow (Moderate)") yellowCount++;
            else if (zone === "Green (Positive)") greenCount++;
          } else if (student.avgMood !== null) {
            // Use mood data if no survey
            if (student.avgMood <= 2) redCount++;
            else if (student.avgMood <= 3.5) yellowCount++;
            else greenCount++;
          }
        });

        setZoneStats({
          red: redCount,
          yellow: yellowCount,
          green: greenCount,
          total: mentalHealthData.length,
        });

        setStudents(mentalHealthData);
      }
    } catch (err) {
      console.error("Error fetching students data:", err);
      setError(
        "Failed to load student mental health data. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchMoodData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        "http://localhost:3000/api/counselor/trends",
        {
          params: {
            period: "week",
          },
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      console.log("API Response:", response.data);

      if (response.data && response.data.moodTrends) {
        setMoodData(response.data.moodTrends);
      } else {
        console.log("No mood trends data in response");
        setMoodData([]);
      }
    } catch (err) {
      console.error("Error fetching mood data:", err);
      setError(
        err.response?.data?.error ||
          "Failed to load mood data. Please try again later."
      );
      setMoodData([]);
    } finally {
      setLoading(false);
    }
  };

  const getStudentZone = (student) => {
    if (student.latestSurvey) {
      return student.latestSurvey.zone;
    } else if (student.avgMood !== null) {
      if (student.avgMood <= 2) return "Red (Needs Attention)";
      else if (student.avgMood <= 3.5) return "Yellow (Moderate)";
      else return "Green (Positive)";
    }
    return "Unknown";
  };

  const formatZone = (zone) => {
    if (zone === "Red (Needs Attention)")
      return <Tag color="red">Red (Needs Attention)</Tag>;
    if (zone === "Yellow (Moderate)")
      return <Tag color="gold">Yellow (Moderate)</Tag>;
    if (zone === "Green (Positive)")
      return <Tag color="green">Green (Positive)</Tag>;
    return <Tag>Unknown</Tag>;
  };

  const redAndYellowStudents = students.filter((student) => {
    const zone = getStudentZone(student);
    return zone === "Red (Needs Attention)" || zone === "Yellow (Moderate)";
  });

  const getAssessmentInterpretation = (assessment) => {
    if (!assessment) return "No assessment";

    const { depressionScore, anxietyScore, stressScore } = assessment;

    const getLevel = (score) => {
      if (score >= 20) return "Severe";
      if (score >= 15) return "Moderate";
      if (score >= 10) return "Mild";
      return "Normal";
    };

    const depressionLevel = getLevel(depressionScore);
    const anxietyLevel = getLevel(anxietyScore);
    const stressLevel = getLevel(stressScore);

    return (
      <div>
        <div>Depression: {depressionLevel}</div>
        <div>Anxiety: {anxietyLevel}</div>
        <div>Stress: {stressLevel}</div>
      </div>
    );
  };

  const columns = [
    {
      title: "Student",
      dataIndex: "firstName",
      key: "name",
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: "Initial Assessment",
      key: "initialAssessment",
      render: (_, record) => {
        if (!record.initialAssessment) return "Not completed";
        return (
          <div>
            <div>D: {record.initialAssessment.depressionScore}</div>
            <div>A: {record.initialAssessment.anxietyScore}</div>
            <div>S: {record.initialAssessment.stressScore}</div>
          </div>
        );
      },
    },
    {
      title: "Assessment Interpretation",
      key: "assessmentInterpretation",
      render: (_, record) =>
        getAssessmentInterpretation(record.initialAssessment),
    },
    {
      title: "Current Zone",
      key: "zone",
      render: (_, record) => formatZone(getStudentZone(record)),
      sorter: (a, b) => {
        const zoneOrder = {
          "Red (Needs Attention)": 3,
          "Yellow (Moderate)": 2,
          "Green (Positive)": 1,
          Unknown: 0,
        };
        return zoneOrder[getStudentZone(a)] - zoneOrder[getStudentZone(b)];
      },
      defaultSortOrder: "descend",
    },
    {
      title: "Avg. Mood",
      dataIndex: "avgMood",
      key: "avgMood",
      render: (avgMood) =>
        avgMood !== null && avgMood !== undefined
          ? avgMood.toFixed(1)
          : "No data",
      sorter: (a, b) => {
        if (a.avgMood === null || a.avgMood === undefined) return 1;
        if (b.avgMood === null || b.avgMood === undefined) return -1;
        return a.avgMood - b.avgMood;
      },
    },
    {
      title: "Red Flags",
      dataIndex: "redFlags",
      key: "redFlags",
      render: (redFlags) =>
        redFlags > 0 ? <Text type="danger">{redFlags}</Text> : redFlags,
      sorter: (a, b) => a.redFlags - b.redFlags,
    },
    {
      title: "Last Activity",
      key: "lastActivity",
      render: (_, record) => {
        const lastSurveyDate = record.latestSurvey
          ? moment(record.latestSurvey.createdAt)
          : null;
        const lastMoodDate = record.latestMood
          ? moment(record.latestMood.createdAt)
          : null;

        let lastActivityDate = null;

        if (lastSurveyDate && lastMoodDate) {
          lastActivityDate = moment.max(lastSurveyDate, lastMoodDate);
        } else if (lastSurveyDate) {
          lastActivityDate = lastSurveyDate;
        } else if (lastMoodDate) {
          lastActivityDate = lastMoodDate;
        }

        return lastActivityDate
          ? lastActivityDate.format("MMM DD, YYYY")
          : "No activity";
      },
      sorter: (a, b) => {
        const getLastActivity = (record) => {
          const lastSurveyDate = record.latestSurvey
            ? new Date(record.latestSurvey.createdAt)
            : null;
          const lastMoodDate = record.latestMood
            ? new Date(record.latestMood.createdAt)
            : null;

          if (lastSurveyDate && lastMoodDate) {
            return lastSurveyDate > lastMoodDate
              ? lastSurveyDate
              : lastMoodDate;
          } else if (lastSurveyDate) {
            return lastSurveyDate;
          } else if (lastMoodDate) {
            return lastMoodDate;
          }
          return new Date(0);
        };

        return getLastActivity(b) - getLastActivity(a);
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() =>
            navigate(`/counselor/analytics?studentId=${record.id}`)
          }
        >
          View Details
        </Button>
      ),
    },
  ];

  const calculateOverallStatus = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log("No valid data for calculateOverallStatus");
      return [];
    }

    let totalGreen = 0;
    let totalYellow = 0;
    let totalRed = 0;

    data.forEach((period) => {
      if (period) {
        totalGreen += period["Green (Positive)"] || 0;
        totalYellow += period["Yellow (Moderate)"] || 0;
        totalRed += period["Red (Needs Attention)"] || 0;
      }
    });

    const total = totalGreen + totalYellow + totalRed;
    if (total === 0) {
      console.log("Total count is zero, returning empty array");
      return [];
    }

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
        <div style={{ marginTop: "20px" }}>Loading mental health data...</div>
      </div>
    );
  }

  if (error) {
    return <Alert message={error} type="error" />;
  }

  const hasData = Array.isArray(moodData) && moodData.length > 0;

  if (!hasData) {
    return (
      <Alert
        message="No Data Available"
        description="There is no mental health data available for the current period."
        type="info"
        showIcon
        style={{ margin: "20px" }}
      />
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Mental Health Overview</Title>
      <Paragraph>
        Current mental health status of all students in the system
      </Paragraph>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Students in Red Zone"
              value={zoneStats.red}
              valueStyle={{ color: "#f5222d" }}
              prefix={<AlertOutlined />}
              suffix={`/ ${zoneStats.total}`}
            />
            <Text type="secondary">Need immediate attention</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Students in Yellow Zone"
              value={zoneStats.yellow}
              valueStyle={{ color: "#faad14" }}
              prefix={<WarningOutlined />}
              suffix={`/ ${zoneStats.total}`}
            />
            <Text type="secondary">Need monitoring</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Students in Green Zone"
              value={zoneStats.green}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined />}
              suffix={`/ ${zoneStats.total}`}
            />
            <Text type="secondary">Positive mental health</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Students"
              value={zoneStats.total}
              prefix={<UserOutlined />}
            />
            <Progress
              percent={100}
              success={{ percent: (zoneStats.green / zoneStats.total) * 100 }}
              strokeColor={{
                "0%": "#faad14",
                "100%": "#f5222d",
              }}
              showInfo={false}
            />
          </Card>
        </Col>
      </Row>

      {/* Overall Mental Health Status */}
      <div style={{ marginTop: "30px" }}>
        <Title level={3}>
          <Space>
            <LineChartOutlined />
            Overall Mental Health Status
          </Space>
        </Title>

        <Card>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              {calculateOverallStatus(moodData).length > 0 ? (
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
              ) : (
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  No data available for chart
                </text>
              )}
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
      </div>

      {/* Students Needing Attention */}
      <div style={{ marginTop: "30px" }}>
        <Title level={3}>
          <Space>
            <WarningOutlined style={{ color: "#f5222d" }} />
            Students Needing Attention
          </Space>
        </Title>

        {redAndYellowStudents.length > 0 ? (
          <Card>
            <Table
              dataSource={redAndYellowStudents}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        ) : (
          <Empty description="No students in red or yellow zone" />
        )}
      </div>

      {/* All Students */}
      <div style={{ marginTop: "30px" }}>
        <Title level={3}>
          <Space>
            <LineChartOutlined />
            All Students' Mental Health Status
          </Space>
        </Title>

        <Card>
          <Table
            dataSource={students}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </div>
  );
};

export default MentalHealthOverview;
