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

  const standardizeDate = (dateObj) => {
    // If we have a date object, standardize its format to ensure consistent display
    if (!dateObj) return null;

    // Create a new moment object from the date with consistent format
    // Use startOf('day') to ensure we compare dates without time component
    const momentDate = moment.utc(dateObj).startOf("day");
    return momentDate;
  };

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
        console.log(`Found ${allStudents.length} students in counselor view`);

        // Make sure to set the end date to capture all of today's activities
        const today = moment().endOf("day");
        const thirtyDaysAgo = moment().subtract(30, "days").startOf("day");

        // Format dates for API consistently
        const startDate = thirtyDaysAgo.format("YYYY-MM-DD");
        const endDate = today.format("YYYY-MM-DD");

        console.log(`Using date range: ${startDate} to ${endDate}`);

        // Fetch mental health data for students
        const mentalHealthData = await Promise.all(
          allStudents.map(async (student) => {
            try {
              console.log(
                `Fetching data for student: ${student.firstName} ${student.lastName} (ID: ${student.id})`
              );

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
              let initialAssessment = null;

              // Handle initialAssessment - could be null or have data
              try {
                initialAssessment = initialAssessmentResponse.data;
                if (initialAssessment) {
                  console.log(
                    `Found initial assessment for ${student.firstName}: D:${initialAssessment.depressionScore}, A:${initialAssessment.anxietyScore}, S:${initialAssessment.stressScore}`
                  );
                }
              } catch (error) {
                console.log(
                  `No initial assessment found for ${student.firstName}:`,
                  error.message
                );
              }

              console.log(
                `Student ${student.firstName} has ${surveys.length} surveys and ${moods.length} mood entries`
              );

              // Log details of any mood entries
              if (moods.length > 0) {
                const moodLevels = moods.map((m) => m.moodLevel);
                console.log(
                  `Mood entries for ${student.firstName}:`,
                  moodLevels
                );
              }

              // Find latest survey and mood
              const latestSurvey = surveys.length > 0 ? surveys[0] : null;
              const latestMood = moods.length > 0 ? moods[0] : null;

              // Calculate average mood directly from mood entries
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

              // Add red flag from initial assessment if it exists and no other data
              if (!latestSurvey && !latestMood && initialAssessment) {
                const { depressionScore, anxietyScore, stressScore } =
                  initialAssessment;
                const avgScore =
                  (depressionScore + anxietyScore + stressScore) / 3;
                if (avgScore >= 15) redFlags++; // High scores indicate need for attention
              }

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
        let unknownCount = 0;

        mentalHealthData.forEach((student) => {
          const zone = getStudentZone(student);
          if (zone === "Red (Needs Attention)") redCount++;
          else if (zone === "Yellow (Moderate)") yellowCount++;
          else if (zone === "Green (Positive)") greenCount++;
          else unknownCount++;
        });

        console.log(
          `Zone distribution: Red: ${redCount}, Yellow: ${yellowCount}, Green: ${greenCount}, Unknown: ${unknownCount}`
        );

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
    } else if (student.avgMood !== null && student.avgMood !== undefined) {
      if (student.avgMood <= 2) return "Red (Needs Attention)";
      else if (student.avgMood <= 3.5) return "Yellow (Moderate)";
      else return "Green (Positive)";
    } else if (student.initialAssessment) {
      // Determine zone based on initial assessment if no other data
      const { depressionScore, anxietyScore, stressScore } =
        student.initialAssessment;
      const avgScore = (depressionScore + anxietyScore + stressScore) / 3;

      if (avgScore >= 15) return "Red (Needs Attention)";
      else if (avgScore >= 10) return "Yellow (Moderate)";
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
      render: (avgMood, record) => {
        // Check if there are actual mood entries
        if (record.moods && record.moods.length > 0) {
          // We have actual mood data from entries
          const calculatedMood =
            record.moods.reduce((sum, m) => sum + m.moodLevel, 0) /
            record.moods.length;
          return calculatedMood.toFixed(1);
        }
        // If the avgMood is calculated but moods array might be missing
        else if (avgMood !== null && avgMood !== undefined) {
          return avgMood.toFixed(1);
        }
        // If we have an initial assessment but no mood entries
        else if (record.initialAssessment) {
          // Convert DASS scores to an approximate mood value (5 is highest mood, 1 is lowest)
          const { depressionScore, anxietyScore, stressScore } =
            record.initialAssessment;
          const avgScore = (depressionScore + anxietyScore + stressScore) / 3;
          // Higher DASS scores mean worse mental health, so we invert the scale
          let derivedMood;
          if (avgScore >= 20) derivedMood = 1.5; // Severe - very low mood
          else if (avgScore >= 15) derivedMood = 2.0; // Moderate - low mood
          else if (avgScore >= 10) derivedMood = 3.0; // Mild - moderate mood
          else derivedMood = 4.0; // Normal - good mood

          // Don't show asterisk for initial assessment data
          return derivedMood.toFixed(1);
        }
        return "No data";
      },
      sorter: (a, b) => {
        // Helper function to get mood value or derive it from assessment
        const getMoodValue = (record) => {
          if (record.moods && record.moods.length > 0) {
            return (
              record.moods.reduce((sum, m) => sum + m.moodLevel, 0) /
              record.moods.length
            );
          } else if (record.avgMood !== null && record.avgMood !== undefined) {
            return record.avgMood;
          } else if (record.initialAssessment) {
            const { depressionScore, anxietyScore, stressScore } =
              record.initialAssessment;
            const avgScore = (depressionScore + anxietyScore + stressScore) / 3;
            if (avgScore >= 20) return 1.5;
            else if (avgScore >= 15) return 2.0;
            else if (avgScore >= 10) return 3.0;
            else return 4.0;
          }
          return -1; // No data available, sort to end
        };

        return getMoodValue(a) - getMoodValue(b);
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
        // Use our standardization helper for consistent date handling
        const lastSurveyDate = record.latestSurvey
          ? standardizeDate(record.latestSurvey.createdAt)
          : null;
        const lastMoodDate = record.latestMood
          ? standardizeDate(record.latestMood.createdAt)
          : null;
        const assessmentDate = record.initialAssessment
          ? standardizeDate(record.initialAssessment.createdAt)
          : null;

        // Log dates to help with debugging
        if (record.firstName) {
          console.log(`${record.firstName}'s dates:`, {
            surveyDate: lastSurveyDate
              ? lastSurveyDate.format("YYYY-MM-DD")
              : null,
            moodDate: lastMoodDate ? lastMoodDate.format("YYYY-MM-DD") : null,
            assessmentDate: assessmentDate
              ? assessmentDate.format("YYYY-MM-DD")
              : null,
            rawSurvey: record.latestSurvey
              ? record.latestSurvey.createdAt
              : null,
            rawMood: record.latestMood ? record.latestMood.createdAt : null,
          });
        }

        // Check if we have actual mood or survey data
        if (lastMoodDate || lastSurveyDate) {
          let lastActivityDate;

          if (lastSurveyDate && lastMoodDate) {
            // Use the most recent date
            lastActivityDate = moment.max(lastSurveyDate, lastMoodDate);
          } else if (lastSurveyDate) {
            lastActivityDate = lastSurveyDate;
          } else {
            lastActivityDate = lastMoodDate;
          }

          // Format date consistently for display (always showing local time)
          return lastActivityDate.local().format("MMM DD, YYYY");
        }
        // If no survey or mood data, but we have assessment data
        else if (assessmentDate) {
          // Format assessment date consistently
          return assessmentDate.local().format("MMM DD, YYYY");
        }

        return "No activity";
      },
      sorter: (a, b) => {
        const getLastActivity = (record) => {
          // Use standardizeDate for consistent date handling
          const lastSurveyDate = record.latestSurvey
            ? standardizeDate(record.latestSurvey.createdAt).valueOf()
            : null;
          const lastMoodDate = record.latestMood
            ? standardizeDate(record.latestMood.createdAt).valueOf()
            : null;
          const assessmentDate = record.initialAssessment
            ? standardizeDate(record.initialAssessment.createdAt).valueOf()
            : null;

          // Return the most recent timestamp (or 0 if no dates available)
          if (lastSurveyDate && lastMoodDate) {
            return Math.max(lastSurveyDate, lastMoodDate);
          } else if (lastSurveyDate) {
            return lastSurveyDate;
          } else if (lastMoodDate) {
            return lastMoodDate;
          } else if (assessmentDate) {
            return assessmentDate;
          }
          return 0;
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
  const hasStudentData =
    students.length > 0 &&
    students.some((s) => s.initialAssessment || s.latestMood || s.latestSurvey);

  if (!hasData) {
    console.log(
      "No mood data available, students data:",
      students.length > 0 ? students.length + " students" : "No students"
    );
    if (hasStudentData) {
      return (
        <div style={{ padding: "20px" }}>
          <Title level={2}>Mental Health Overview</Title>
          <Paragraph>
            Current mental health status of all students in the system
          </Paragraph>

          <Alert
            message="Limited Data Available"
            description={
              <div>
                <p>
                  There is no aggregated mental health data available for the
                  current period.
                </p>
                <p>Individual student data is still available below.</p>
              </div>
            }
            type="info"
            showIcon
            style={{ margin: "20px 0" }}
          />

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
    } else {
      // No students data and no mood data
      return (
        <Alert
          message="No Data Available"
          description="There is no mental health data available. Please ensure students have completed their mood entries and surveys."
          type="info"
          showIcon
          style={{ margin: "20px" }}
        />
      );
    }
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
