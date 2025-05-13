import React from "react";
import {
  FaUsers,
  FaCog,
  FaShieldAlt,
  FaTachometerAlt,
  FaDatabase,
  FaUsersCog,
} from "react-icons/fa";
import "../styles/SidePanel.css";

const SidePanel = ({ user, activeModule, setActiveModule }) => {
  return (
    <>
      <div className="profile-card p-3 rounded">
        <p className="text-muted">Admin Dashboard</p>
        <img
          src={user.avatar || "/default-avatar.png"}
          alt={`${user.name}'s avatar`}
          className="rounded-circle mb-3"
        />
        <h4>Hello, {user.name}!</h4>
        <p>System Administrator</p>
      </div>

      {/* Navigation Buttons */}
      <div className="navigation-buttons">
        <button
          className={`nav-button ${
            activeModule === "dashboard" ? "active" : ""
          }`}
          onClick={() => setActiveModule("dashboard")}
        >
          <FaTachometerAlt /> Dashboard Overview
        </button>
        <button
          className={`nav-button ${activeModule === "users" ? "active" : ""}`}
          onClick={() => setActiveModule("users")}
        >
          <FaUsers /> User Management
        </button>
        <button
          className={`nav-button ${activeModule === "roles" ? "active" : ""}`}
          onClick={() => setActiveModule("roles")}
        >
          <FaUsersCog /> Role Management
        </button>
        <button
          className={`nav-button ${activeModule === "config" ? "active" : ""}`}
          onClick={() => setActiveModule("config")}
        >
          <FaCog /> System Configuration
        </button>
        <button
          className={`nav-button ${activeModule === "privacy" ? "active" : ""}`}
          onClick={() => setActiveModule("privacy")}
        >
          <FaShieldAlt /> Privacy Settings
        </button>
        <button
          className={`nav-button ${
            activeModule === "compliance" ? "active" : ""
          }`}
          onClick={() => setActiveModule("compliance")}
        >
          <FaDatabase /> Compliance Monitoring
        </button>
      </div>
    </>
  );
};

export default SidePanel;
