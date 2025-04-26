import { useState } from "react";

// Student module components
import SidePanel from "./component/SidePanel";
import Journal from "./component/Journal";
import MoodTracker from "./component/MoodTracker";
import ResourceLibrary from "./component/ResourceLibrary";
import PrivacyConsentSection from "./component/ConsentSection";
import EmergencyContact from "./component/EmergencyContact";

// Forum Post Components
import CreatePostForm from "../../component/ForumPosts/CreatePostForm";
import PostList from "../../component/ForumPosts/PostList";

// CSS for student module
import "./styles/StudentModule.css";

const StudentDashboard = () => {
  const user = JSON.parse(localStorage.getItem("userData"));
  const [refreshPosts, setRefreshPosts] = useState(false);
  const [activeModule, setActiveModule] = useState("forum");

  const handlePostCreated = () => {
    setRefreshPosts((prev) => !prev);
  };

  const renderMainContent = () => {
    switch (activeModule) {
      case "journal":
        return <Journal />;
      case "moodtracker":
        return <MoodTracker />;
      case "resources":
        return <ResourceLibrary />;
      case "consent":
        return <PrivacyConsentSection />;
      case "emergency":
        return <EmergencyContact />;
      case "forum":
      default:
        return (
          <>
            <CreatePostForm onPostCreated={handlePostCreated} />
            <PostList key={refreshPosts} />
          </>
        );
    }
  };

  return (
    <div className="student-dashboard container">
      <div className="row">
        <div className="col-lg-3 side-panel-container">
          <SidePanel
            user={user}
            activeModule={activeModule}
            setActiveModule={setActiveModule}
          />
        </div>

        <div className="col-lg-9">
          <div className="main-content-container">{renderMainContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
