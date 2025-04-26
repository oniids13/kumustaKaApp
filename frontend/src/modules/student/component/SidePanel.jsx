import {
  FaComments,
  FaBook,
  FaChartLine,
  FaBookOpen,
  FaShieldAlt,
  FaAddressCard,
} from "react-icons/fa";

const SidePanel = ({ user, activeModule, setActiveModule }) => {
  return (
    <>
      <div className="profile-card mb-3">
        <img
          src={user.avatar || "/default-avatar.png"}
          alt={`${user.name}'s avatar`}
          className="rounded-circle mb-3"
        />
        <h4>Hello, {user.name}!</h4>
        <p>How are you feeling today?</p>
        <p className="text-muted">Student Dashboard</p>
      </div>

      <div className="d-flex flex-column">
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
