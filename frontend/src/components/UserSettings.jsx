import { useState } from "react";
import ChangePassword from "./ChangePassword";
import "../styles/UserSettings.css";

const UserSettings = () => {
  const [activeTab, setActiveTab] = useState("password");

  return (
    <div className="user-settings-container">
      <div className="user-settings-header">
        <h2>Account Settings</h2>
      </div>

      <div className="user-settings-tabs">
        <button
          className={`settings-tab ${activeTab === "password" ? "active" : ""}`}
          onClick={() => setActiveTab("password")}
        >
          Change Password
        </button>
        <button
          className={`settings-tab ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          Profile Information
        </button>
      </div>

      <div className="settings-content">
        {activeTab === "password" && <ChangePassword />}
        {activeTab === "profile" && (
          <div className="profile-info">
            <p>Profile settings will be implemented in a future update.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSettings;
