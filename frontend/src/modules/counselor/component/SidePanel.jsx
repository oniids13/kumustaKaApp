import React, { useState, useEffect } from "react";
import {
  FaChartLine,
  FaUserMd,
  FaClipboardList,
  FaComments,
  FaHistory,
  FaTachometerAlt,
  FaEnvelope,
  FaCog,
} from "react-icons/fa";
import "../styles/SidePanel.css";
import { Badge } from "react-bootstrap";
import {
  setupNotificationChecks,
  refreshNotifications,
} from "../../../utils/notificationUtils";

const SidePanel = ({ user, activeModule, setActiveModule }) => {
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Set up notification checking
  useEffect(() => {
    // Set up notification checks
    const cleanup = setupNotificationChecks(
      setUnreadMessages,
      null,
      "COUNSELOR",
    );
    return cleanup;
  }, []);

  // Navigation Buttons
  const renderNavButton = (module, icon, label, count) => (
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
        {renderNavButton(
          "dashboard",
          <FaTachometerAlt />,
          "Mental Health Overview",
        )}
        {renderNavButton("analytics", <FaChartLine />, "Student Analytics")}
        {renderNavButton("interventions", <FaUserMd />, "Intervention Plans")}
        {renderNavButton("reports", <FaClipboardList />, "Reports")}
        {renderNavButton(
          "messaging",
          <FaEnvelope />,
          "Messages",
          unreadMessages,
        )}
        {renderNavButton("forum", <FaComments />, "Community Forum")}
        {renderNavButton("history", <FaHistory />, "Intervention History")}
        {renderNavButton("settings", <FaCog />, "Settings")}
      </div>
    </>
  );
};

export default SidePanel;
