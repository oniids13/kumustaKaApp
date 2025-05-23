import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import SidePanel from "./component/SidePanel";
import StudentAnalytics from "./component/StudentAnalytics";
import InterventionPlans from "./component/InterventionPlans";
import Reports from "./component/Reports";
import InterventionHistory from "./component/InterventionHistory";
import MentalHealthOverview from "./component/MentalHealthOverview";
import DailySubmissions from "./component/DailySubmissions";
import UserSettings from "../../component/UserSettings";

// CSS
import "./styles/CounselorDashboard.css";

// Community Forum Components
import CreatePostForm from "../../component/ForumPosts/CreatePostForm";
import PostList from "../../component/ForumPosts/PostList";

// Messaging Component
import MessagingContainer from "../../component/Messaging/MessagingContainer";

const CounselorDashboard = () => {
  const user = JSON.parse(localStorage.getItem("userData"));
  const [activeModule, setActiveModule] = useState("dashboard");
  const [refreshPosts, setRefreshPosts] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");

  useEffect(() => {
    // Check if we're on the analytics page
    if (location.pathname === "/counselor/analytics") {
      setActiveModule("analytics");
    }
  }, [location]);

  const handlePostCreated = () => setRefreshPosts((prev) => !prev);

  const renderMainContent = () => {
    switch (activeModule) {
      case "dashboard":
        return (
          <>
            <DailySubmissions />
            <MentalHealthOverview />
          </>
        );
      case "analytics":
        return <StudentAnalytics initialStudentId={studentId} />;
      case "interventions":
        return <InterventionPlans />;
      case "reports":
        return <Reports />;
      case "messaging":
        return <MessagingContainer />;
      case "forum":
        return (
          <>
            <CreatePostForm onPostCreated={handlePostCreated} />
            <PostList key={refreshPosts} />
          </>
        );
      case "settings":
        return <UserSettings />;
      case "history":
        return <InterventionHistory />;
      default:
        return (
          <>
            <DailySubmissions />
            <MentalHealthOverview />
          </>
        );
    }
  };

  return (
    <div className="counselor-dashboard container">
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

export default CounselorDashboard;
