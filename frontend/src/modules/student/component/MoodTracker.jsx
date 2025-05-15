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
  console.log("[DEBUG] MoodTracker component rendering");

  const [weekNumber, setWeekNumber] = useState(getCurrentWeek());
  const [moodData, setMoodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartError, setChartError] = useState(null);

  // Get user data safely
  const getUserData = () => {
    try {
      const userData = localStorage.getItem("userData");
      console.log("[DEBUG] Retrieved userData from localStorage:", !!userData);
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.error("[ERROR] Error parsing user data:", e);
      return null;
    }
  };

  const user = getUserData();
  console.log("[DEBUG] User authenticated:", !!user?.token);

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
      console.log("[DEBUG] Current week calculated as:", currentWeek);
      return currentWeek;
    } catch (e) {
      console.error("[ERROR] Error calculating current week:", e);
      return 1; // Fallback to week 1
    }
  }

  // Fetch mood data for selected week
  useEffect(() => {
    console.log(
      "[DEBUG] MoodTracker useEffect triggered for week:",
      weekNumber
    );

    const fetchMoodData = async () => {
      try {
        console.log("[DEBUG] Fetching mood data for week:", weekNumber);
        setLoading(true);
        setError(null);

        if (!user?.token) {
          console.error("[ERROR] No user token available for API request");
          setError("Authentication error. Please log in again.");
          setLoading(false);
          return;
        }

        const apiUrl = `http://localhost:3000/api/moodEntry/weeklyMoodEntries/${weekNumber}`;
        console.log("[DEBUG] API URL:", apiUrl);

        const response = await axios.get(apiUrl, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          timeout: 10000, // Add timeout to prevent hanging requests
        });

        console.log("[DEBUG] Final axios response:", response);
        const receivedData = Array.isArray(response.data) ? response.data : [];
        console.log(
          "[DEBUG] Setting mood data with length:",
          receivedData.length
        );
        setMoodData(receivedData);
      } catch (error) {
        console.error("[ERROR] Mood tracker fetch error:", error);
        setMoodData([]);
        setError(
          "Failed to load mood data: " +
            (error.response?.data?.error || error.message)
        );
      } finally {
        console.log("[DEBUG] Finished loading mood data");
        setLoading(false);
      }
    };

    fetchMoodData();
  }, [weekNumber, user?.token]); // Use user?.token instead of user

  // Process mood data for the chart
  const moodLevelsByDay = Array(7).fill(null);
  try {
    moodData.forEach((entry) => {
      if (!entry) return;
      const date = new Date(entry.createdAt);
      const dayIndex = date.getDay(); // Sunday = 0 ... Saturday = 6
      console.log(
        `[DEBUG] Processing entry for ${date.toDateString()}, day index: ${dayIndex}`
      );
      moodLevelsByDay[dayIndex] = entry.moodLevel;
    });
    console.log("[DEBUG] Final moodLevelsByDay:", moodLevelsByDay);
  } catch (e) {
    console.error("[ERROR] Error processing mood entries:", e);
    setChartError("Error processing mood data: " + e.message);
  }

  // Render the mood chart
  const renderMoodChart = () => {
    if (chartError) {
      return renderSimpleMoodVisualization();
    }

    try {
      const chartData = {
        labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        datasets: [
          {
            label: "Mood Level",
            data: moodLevelsByDay,
            borderColor: "#4a6baf",
            backgroundColor: "rgba(74, 107, 175, 0.2)",
            tension: 0.3,
            fill: true,
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
            min: 1,
            max: 5.5,
            ticks: {
              stepSize: 1,
              callback: (value) => ["😢", "😞", "😐", "🙂", "😀"][value - 1],
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
                ctx.raw
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
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
            (day, index) => (
              <div key={day} className="mood-day-card">
                <div className="day-label">{day}</div>
                <div className="mood-emoji">
                  {moodLevelsByDay[index]
                    ? ["😢", "😞", "😐", "🙂", "😀"][moodLevelsByDay[index] - 1]
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
        {error && (
          <Alert variant="danger" className="mb-3">
            <Alert.Heading>Error Loading Mood Data</Alert.Heading>
            <p>{error}</p>
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
