import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaBullseye,
  FaCheckCircle,
  FaRegCircle,
  FaCalendarAlt,
} from "react-icons/fa";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "../styles/GoalTracker.css";

const GoalTracker = () => {
  const [goals, setGoals] = useState([]);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [yearlySummary, setYearlySummary] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());

  const user = JSON.parse(localStorage.getItem("userData"));

  // Helper function to get current ISO week number
  function getCurrentWeek() {
    const date = new Date();
    return getWeekNumber(date)[1];
  }

  const currentWeek = getCurrentWeek();
  const currentYear = new Date().getFullYear();

  // Fetch goals for the selected week
  const fetchGoals = async (weekNumber) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3000/api/goals/weekly?week=${weekNumber}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setGoals(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching goals:", err);
      setError("Failed to load goals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch yearly summary
  const fetchYearlySummary = async () => {
    try {
      setCalendarLoading(true);
      const response = await axios.get(
        "http://localhost:3000/api/goals/yearly",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setYearlySummary(response.data);
    } catch (err) {
      console.error("Error fetching yearly summary:", err);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchGoals(selectedWeek);
    fetchYearlySummary();
  }, [selectedWeek]);

  // Handle week navigation
  const handleWeekChange = (direction) => {
    const newWeek = selectedWeek + direction;
    // Allow navigation to any week in the current year
    if (newWeek >= 1 && newWeek <= 52) {
      setSelectedWeek(newWeek);
    }
  };

  // Create a new goal
  const handleCreateGoal = async (e) => {
    e.preventDefault();

    // Validate input
    if (!newGoalTitle.trim()) {
      setError("Please enter a goal title");
      return;
    }

    setSubmitting(true);
    setError(null); // Clear any previous errors

    try {
      const response = await axios.post(
        "http://localhost:3000/api/goals",
        {
          title: newGoalTitle,
          description: "", // Add empty description field to meet schema requirements
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setGoals([...goals, response.data]);
      setNewGoalTitle("");
      await fetchYearlySummary(); // Refresh summary after adding a goal
    } catch (err) {
      console.error("Error creating goal:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to create goal. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle goal completion
  const handleToggleGoal = async (goalId) => {
    try {
      const response = await axios.put(
        `http://localhost:3000/api/goals/${goalId}/toggle`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setGoals(
        goals.map((goal) => (goal.id === goalId ? response.data : goal))
      );
      await fetchYearlySummary(); // Refresh summary after toggling
    } catch (err) {
      console.error("Error toggling goal:", err);
      setError("Failed to update goal. Please try again.");
    }
  };

  // Get weekly summary from goals data
  const getWeeklySummary = () => {
    if (!goals.length) return { totalGoals: 0, completed: 0, percentage: 0 };

    const completed = goals.filter((goal) => goal.isCompleted).length;
    return {
      totalGoals: goals.length,
      completed,
      percentage: Math.round((completed / goals.length) * 100),
    };
  };

  // Get current week's summary from yearly data
  const getCurrentWeekSummary = () => {
    if (!yearlySummary || yearlySummary.length === 0) return null;

    const currentWeekSummary = yearlySummary.find(
      (week) => week.weekNumber === selectedWeek && week.year === currentYear
    );

    return currentWeekSummary;
  };

  // Generate calendar data
  const generateCalendarData = () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Create a map to hold weeks for each month
    const monthToWeeks = {};

    // Initialize the map for all months
    months.forEach((_, idx) => {
      monthToWeeks[idx] = new Set();
    });

    // Helper function to get the Monday of an ISO week
    function getMondayOfWeek(year, weekNumber) {
      // January 4th is always in week 1 of the ISO year
      const jan4 = new Date(Date.UTC(year, 0, 4));
      // Get the Monday of week 1
      const dayOfWeek = jan4.getUTCDay() || 7; // Convert Sunday (0) to 7
      const monday = new Date(jan4);
      monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);
      // Add (weekNumber - 1) weeks to get the Monday of the target week
      monday.setUTCDate(monday.getUTCDate() + (weekNumber - 1) * 7);
      return monday;
    }

    // Helper function to get the last week number of a year
    function getLastWeekOfYear(year) {
      const lastDay = new Date(year, 11, 31);
      const lastDayWeekData = getWeekNumber(lastDay);

      // If the last day is in week 1 of next year, we need to find the actual last week
      if (lastDayWeekData[0] > year) {
        // Go back until we find a day in the current year's last week
        let testDate = new Date(lastDay);
        for (let i = 1; i <= 7; i++) {
          testDate.setDate(testDate.getDate() - i);
          const [testYear, testWeek] = getWeekNumber(testDate);
          if (testYear === year) {
            return testWeek;
          }
        }
        return 52; // Default fallback
      }

      return lastDayWeekData[1];
    }

    // Get total weeks in the current year
    const totalWeeks = getLastWeekOfYear(currentYear);

    // Assign each week to the month where its Monday falls
    for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
      const monday = getMondayOfWeek(currentYear, weekNum);
      const monthIndex = monday.getUTCMonth();

      // Only add if the Monday falls within the current year
      if (monday.getUTCFullYear() === currentYear) {
        monthToWeeks[monthIndex].add(weekNum);
      } else if (monday.getUTCFullYear() < currentYear) {
        // If Monday is in previous year (can happen for week 1), assign to January
        monthToWeeks[0].add(weekNum);
      }
    }

    // Convert the map to the expected array format
    const weeksByMonth = months.map((month, monthIndex) => {
      // Convert Set to Array and sort
      const weeksArray = Array.from(monthToWeeks[monthIndex]).sort(
        (a, b) => a - b
      );

      return {
        month,
        weeks: weeksArray,
      };
    });

    return weeksByMonth;
  };

  // Helper for full ISO week number calculation
  function getWeekNumber(d) {
    // Clone the date to avoid modifying the original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    const weekNumber = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    // Return array of [year, week number]
    return [d.getUTCFullYear(), weekNumber];
  }

  // Get week status for the calendar
  const getWeekStatus = (weekNumber) => {
    const weekData = yearlySummary.find(
      (summary) =>
        summary.weekNumber === weekNumber && summary.year === currentYear
    );

    if (!weekData) return "empty";

    return weekData.status === "COMPLETED"
      ? "completed"
      : weekData.status === "INCOMPLETE"
      ? "incomplete"
      : "empty";
  };

  // Format percentage for tooltip
  const formatTooltipText = (weekNumber) => {
    const weekData = yearlySummary.find(
      (summary) =>
        summary.weekNumber === weekNumber && summary.year === currentYear
    );

    if (!weekData) return "No goals set";

    return `Week ${weekNumber}: ${weekData.completed}/${weekData.totalGoals} goals (${weekData.percentage}%)`;
  };

  const summary = getCurrentWeekSummary() || getWeeklySummary();
  const maxGoalsReached = goals.length >= 5;
  const calendarData = generateCalendarData();

  return (
    <div className="goal-tracker-container">
      <div className="goal-tracker-header">
        <h2>
          <FaBullseye className="me-2" />
          Weekly Goal Tracker
        </h2>
        <p>Set up to 5 goals for the week and track your progress</p>
      </div>

      {/* Week navigation */}
      <div className="week-navigation">
        <button
          onClick={() => handleWeekChange(-1)}
          disabled={selectedWeek <= 1}
        >
          <FiChevronLeft />
        </button>
        <h3>Week {selectedWeek}</h3>
        <button
          onClick={() => handleWeekChange(1)}
          disabled={selectedWeek >= 52}
        >
          <FiChevronRight />
        </button>
      </div>

      {/* Goal creation form */}
      <form className="goal-form" onSubmit={handleCreateGoal}>
        <input
          type="text"
          value={newGoalTitle}
          onChange={(e) => {
            setNewGoalTitle(e.target.value);
            if (error) setError(null); // Clear error when typing
          }}
          placeholder="Enter a new goal..."
          disabled={maxGoalsReached || submitting}
          className={error ? "input-error" : ""}
        />
        <button type="submit" disabled={maxGoalsReached || submitting}>
          {submitting ? "Adding..." : "Add Goal"}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {maxGoalsReached && (
        <div className="max-goals-message">
          You've reached the maximum of 5 goals for this week.
        </div>
      )}

      {/* Goals list */}
      {loading ? (
        <div className="loading-spinner">Loading goals...</div>
      ) : goals.length > 0 ? (
        <ul className="goals-list">
          {goals.map((goal) => (
            <li
              key={goal.id}
              className={`goal-item ${goal.isCompleted ? "completed" : ""}`}
            >
              <span
                className="goal-check"
                onClick={() => handleToggleGoal(goal.id)}
              >
                {goal.isCompleted ? (
                  <FaCheckCircle size={20} color="#4CAF50" />
                ) : (
                  <FaRegCircle size={20} color="#757575" />
                )}
              </span>
              <span
                className={`goal-text ${goal.isCompleted ? "completed" : ""}`}
              >
                {goal.title}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <FaBullseye size={48} />
          <h4>No goals set for this week</h4>
          <p>Start by adding a goal above</p>
        </div>
      )}

      {/* Weekly summary */}
      {(goals.length > 0 || summary?.totalGoals > 0) && (
        <div className="weekly-summary">
          <h4>Weekly Progress</h4>
          <div className="progress-container">
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${summary?.percentage || 0}%` }}
              ></div>
            </div>
            <div className="progress-text">
              <span>
                {summary?.completed || 0}/{summary?.totalGoals || 0} completed
              </span>
              <span>{summary?.percentage || 0}%</span>
            </div>
          </div>

          <div>
            <span>
              Status:
              {summary?.status === "COMPLETED" ? (
                <span className="status-badge status-completed">Completed</span>
              ) : summary?.status === "INCOMPLETE" ? (
                <span className="status-badge status-incomplete">
                  In Progress
                </span>
              ) : (
                <span className="status-badge status-empty">Not Started</span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Yearly Calendar View */}
      <div className="yearly-calendar">
        <h4>
          <FaCalendarAlt className="me-2" />
          {currentYear} Goal Progress Calendar
        </h4>

        {calendarLoading ? (
          <div className="loading-spinner">Loading calendar data...</div>
        ) : (
          <div className="calendar-container">
            {/* Legend column */}
            <div className="month-column">
              <div className="month-header">Week</div>
              {/* Show legend for weeks 1-5, primarily for styling purposes */}
              {Array.from({ length: 5 }, (_, i) => (
                <div key={`legend-${i}`} className="week-cell empty">
                  <span className="week-number">{i + 1}</span>
                </div>
              ))}
            </div>

            {/* Month columns */}
            {calendarData.map((monthData) => (
              <div key={monthData.month} className="month-column">
                <div className="month-header">{monthData.month}</div>
                {monthData.weeks.length > 0 ? (
                  monthData.weeks.map((weekNum, weekIndex) => {
                    const weekStatus = getWeekStatus(weekNum);
                    const isFirstWeeks = weekIndex < 2; // First two weeks in the month
                    return (
                      <div
                        key={`${monthData.month}-week-${weekNum}`}
                        className={`week-cell ${weekStatus} ${
                          weekNum === selectedWeek ? "current" : ""
                        } ${isFirstWeeks ? "first-weeks" : ""}`}
                        onMouseEnter={() => setShowTooltip(weekNum)}
                        onMouseLeave={() => setShowTooltip(null)}
                      >
                        <span className="week-number">{weekNum}</span>
                        {showTooltip === weekNum && (
                          <div
                            className={`week-tooltip ${
                              isFirstWeeks ? "tooltip-bottom" : "tooltip-top"
                            }`}
                          >
                            {formatTooltipText(weekNum)}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="week-cell empty">
                    <span className="week-number">-</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalTracker;
