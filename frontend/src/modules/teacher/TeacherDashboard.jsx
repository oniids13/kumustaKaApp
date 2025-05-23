import { useState } from "react";
// Teacher module components
import SidePanel from "./component/SidePanel";

// Forum Post Components
import CreatePostForm from "../../component/ForumPosts/CreatePostForm";
import PostList from "../../component/ForumPosts/PostList";

// Messaging Component
import MessagingContainer from "../../component/Messaging/MessagingContainer";

// User Settings Component
import UserSettings from "../../component/UserSettings";

// CSS
import "./styles/TeacherModule.css";

// Features
import PostApproval from "./component/PostApproval";
import TrendsView from "./component/TrendsView";
import ReportGenerator from "./component/ReportGenerator";

const TeacherDashboard = () => {
  const user = JSON.parse(localStorage.getItem("userData"));
  const [activeModule, setActiveModule] = useState("forum");
  const [refreshPosts, setRefreshPosts] = useState(false);

  const handlePostCreated = () => setRefreshPosts((prev) => !prev);

  const renderMainContent = () => {
    switch (activeModule) {
      case "posts":
        return <PostApproval />;
      case "trends":
        return <TrendsView />;
      case "reports":
        return <ReportGenerator />;
      case "messaging":
        return <MessagingContainer />;
      case "settings":
        return <UserSettings />;
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
    <div className="teacher-dashboard container">
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

export default TeacherDashboard;
