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
} from "react-icons/fa";

import "../styles/SidePanel.css";

import { useState, useEffect } from "react";
import axios from "axios";
import { Badge } from "react-bootstrap";
import { setupNotificationChecks } from "../../../utils/notificationUtils";

import DailySurveyAlert from "./DailySurveyAlert";

// Function to check if a mood submission was made today based on localStorage
const checkLocalStorageMoodSubmission = () => {
  try {
    const lastSubmittedDate = localStorage.getItem("moodSubmissionDate");
    const today = new Date().toDateString();

    console.log(
      `[DEBUG] Checking localStorage: lastSubmittedDate=${lastSubmittedDate}, today=${today}`
    );

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
    console.log(
      `[DEBUG] Saved mood submission to localStorage for date: ${today}`
    );
    return true;
  } catch (error) {
    console.error("[ERROR] Error saving to localStorage:", error);
    return false;
  }
};

const SidePanel = ({ user, activeModule, setActiveModule }) => {
  // Initialize state with both API check and localStorage check
  const [moodRating, setMoodRating] = useState(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(
    checkLocalStorageMoodSubmission()
  );
  const [errorMessage, setErrorMessage] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const checkTodaySubmission = async () => {
    try {
      console.log("[DEBUG] Checking mood submission for today...");

      // Check localStorage first - faster response
      const hasLocalStorageSubmission = checkLocalStorageMoodSubmission();
      if (hasLocalStorageSubmission) {
        console.log(
          "[DEBUG] Found submission record in localStorage, setting state without API call"
        );
        setHasSubmittedToday(true);
        return true;
      }

      // If no localStorage record, check with API
      console.log(
        "[DEBUG] No submission in localStorage, checking with API..."
      );

      // Always use cache busting to ensure fresh data
      const cacheBuster = new Date().getTime();
      const url = `http://localhost:3000/api/moodEntry/checkToday?t=${cacheBuster}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      console.log("[DEBUG] Raw mood check response:", response.data);

      const hasSubmitted =
        response.data && typeof response.data.hasSubmitted === "boolean"
          ? response.data.hasSubmitted
          : false;

      console.log(
        `[DEBUG] API says hasSubmitted = ${hasSubmitted}, current state = ${hasSubmittedToday}`
      );

      // If API says user has submitted, update localStorage too
      if (hasSubmitted) {
        console.log("[DEBUG] API confirms submission, updating localStorage");
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
      // Immediately disable the form
      setHasSubmittedToday(true);

      console.log("[INFO] Submitting mood entry with level:", moodRating);

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
          },
        }
      );

      if (response.status === 201) {
        setMoodRating(null);
        setNotes("");
        console.log("[SUCCESS] Mood entry recorded successfully");

        // Save submission to localStorage for persistence across refreshes
        saveMoodSubmissionToStorage();

        // Ensure the UI shows that entry has been submitted
        setHasSubmittedToday(true);
        console.log(
          "[DEBUG] hasSubmittedToday set to true after successful submission"
        );

        alert("Mood recorded successfully!");
      } else {
        // If there's an unexpected response status, revert the UI state
        setHasSubmittedToday(false);
        throw new Error(response.data.message || "Failed to record mood");
      }
    } catch (error) {
      console.error("[ERROR] Error submitting mood:", error);
      // Revert the UI state if there was an error
      setHasSubmittedToday(false);

      // Show error message to user
      setErrorMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to record mood. Please try again."
      );
    } finally {
      setIsSubmitting(false);

      // Do one final check to ensure UI state is correct
      setTimeout(() => {
        console.log("[DEBUG] Final check after submission");
        checkTodaySubmission();
      }, 1500);
    }
  };

  // Force check for today's submission on component mount
  useEffect(() => {
    console.log("[DEBUG] Component mounted - checking mood submission status");

    // Check localStorage first (already done in useState initialization)
    const hasLocalRecord = checkLocalStorageMoodSubmission();
    console.log(`[DEBUG] Initial localStorage check: ${hasLocalRecord}`);

    // Still do an API check to keep things in sync
    checkTodaySubmission();

    // Set up periodic checks
    const intervalId = setInterval(() => {
      console.log("[DEBUG] Running periodic mood submission check");
      checkTodaySubmission();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Add additional effect to track state changes
  useEffect(() => {
    console.log(`[INFO] hasSubmittedToday changed to: ${hasSubmittedToday}`);

    // If state shows submitted but localStorage doesn't, update localStorage
    if (hasSubmittedToday && !checkLocalStorageMoodSubmission()) {
      console.log(
        "[DEBUG] State shows submitted but localStorage does not - syncing"
      );
      saveMoodSubmissionToStorage();
    }
  }, [hasSubmittedToday]);

  // Add logging to track component rendering
  console.log(
    `[RENDER] SidePanel rendering with hasSubmittedToday=${hasSubmittedToday}`
  );

  // Double-check with localStorage for rendering decision
  const finalSubmittedState =
    hasSubmittedToday || checkLocalStorageMoodSubmission();

  // Set up notification checking
  useEffect(() => {
    // Set up notification checks
    const cleanup = setupNotificationChecks(setUnreadMessages, null, "STUDENT");
    return cleanup;
  }, []);

  // Navigation Buttons
  const renderNavButton = (module, icon, label, count) => (
    <button
      className={`nav-button ${activeModule === module ? "active" : ""}`}
      onClick={() => setActiveModule(module)}
    >
      {icon} {label}
      {count > 0 && (
        <Badge pill bg="danger" className="notification-badge">
          {count}
        </Badge>
      )}
    </button>
  );

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
        {errorMessage && (
          <div className="alert alert-danger">{errorMessage}</div>
        )}

        {/* Debug output to see state value during rendering */}
        <div style={{ display: "none" }}>
          Current state: hasSubmittedToday={String(hasSubmittedToday)}
          localStorage check={String(checkLocalStorageMoodSubmission())}
          Final state used for rendering={String(finalSubmittedState)}
        </div>

        {finalSubmittedState ? (
          <div className="already-submitted alert alert-success text-center rounded shadow">
            <FaCheck className="text-success" />
            <p>You've already submitted your mood today</p>
            <p className="text-muted">Come back tomorrow!</p>
            <button
              className="btn btn-sm btn-outline-secondary mt-2"
              onClick={handleRefreshClick}
              aria-label="Refresh mood submission status"
            >
              Refresh Status
            </button>
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
                  {mood.icon}
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
          unreadMessages
        )}
        {renderNavButton("journal", <FaBook />, "Wellness Journal")}
        {renderNavButton("moodtracker", <FaChartLine />, "Mood Tracker")}
        {renderNavButton("goaltracker", <FaBullseye />, "Goal Tracker")}
        {renderNavButton("quiz", <FaPenSquare />, "Interactive Quizzes")}
        {renderNavButton("resources", <FaBookOpen />, "Resource Library")}
        {renderNavButton("consent", <FaShieldAlt />, "Privacy and Consent")}
        {renderNavButton("emergency", <FaAddressCard />, "Emergency Contact")}
      </div>
    </>
  );
};

export default SidePanel;
