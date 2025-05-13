import React from "react";
import {
  FaChartLine,
  FaUserMd,
  FaClipboardList,
  FaComments,
  FaHistory,
  FaTachometerAlt,
  FaEnvelope,
} from "react-icons/fa";
import "../styles/SidePanel.css";

const SidePanel = ({ user, activeModule, setActiveModule }) => {
  return (
    <>
      <div className="profile-card p-3 rounded">
        <p className="text-muted">Counselor Dashboard</p>
        <img
          src={user.avatar || "/default-avatar.png"}
          alt={`${user.name}'s avatar`}
          className="rounded-circle mb-3"
        />
        <h4>Hello, {user.name}!</h4>
        <p>Guidance Counselor</p>
      </div>

      {/* Navigation Buttons */}
      <div className="navigation-buttons">
        <button
          className={`nav-button ${
            activeModule === "dashboard" ? "active" : ""
          }`}
          onClick={() => setActiveModule("dashboard")}
        >
          <FaTachometerAlt /> Mental Health Overview
        </button>
        <button
          className={`nav-button ${
            activeModule === "analytics" ? "active" : ""
          }`}
          onClick={() => setActiveModule("analytics")}
        >
          <FaChartLine /> Student Analytics
        </button>
        <button
          className={`nav-button ${
            activeModule === "interventions" ? "active" : ""
          }`}
          onClick={() => setActiveModule("interventions")}
        >
          <FaUserMd /> Intervention Plans
        </button>
        <button
          className={`nav-button ${activeModule === "reports" ? "active" : ""}`}
          onClick={() => setActiveModule("reports")}
        >
          <FaClipboardList /> Reports
        </button>
        <button
          className={`nav-button ${
            activeModule === "messaging" ? "active" : ""
          }`}
          onClick={() => setActiveModule("messaging")}
        >
          <FaEnvelope /> Messages
        </button>
        <button
          className={`nav-button ${activeModule === "forum" ? "active" : ""}`}
          onClick={() => setActiveModule("forum")}
        >
          <FaComments /> Community Forum
        </button>
        <button
          className={`nav-button ${activeModule === "history" ? "active" : ""}`}
          onClick={() => setActiveModule("history")}
        >
          <FaHistory /> Intervention History
        </button>
      </div>
    </>
  );
};

export default SidePanel;
