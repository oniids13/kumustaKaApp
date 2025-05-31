import { useState, useEffect } from "react";
import axios from "axios";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Alert, Spinner, Card, Button, ButtonGroup } from "react-bootstrap";
import React from "react";

// Import Chart.js properly for version 4.x
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

import "../styles/MoodTracker.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ERROR] Chart rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="danger">
          <Alert.Heading>Chart Error</Alert.Heading>
          <p>There was an error rendering the chart.</p>
          <p>{this.state.error?.message}</p>
        </Alert>
      );
    }

    return this.props.children;
  }
}

const MoodTracker = () => {
  const [weekNumber, setWeekNumber] = useState(getCurrentWeek());
  const [moodData, setMoodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user data safely
  const getUserData = () => {
    try {
      const userData = localStorage.getItem("userData");
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.error("[ERROR] Error parsing user data:", e);
      return null;
    }
  };

  const user = getUserData();

  // Get current ISO week number
  function getCurrentWeek() {
    try {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
      const week1 = new Date(date.getFullYear(), 0, 4);
      const currentWeek =
        1 +
        Math.round(
          ((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
        );
      return currentWeek;
    } catch (e) {
      console.error("[ERROR] Error calculating current week:", e);
      return 1; // Fallback to week 1
    }
  }

  // Fetch mood data for selected week
  useEffect(() => {
    const fetchMoodData = async () => {
      if (!user?.token) {
        console.error("No user token available for API request");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `http://localhost:3000/api/moodEntry/weeklyMoodEntries/${weekNumber}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        if (response.data && Array.isArray(response.data)) {
          setMoodData(response.data);
        }
      } catch (error) {
        console.error("Error fetching mood data:", error);
        setMoodData([]);
        setError(
          "Failed to load mood data: " +
            (error.response?.data?.error || error.message)
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMoodData();
  }, [weekNumber, user?.token]); // Use user?.token instead of user

  // Process mood data for the chart
  const processMoodData = (moods) => {
    try {
      // Create array for exactly 7 days (Mon-Sun to match ISO week)
      const daysOfWeek = [
        "Monday",
        "Tuesday", 
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ];
      const weekData = new Array(7).fill(null);

      moods.forEach((mood) => {
        const date = new Date(mood.createdAt);
        
        // Use UTC to avoid timezone issues
        const dayName = date.toLocaleDateString("en-US", { 
          weekday: "long",
          timeZone: "UTC"
        });
        
        const dayIndex = daysOfWeek.indexOf(dayName);

        if (dayIndex !== -1) {
          // If multiple entries for same day, use the latest one
          if (
            weekData[dayIndex] === null ||
            new Date(mood.createdAt) > new Date(weekData[dayIndex].createdAt)
          ) {
            weekData[dayIndex] = mood.moodLevel;
          }
        }
      });

      return weekData;
    } catch (e) {
      console.error("Error processing mood entries:", e);
      return new Array(7).fill(null);
    }
  };

  const weeklyMoodData = processMoodData(moodData);

  // Render the mood chart
  const renderMoodChart = () => {
    try {
      const chartData = {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Mood Level",
            data: weeklyMoodData,
            borderColor: "#4a6baf",
            backgroundColor: "rgba(74, 107, 175, 0.2)",
            tension: 0.3,
            fill: true,
            pointBackgroundColor: "#4a6baf",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            spanGaps: false, // Don't connect points where data is missing
          },
        ],
      };

      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 20,
          },
        },
        scales: {
          y: {
            min: 0.5,
            max: 5.5,
            ticks: {
              stepSize: 1,
              callback: (value) => {
                if (value >= 1 && value <= 5) {
                  return ["😢", "😞", "😐", "🙂", "😀"][value - 1];
                }
                return "";
              },
            },
            grid: {
              color: "rgba(0,0,0,0.1)",
            },
          },
          x: {
            grid: {
              color: "rgba(0,0,0,0.1)",
            },
          },
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: "My Weekly Mood Tracking",
            font: {
              size: 18,
              weight: "bold",
            },
            padding: {
              top: 10,
              bottom: 20,
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ctx.raw !== null
                  ? `Mood: ${
                      ["Very Low", "Low", "Neutral", "Good", "Excellent"][
                        ctx.raw - 1
                      ]
                    }`
                  : "No data",
            },
          },
        },
      };

      return (
        <ErrorBoundary>
          <Line data={chartData} options={chartOptions} />
        </ErrorBoundary>
      );
    } catch (e) {
      console.error("[ERROR] Error rendering chart:", e);
      return renderSimpleMoodVisualization();
    }
  };

  // Alternative mood visualization
  const renderSimpleMoodVisualization = () => {
    return (
      <div className="simple-mood-display">
        <div className="mood-week-grid">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
            (day, index) => (
              <div key={day} className="mood-day-card">
                <div className="day-label">{day}</div>
                <div className="mood-emoji">
                  {weeklyMoodData[index]
                    ? ["😢", "😞", "😐", "🙂", "😀"][weeklyMoodData[index] - 1]
                    : "—"}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  // Main render function
  return (
    <Card className="mood-tracker-container">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h3 className="mb-0">Mood Tracker</h3>

          <ButtonGroup>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setWeekNumber((prev) => prev - 1)}
              disabled={weekNumber <= 1}
            >
              <FiChevronLeft /> Prev Week
            </Button>

            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setWeekNumber(getCurrentWeek())}
            >
              Current Week
            </Button>

            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setWeekNumber((prev) => prev + 1)}
              disabled={weekNumber >= getCurrentWeek()}
            >
              Next Week <FiChevronRight />
            </Button>
          </ButtonGroup>
        </div>
      </Card.Header>

      <Card.Body>
        {/* Error Message */}
        {loading && (
          <Alert variant="danger" className="mb-3">
            <Alert.Heading>Error Loading Mood Data</Alert.Heading>
            <p>{error || "Loading mood data..."}</p>
          </Alert>
        )}

        {/* Week Info */}
        <div className="text-center mb-3">
          <h4>Week {weekNumber}</h4>
        </div>

        {/* Mood Chart */}
        <div className="mood-chart">
          {loading ? (
            <div className="text-center p-4">
              <Spinner animation="border" />
              <p>Loading your mood data...</p>
            </div>
          ) : moodData.length === 0 ? (
            <Alert variant="info">
              <Alert.Heading>No Mood Data Available</Alert.Heading>
              <p>
                You haven't recorded any moods for this week. Start recording
                your daily mood to see it tracked here.
              </p>
            </Alert>
          ) : (
            <div className="chart-visualization">
              {/* Try the chart first, fallback to simple visualization if there's an error */}
              {renderMoodChart()}
            </div>
          )}
        </div>

        {/* Daily Notes Section */}
        <div className="mood-notes mt-4">
          <h4>Daily Notes</h4>
          {loading ? (
            <Spinner animation="border" />
          ) : moodData.length > 0 ? (
            <div className="notes-grid">
              {moodData.map((entry) => (
                <div key={entry.id} className="note-card">
                  <div className="note-date">
                    {new Date(entry.createdAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="note-mood">
                    {["😢", "😞", "😐", "🙂", "😀"][entry.moodLevel - 1]}
                  </div>
                  <div className="note-content">
                    {entry.notes || "No notes for this day"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert variant="info">
              <p>No mood entries found for this week</p>
              <p className="small text-muted mt-2">
                Record your daily mood to see it tracked here
              </p>
            </Alert>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default MoodTracker;
