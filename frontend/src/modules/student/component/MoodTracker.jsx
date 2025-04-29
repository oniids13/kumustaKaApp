import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  layouts,
} from "chart.js";
import axios from "axios";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import "../styles/MoodTracker.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MoodTracker = () => {
  const [weekNumber, setWeekNumber] = useState(getCurrentWeek());
  const [moodData, setMoodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem("userData"));

  // Get current ISO week number
  function getCurrentWeek() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const week1 = new Date(date.getFullYear(), 0, 4);
    return (
      1 +
      Math.round(
        ((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
      )
    );
  }

  useEffect(() => {
    const fetchMoodData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:3000/api/moodEntry/weeklyMoodEntries/${weekNumber}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
            transformResponse: [
              (data) => {
                try {
                  const parsed = JSON.parse(data);
                  return Array.isArray(parsed) ? parsed : [];
                } catch {
                  return [];
                }
              },
            ],
          }
        );

        const receivedData = Array.isArray(response.data) ? response.data : [];
        setMoodData(receivedData);
      } catch (error) {
        console.error("Error:", error);
        setMoodData([]);
        setError("Failed to load mood data.");
      } finally {
        setLoading(false);
      }
    };

    fetchMoodData();
  }, [weekNumber]);

  // Build mood level data aligned by weekday index
  const moodLevelsByDay = Array(7).fill(null);
  moodData.forEach((entry) => {
    const date = new Date(entry.createdAt);
    const dayIndex = date.getDay(); // Sunday = 0 ... Saturday = 6
    moodLevelsByDay[dayIndex] = entry.moodLevel;
  });

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
    <div className="mood-tracker-container">
      {/* Week Navigation */}
      <div className="week-navigation">
        <button
          onClick={() => setWeekNumber((prev) => prev - 1)}
          disabled={weekNumber <= 1}
        >
          <FiChevronLeft />
        </button>

        <h3>Week {weekNumber}</h3>

        <button
          onClick={() => setWeekNumber((prev) => prev + 1)}
          disabled={weekNumber >= getCurrentWeek()}
        >
          <FiChevronRight />
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Mood Chart */}
      <div className="mood-chart">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>

      {/* Daily Notes Section */}
      <div className="mood-notes">
        <h4>Daily Notes</h4>
        {loading ? (
          <div className="loading-spinner">Loading notes...</div>
        ) : error ? (
          <p>Could not load notes</p>
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
          <p>No mood entries found for this week</p>
        )}
      </div>
    </div>
  );
};

export default MoodTracker;
