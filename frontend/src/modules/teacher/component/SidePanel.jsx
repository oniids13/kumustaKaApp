import React, { useState, useEffect } from "react";

import "../styles/SidePanel.css";
import { Badge } from "react-bootstrap";
import {
  setupNotificationChecks,
  refreshNotifications,
} from "../../../utils/notificationUtils";

// Icons
import {
  FaComments,
  FaBalanceScale,
  FaChartLine,
  FaFileAlt,
  FaEnvelope,
  FaCog,
} from "react-icons/fa";

const SidePanel = ({ user, activeModule, setActiveModule }) => {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingPosts, setPendingPosts] = useState(0);

  // Set up notification checking
  useEffect(() => {
    // Set up notification checks
    const cleanup = setupNotificationChecks(
      setUnreadMessages,
      setPendingPosts,
      "TEACHER",
    );
    return cleanup;
  }, []);

  // Navigation Buttons
  const renderNavButton = (module, icon, label, count) => (
    <button
      className={`nav-button ${activeModule === module ? "active" : ""}`}
      onClick={() => {
        setActiveModule(module);
        // Refresh notifications after a short delay when navigating to messaging or posts
        // This allows time for the content to be marked as read/viewed
        if (module === "messaging" || module === "posts") {
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
    <div className="side-panel">
      <div className="user-info">
        <p className="user-role">Teacher Dashboard</p>
        <img
          src={user.avatar || "/default-avatar.png"}
          alt={`${user.name}'s avatar`}
          className="rounded-circle mb-3"
        />
        <h5 className="user-name">Hello, {user?.name || "Teacher"}!</h5>
        <p>
          Thank you for being a pillar of support in our students' mental health
          journey. Your guidance makes a difference! 🌟
        </p>
      </div>

      <div className="navigation">
        <div className="nav-item">
          {renderNavButton("forum", <FaComments />, "Discussion Forum")}
          {renderNavButton(
            "messaging",
            <FaEnvelope />,
            "Messages",
            unreadMessages,
          )}
          {renderNavButton(
            "posts",
            <FaBalanceScale />,
            "Approve Post",
            pendingPosts,
          )}
          {renderNavButton("trends", <FaChartLine />, "View Trends")}
          {renderNavButton("reports", <FaFileAlt />, "Generate Report")}
          {renderNavButton("settings", <FaCog />, "Settings")}
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
