import {
  FaComments,
  FaBook,
  FaChartLine,
  FaBookOpen,
  FaShieldAlt,
  FaAddressCard,
  FaCheck,
  FaPenSquare,
  FaBullseye,
  FaEnvelope,
  FaSmile,
  FaCog,
} from "react-icons/fa";

import "../styles/SidePanel.css";

import { useState, useEffect } from "react";
import axios from "axios";
import { Badge } from "react-bootstrap";
import {
  setupNotificationChecks,
  refreshNotifications,
} from "../../../utils/notificationUtils";

import DailySurveyAlert from "./DailySurveyAlert";

// Function to check if a mood submission was made today based on localStorage
const checkLocalStorageMoodSubmission = () => {
  try {
    const lastSubmittedDate = localStorage.getItem("moodSubmissionDate");
    const today = new Date().toDateString();

    // If there's a record for today in localStorage, user has submitted
    return lastSubmittedDate === today;
  } catch (error) {
    console.error("[ERROR] Error checking localStorage:", error);
    return false;
  }
};

// Function to save mood submission to localStorage
const saveMoodSubmissionToStorage = () => {
  try {
    const today = new Date().toDateString();
    localStorage.setItem("moodSubmissionDate", today);
    return true;
  } catch (error) {
    console.error("[ERROR] Error saving to localStorage:", error);
    return false;
  }
};

const SidePanel = ({ user, activeModule, setActiveModule }) => {
  // Initialize state based on localStorage check
  const initialSubmittedState = checkLocalStorageMoodSubmission();

  const [moodRating, setMoodRating] = useState(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(
    initialSubmittedState,
  );
  const [errorMessage, setErrorMessage] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const checkTodaySubmission = async () => {
    try {
      // Check localStorage first - faster response
      const hasLocalStorageSubmission = checkLocalStorageMoodSubmission();
      if (hasLocalStorageSubmission) {
        setHasSubmittedToday(true);
        return true;
      }

      // If no localStorage record, check with API
      // Include client-side time information in the request
      const clientTime = new Date();
      const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Always use cache busting to ensure fresh data
      const cacheBuster = new Date().getTime();
      const url = `http://localhost:3000/api/moodEntry/checkToday?t=${cacheBuster}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "X-Client-Time": clientTime.toISOString(),
          "X-Client-Timezone": clientTimezone,
        },
        timeout: 8000, // Add reasonable timeout
      });

      const hasSubmitted =
        response.data && typeof response.data.hasSubmitted === "boolean"
          ? response.data.hasSubmitted
          : false;

      // If API says user has submitted, update localStorage too
      if (hasSubmitted) {
        saveMoodSubmissionToStorage();
      }

      // Update state
      setHasSubmittedToday(hasSubmitted);

      // Also clear form data if submitted
      if (hasSubmitted) {
        setMoodRating(null);
        setNotes("");
      }

      return hasSubmitted;
    } catch (error) {
      console.error("[ERROR] Error checking mood submission:", error);

      // If API check fails, rely on localStorage (fail safely)
      const hasLocalRecord = checkLocalStorageMoodSubmission();
      if (hasLocalRecord) {
        setHasSubmittedToday(true);
        return true;
      }

      return false;
    }
  };

  // Function to handle refresh button click
  const handleRefreshClick = () => {
    checkTodaySubmission();
  };

  const handleMoodSubmit = async () => {
    if (moodRating === null || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Include client-side time information in the request
      const clientTime = new Date();
      const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const response = await axios.post(
        "http://localhost:3000/api/moodEntry/newMoodEntry",
        {
          moodLevel: moodRating,
          notes: notes,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
            "X-Client-Time": clientTime.toISOString(),
            "X-Client-Timezone": clientTimezone,
          },
        },
      );

      if (response.status === 201) {
        // Clear form data
        setMoodRating(null);
        setNotes("");

        // Update both localStorage and state
        saveMoodSubmissionToStorage();
        setHasSubmittedToday(true);

        alert("Mood recorded successfully!");
      } else {
        throw new Error(response.data.message || "Failed to record mood");
      }
    } catch (error) {
      console.error("[ERROR] Error submitting mood:", error);

      // Show error message to user
      setErrorMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to record mood. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Force check for today's submission on component mount and set up periodic checks
  useEffect(() => {
    // Set initial state from localStorage first
    if (initialSubmittedState) {
      setHasSubmittedToday(true);
    }

    // Then verify with API
    const verifySubmissionStatus = async () => {
      try {
        await checkTodaySubmission();
      } catch (error) {
        console.error("[ERROR] Failed to verify submission status:", error);
      }
    };

    verifySubmissionStatus();

    // Set up periodic checks every 30 seconds
    const intervalId = setInterval(() => {
      checkTodaySubmission();
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Set up notification checking
  useEffect(() => {
    // Set up notification checks
    const cleanup = setupNotificationChecks(setUnreadMessages, null, "STUDENT");
    return cleanup;
  }, []);

  // Navigation Buttons
  const renderNavButton = (module, icon, label, count) => {
    return (
      <button
        className={`nav-button ${activeModule === module ? "active" : ""}`}
        onClick={() => {
          setActiveModule(module);
          // Refresh notifications after a short delay when navigating to messaging
          // This allows time for the messages to be marked as read
          if (module === "messaging") {
            setTimeout(() => {
              refreshNotifications();
            }, 1000);
          }
        }}
      >
        {icon} {label}
        {count > 0 && (
          <Badge pill bg="danger" className="notification-badge">
            {count}
          </Badge>
        )}
      </button>
    );
  };

  return (
    <>
      <div className="profile-card p-3 rounded">
        <p className="text-muted">Student Dashboard</p>
        <img
          src={user?.avatar || "/default-avatar.png"}
          alt={`${user?.name || "Student"}'s avatar`}
          className="rounded-circle mb-3"
        />
        <h4>Hello, {user?.name || "Student"}!</h4>
        <p>Hoping everything is good today! 😁</p>
      </div>

      {/* Mood Entry Form */}
      <div className="mood-entry-form mt-3">
        <div className="text-center">
          <h2>Daily Todo's</h2>
        </div>
        {errorMessage && (
          <div className="alert alert-danger">{errorMessage}</div>
        )}

        {hasSubmittedToday ? (
          <div className="already-submitted alert alert-success text-center rounded shadow">
            <FaCheck className="text-success" />
            <p>You've already submitted your mood today</p>
            <p className="text-muted">Come back tomorrow!</p>
            <div className="d-flex justify-content-center mt-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={handleRefreshClick}
                aria-label="Refresh mood submission status"
              >
                Refresh Status
              </button>
            </div>
          </div>
        ) : (
          <>
            <h5 className="mood-entry-title">Rate your current mood</h5>
            <div className="mood-options">
              {[
                {
                  level: 1,
                  icon: "😭",
                  label: "Terrible",
                },
                {
                  level: 2,
                  icon: "😥",
                  label: "Bad",
                },
                {
                  level: 3,
                  icon: "😐",
                  label: "Neutral",
                },
                {
                  level: 4,
                  icon: "😊",
                  label: "Good",
                },
                {
                  level: 5,
                  icon: "😁",
                  label: "Excellent",
                },
              ].map((mood) => (
                <button
                  key={mood.level}
                  className={`mood-option ${
                    moodRating === mood.level ? "selected" : ""
                  }`}
                  onClick={() => setMoodRating(mood.level)}
                  aria-label={`Mood level ${mood.level}: ${mood.label}`}
                  disabled={isSubmitting}
                >
                  <span className="mood-emoji">{mood.icon}</span>
                </button>
              ))}
            </div>
            <textarea
              className="mood-notes"
              placeholder="Optional notes about your mood..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
            />
            <button
              className="submit-mood-btn"
              onClick={handleMoodSubmit}
              disabled={moodRating === null || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Mood"}
            </button>
          </>
        )}
        <div className="daily-survey mt-5">
          <DailySurveyAlert />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="navigation-buttons">
        {renderNavButton("forum", <FaComments />, "Community Forum")}
        {renderNavButton(
          "messaging",
          <FaEnvelope />,
          "Messages",
          unreadMessages,
        )}
        {renderNavButton("journal", <FaBook />, "Wellness Journal")}
        {renderNavButton("moodtracker", <FaChartLine />, "Mood Tracker")}
        {renderNavButton("goaltracker", <FaBullseye />, "Goal Tracker")}
        {renderNavButton("quiz", <FaPenSquare />, "Interactive Quizzes")}
        {renderNavButton("resources", <FaBookOpen />, "Resource Library")}
        {renderNavButton("consent", <FaShieldAlt />, "Privacy and Consent")}
        {renderNavButton("emergency", <FaAddressCard />, "Emergency Contact")}
        {renderNavButton("settings", <FaCog />, "Settings")}
      </div>
    </>
  );
};

export default SidePanel;
