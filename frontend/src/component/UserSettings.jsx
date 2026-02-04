import { useState } from "react";
import ChangePassword from "./ChangePassword";
import ProfileInformation from "./ProfileInformation";
import "../styles/UserSettings.css";

const UserSettings = () => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="user-settings-container">
      <div className="user-settings-header">
        <h2>Account Settings</h2>
      </div>

      <div className="user-settings-tabs">
        <button
          className={`settings-tab ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          Profile Information
        </button>
        <button
          className={`settings-tab ${activeTab === "password" ? "active" : ""}`}
          onClick={() => setActiveTab("password")}
        >
          Change Password
        </button>
      </div>

      <div className="settings-content">
        {activeTab === "profile" && <ProfileInformation />}
        {activeTab === "password" && <ChangePassword />}
      </div>
    </div>
  );
};

export default UserSettings;
