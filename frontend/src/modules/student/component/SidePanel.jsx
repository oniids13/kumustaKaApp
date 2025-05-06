import {
  FaComments,
  FaBook,
  FaChartLine,
  FaBookOpen,
  FaShieldAlt,
  FaAddressCard,
  FaCheck,
  FaPenSquare,
} from "react-icons/fa";

import "../styles/SidePanel.css";

import { useState, useEffect } from "react";
import axios from "axios";

import DailySurveyAlert from "./DailySurveyAlert";

const SidePanel = ({ user, activeModule, setActiveModule }) => {
  const [moodRating, setMoodRating] = useState(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);

  const checkTodaySubmission = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/moodEntry/checkToday",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setHasSubmittedToday(response.data.hasSubmitted);
    } catch (error) {
      console.error("Error checking submission:", error);
    }
  };

  const handleMoodSubmit = async () => {
    if (moodRating === null) return;

    setIsSubmitting(true);
    try {
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
        alert("Mood recorded successfully!");
      } else {
        throw new Error(response.data.message || "Failed to record mood");
      }
    } catch (error) {
      console.error("Error submitting mood:", error);
      alert(error.response?.data?.message || "Failed to record mood");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    checkTodaySubmission();
  }, []);

  return (
    <>
      <div className="profile-card p-3 rounded">
        <p className="text-muted">Student Dashboard</p>
        <img
          src={user.avatar || "/default-avatar.png"}
          alt={`${user.name}'s avatar`}
          className="rounded-circle mb-3"
        />
        <h4>Hello, {user.name}!</h4>
        <p>Hoping everything is good today! 😁</p>
      </div>

      {/* Mood Entry Form */}
      <div className="mood-entry-form mt-3">
        {hasSubmittedToday ? (
          <div className="already-submitted alert alert-success text-center rounded shadow">
            <FaCheck className="text-success" />
            <p>You've already submitted your mood today</p>
            <p className="text-muted">Come back tomorrow!</p>
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
        <button
          className={`nav-button ${activeModule === "forum" ? "active" : ""}`}
          onClick={() => setActiveModule("forum")}
        >
          <FaComments /> Community Forum
        </button>
        <button
          className={`nav-button ${activeModule === "journal" ? "active" : ""}`}
          onClick={() => setActiveModule("journal")}
        >
          <FaBook /> Wellness Journal
        </button>
        <button
          className={`nav-button ${
            activeModule === "moodtracker" ? "active" : ""
          }`}
          onClick={() => setActiveModule("moodtracker")}
        >
          <FaChartLine /> Mood Tracker
        </button>
        <button
          className={`nav-button ${activeModule === "quiz" ? "active" : ""}`}
          onClick={() => setActiveModule("quiz")}
        >
          <FaPenSquare /> Interactive Quizzes
        </button>
        <button
          className={`nav-button ${
            activeModule === "resources" ? "active" : ""
          }`}
          onClick={() => setActiveModule("resources")}
        >
          <FaBookOpen /> Resource Library
        </button>
        <button
          className={`nav-button ${activeModule === "consent" ? "active" : ""}`}
          onClick={() => setActiveModule("consent")}
        >
          <FaShieldAlt /> Privacy and Consent
        </button>
        <button
          className={`nav-button ${
            activeModule === "emergency" ? "active" : ""
          }`}
          onClick={() => setActiveModule("emergency")}
        >
          <FaAddressCard /> Emergency Contact
        </button>
      </div>
    </>
  );
};

export default SidePanel;
