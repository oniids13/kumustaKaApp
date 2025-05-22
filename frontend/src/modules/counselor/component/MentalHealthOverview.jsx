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
import { createStyles } from "antd-style";

const { Title, Text, Paragraph } = Typography;

// Custom colors for better visualization
const ZONE_COLORS = {
  "Green (Positive)": "#52c41a",
  "Yellow (Moderate)": "#faad14",
  "Red (Needs Attention)": "#ff4d4f",
};

// Create component styles
const useStyles = createStyles(() => ({
  noDataRow: {
    backgroundColor: "#fafafa",
    opacity: 0.8,
  },
}));

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

  const { styles } = useStyles();

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
              // Check if this is our target student
              const isTargetStudent =
                student.id === "6926b287-6c08-4c3f-b2cb-bc72a4814ada";

              if (isTargetStudent) {
                console.log("==== DEBUGGING TARGET STUDENT ====");
                console.log(
                  `Processing student: ${student.firstName} ${student.lastName} (ID: ${student.id})`
                );
              }

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

              if (isTargetStudent) {
                console.log(`Survey data received: ${surveys.length} items`);
                console.log(`Mood data received: ${moods.length} items`);

                if (surveys.length > 0) {
                  console.log("Latest survey:", {
                    id: surveys[0].id,
                    zone: surveys[0].zone,
                    createdAt: surveys[0].createdAt,
                  });
                }

                if (moods.length > 0) {
                  console.log("Latest mood:", {
                    id: moods[0].id,
                    moodLevel: moods[0].moodLevel,
                    type: typeof moods[0].moodLevel,
                    createdAt: moods[0].createdAt,
                  });

                  // Check all mood entries for validity
                  const validMoods = moods.filter(
                    (m) => typeof m.moodLevel === "number"
                  );
                  console.log(
                    `Valid mood entries: ${validMoods.length} out of ${moods.length}`
                  );
                  if (validMoods.length === 0 && moods.length > 0) {
                    console.log("Sample invalid mood entry:", moods[0]);
                  }
                }
              }

              // Handle initialAssessment - could be null or have data
              try {
                initialAssessment = initialAssessmentResponse.data;

                // Validate assessment data
                if (initialAssessment) {
                  const { depressionScore, anxietyScore, stressScore } =
                    initialAssessment;
                  const validScores =
                    typeof depressionScore === "number" &&
                    typeof anxietyScore === "number" &&
                    typeof stressScore === "number";

                  if (!validScores) {
                    console.warn(
                      `Warning: Invalid assessment scores for ${student.firstName}:`,
                      JSON.stringify({
                        depressionScore,
                        anxietyScore,
                        stressScore,
                      })
                    );
                  } else {
                    console.log(
                      `Found initial assessment for ${student.firstName}: D:${depressionScore}, A:${anxietyScore}, S:${stressScore}`
                    );
                  }
                } else {
                  console.log(
                    `No initial assessment data for ${student.firstName}`
                  );
                }
              } catch (error) {
                console.log(
                  `No initial assessment found for ${student.firstName}:`,
                  error.message
                );
              }

              if (isTargetStudent) {
                // Call getStudentZone for target student and log its results
                const enrichedStudent = {
                  ...student,
                  latestSurvey: surveys.length > 0 ? surveys[0] : null,
                  latestMood: moods.length > 0 ? moods[0] : null,
                  avgMood:
                    moods.length > 0
                      ? moods.reduce((sum, m) => sum + m.moodLevel, 0) /
                        moods.length
                      : null,
                  redFlags: 0, // We'll calculate this later
                  surveys,
                  moods,
                  initialAssessment,
                  hasData:
                    surveys.length > 0 ||
                    moods.length > 0 ||
                    !!initialAssessment,
                };

                // Calculate zone for debugging
                const calculatedZone = getStudentZone(enrichedStudent);
                console.log(
                  `Calculated zone for target student: ${calculatedZone}`
                );
                console.log("==== END DEBUGGING TARGET STUDENT ====");
              }

              return {
                ...student,
                latestSurvey: surveys.length > 0 ? surveys[0] : null,
                latestMood: moods.length > 0 ? moods[0] : null,
                avgMood:
                  moods.length > 0
                    ? moods.reduce((sum, m) => sum + m.moodLevel, 0) /
                      moods.length
                    : null,
                redFlags: 0,
                surveys,
                moods,
                initialAssessment,
                hasData:
                  surveys.length > 0 || moods.length > 0 || !!initialAssessment,
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
                hasData: false,
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
    console.log(
      `Calculating zone for student: ${student.firstName} ${student.lastName}`
    );
    console.log(
      `Data available: ${JSON.stringify({
        hasSurveys: student.surveys && student.surveys.length > 0,
        surveyCount: student.surveys?.length || 0,
        hasMoods: student.moods && student.moods.length > 0,
        moodCount: student.moods?.length || 0,
        hasInitialAssessment: !!student.initialAssessment,
      })}`
    );

    // Check if this is the problematic student
    const isAnaGarcia = student.id === "6926b287-6c08-4c3f-b2cb-bc72a4814ada";
    if (isAnaGarcia) {
      console.log("SPECIAL DEBUGGING FOR ANA GARCIA");
      if (student.surveys && student.surveys.length > 0) {
        console.log("Survey data for Ana Garcia:");
        const latestSurvey = student.surveys[0];
        console.log(JSON.stringify(latestSurvey, null, 2));

        // Fix the survey zone format if needed
        if (latestSurvey.zone === "Yellow") {
          console.log("Converting 'Yellow' to 'Yellow (Moderate)'");
          // Don't mutate the original object directly to avoid side effects
          return "Yellow (Moderate)";
        } else if (latestSurvey.zone === "Red") {
          console.log("Converting 'Red' to 'Red (Needs Attention)'");
          return "Red (Needs Attention)";
        } else if (latestSurvey.zone === "Green") {
          console.log("Converting 'Green' to 'Green (Positive)'");
          return "Green (Positive)";
        }
      }
    }

    // First check if the student has a recent survey with zone information
    if (student.latestSurvey && student.latestSurvey.zone) {
      // Fix inconsistent zone naming
      const rawZone = student.latestSurvey.zone;
      let normalizedZone = rawZone;

      // Convert simple color names to full zone names
      if (rawZone === "Yellow") normalizedZone = "Yellow (Moderate)";
      else if (rawZone === "Red") normalizedZone = "Red (Needs Attention)";
      else if (rawZone === "Green") normalizedZone = "Green (Positive)";

      console.log(
        `Student ${student.firstName} has survey zone: ${normalizedZone}`
      );
      return normalizedZone;
    }
    // If no survey but has mood data, calculate zone from mood level
    else if (student.moods && student.moods.length > 0) {
      // Validate mood data - ensure we have valid mood levels (numbers)
      const validMoods = student.moods.filter(
        (m) => typeof m.moodLevel === "number"
      );

      if (validMoods.length === 0) {
        console.log(
          `Student ${student.firstName} has mood entries but all values are invalid`
        );
        return "No Data";
      }

      // Calculate average mood directly from valid entries
      const avgMood =
        validMoods.reduce((sum, m) => sum + m.moodLevel, 0) / validMoods.length;
      console.log(
        `Student ${
          student.firstName
        } has calculated mood zone from avg mood: ${avgMood.toFixed(2)}`
      );

      if (avgMood <= 2) return "Red (Needs Attention)";
      else if (avgMood <= 3.5) return "Yellow (Moderate)";
      else return "Green (Positive)";
    }
    // If no survey or mood but has initial assessment, use that
    else if (student.initialAssessment) {
      const { depressionScore, anxietyScore, stressScore } =
        student.initialAssessment;

      // Ensure we have valid scores
      if (
        typeof depressionScore === "number" &&
        typeof anxietyScore === "number" &&
        typeof stressScore === "number"
      ) {
        const avgScore = (depressionScore + anxietyScore + stressScore) / 3;
        console.log(
          `Student ${
            student.firstName
          } has assessment zone from avg score: ${avgScore.toFixed(2)}`
        );

        if (avgScore >= 15) return "Red (Needs Attention)";
        else if (avgScore >= 10) return "Yellow (Moderate)";
        else return "Green (Positive)";
      } else {
        console.log(
          `Student ${student.firstName} has invalid assessment scores:`,
          JSON.stringify({ depressionScore, anxietyScore, stressScore })
        );
        return "Invalid Data";
      }
    }

    // If we reach here, we couldn't determine the zone
    console.log(
      `Student ${student.firstName} has no valid data for zone calculation`
    );
    return "No Data";
  };

  const formatZone = (zone) => {
    if (zone === "Red (Needs Attention)")
      return <Tag color="red">Red (Needs Attention)</Tag>;
    if (zone === "Yellow (Moderate)")
      return <Tag color="gold">Yellow (Moderate)</Tag>;
    if (zone === "Green (Positive)")
      return <Tag color="green">Green (Positive)</Tag>;
    if (zone === "Invalid Data") return <Tag color="default">Invalid Data</Tag>;
    return <Tag color="default">No Data Available</Tag>;
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
      render: (_, record) => {
        const zone = getStudentZone(record);
        // Include information about why the zone might be unknown
        if (zone === "No Data" || zone === "Invalid Data") {
          return (
            <div>
              {formatZone(zone)}
              <div
                style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}
              >
                {!record.surveys?.length &&
                  !record.moods?.length &&
                  !record.initialAssessment &&
                  "No survey, mood or assessment data"}
                {!record.surveys?.length &&
                  !record.moods?.length &&
                  record.initialAssessment &&
                  "Based on assessment data only"}
                {record.moods?.length > 0 &&
                  record.moods.every((m) => typeof m.moodLevel !== "number") &&
                  "Mood data available but values are invalid"}
              </div>
            </div>
          );
        }
        return formatZone(zone);
      },
      sorter: (a, b) => {
        const zoneOrder = {
          "Red (Needs Attention)": 3,
          "Yellow (Moderate)": 2,
          "Green (Positive)": 1,
          "Invalid Data": 0,
          "No Data": 0,
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
        // Additional debugging for Ana Garcia
        const isAnaGarcia =
          record.id === "6926b287-6c08-4c3f-b2cb-bc72a4814ada";

        if (isAnaGarcia) {
          console.log("==== DEBUGGING ANA GARCIA'S LAST ACTIVITY ====");
          console.log("Raw data:", {
            latestSurvey: record.latestSurvey,
            latestMood: record.latestMood,
            initialAssessment: record.initialAssessment,
          });
        }

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
        if (isAnaGarcia) {
          console.log("Standardized dates:", {
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

          // Check today's date in various formats
          const now = new Date();
          const todayMoment = moment();
          console.log("Today's date:", {
            jsDate: now.toISOString(),
            moment: todayMoment.format("YYYY-MM-DD"),
            momentUTC: todayMoment.utc().format("YYYY-MM-DD"),
          });
        }

        // Check if we have actual mood or survey data
        if (lastMoodDate || lastSurveyDate) {
          let lastActivityDate;

          if (lastSurveyDate && lastMoodDate) {
            // Use the most recent date
            lastActivityDate = moment.max(lastSurveyDate, lastMoodDate);
            if (isAnaGarcia) {
              console.log(
                `Max date between survey ${lastSurveyDate.format(
                  "YYYY-MM-DD"
                )} and mood ${lastMoodDate.format(
                  "YYYY-MM-DD"
                )} is: ${lastActivityDate.format("YYYY-MM-DD")}`
              );
            }
          } else if (lastSurveyDate) {
            lastActivityDate = lastSurveyDate;
            if (isAnaGarcia) {
              console.log(
                `Using survey date: ${lastActivityDate.format("YYYY-MM-DD")}`
              );
            }
          } else {
            lastActivityDate = lastMoodDate;
            if (isAnaGarcia) {
              console.log(
                `Using mood date: ${lastActivityDate.format("YYYY-MM-DD")}`
              );
            }
          }

          // Format date consistently for display (always showing local time)
          const formattedDate = lastActivityDate.local().format("MMM DD, YYYY");
          if (isAnaGarcia) {
            console.log(`Final formatted date: ${formattedDate}`);
            console.log("==== END DEBUGGING ANA GARCIA'S LAST ACTIVITY ====");
          }
          return formattedDate;
        }
        // If no survey or mood data, but we have assessment data
        else if (assessmentDate) {
          // Format assessment date consistently
          const formattedDate = assessmentDate.local().format("MMM DD, YYYY");
          if (isAnaGarcia) {
            console.log(`Using assessment date: ${formattedDate}`);
            console.log("==== END DEBUGGING ANA GARCIA'S LAST ACTIVITY ====");
          }
          return formattedDate;
        }

        if (isAnaGarcia) {
          console.log("No activity data found");
          console.log("==== END DEBUGGING ANA GARCIA'S LAST ACTIVITY ====");
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
                rowClassName={(record) => {
                  // If the student has no data, add a special class
                  return !record.hasData ? styles.noDataRow : "";
                }}
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
        <Text
          type="secondary"
          style={{ display: "block", marginBottom: "16px" }}
        >
          Distribution of survey responses and mood entries (one entry per
          student per day)
        </Text>

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
            rowClassName={(record) => {
              // If the student has no data, add a special class
              return !record.hasData ? styles.noDataRow : "";
            }}
          />
        </Card>
      </div>
    </div>
  );
};

export default MentalHealthOverview;
