import React from "react";

import "../styles/SidePanel.css";

// Icons
import { FaComments, FaBalanceScale } from "react-icons/fa";

const SidePanel = ({ user, activeModule, setActiveModule }) => {
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
          <button
            className={`nav-button ${activeModule === "forum" ? "active" : ""}`}
            onClick={() => setActiveModule("forum")}
          >
            <FaComments /> Discussion Forum
          </button>
          <button
            className={`nav-button ${activeModule === "posts" ? "active" : ""}`}
            onClick={() => setActiveModule("posts")}
          >
            <FaBalanceScale /> Approve Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
