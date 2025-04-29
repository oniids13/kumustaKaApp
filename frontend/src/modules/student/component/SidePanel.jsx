import {
  FaComments,
  FaBook,
  FaChartLine,
  FaBookOpen,
  FaShieldAlt,
  FaAddressCard,
  FaCheck,
} from "react-icons/fa";

import {
  FaFaceSadTear,
  FaFaceSadCry,
  FaFaceMeh,
  FaFaceSmile,
  FaFaceGrinHearts,
} from "react-icons/fa6";

import "../styles/SidePanel.css";

import { useState, useEffect } from "react";
import axios from "axios";

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
      <div className="profile-card">
        <img
          src={user.avatar || "/default-avatar.png"}
          alt={`${user.name}'s avatar`}
          className="rounded-circle mb-3"
        />
        <h4>Hello, {user.name}!</h4>
        <p>How are you feeling today?</p>
        <p className="text-muted">Student Dashboard</p>
      </div>

      {/* Mood Entry Form */}
      <div className="mood-entry-form">
        {hasSubmittedToday ? (
          <div className="already-submitted">
            <FaCheck className="text-success" />
            <span>You've already submitted your mood today</span>
            <p className="text-muted">Come back tomorrow!</p>
          </div>
        ) : (
          <>
            <h5 className="mood-entry-title">Rate your current mood</h5>
            <div className="mood-options">
              {[1, 2, 3, 4, 5].map((rating) => {
                const icons = [
                  <FaFaceSadCry size={24} />,
                  <FaFaceSadTear size={24} />,
                  <FaFaceMeh size={24} />,
                  <FaFaceSmile size={24} />,
                  <FaFaceGrinHearts size={24} />,
                ];
                return (
                  <button
                    key={rating}
                    className={`mood-option ${
                      moodRating === rating ? "selected" : ""
                    }`}
                    onClick={() => setMoodRating(rating)}
                    aria-label={`Mood level ${rating}`}
                  >
                    {icons[rating - 1]}
                  </button>
                );
              })}
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
