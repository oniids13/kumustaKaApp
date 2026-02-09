import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import axios from "axios";
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
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");

  useEffect(() => {
    // Check if we're on the analytics page
    if (location.pathname === "/counselor/analytics") {
      setActiveModule("analytics");
    }
  }, [location]);

  // Fetch counselor's assigned sections on mount
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/counselor/my-sections",
          {
            headers: { Authorization: `Bearer ${user?.token}` },
          }
        );
        if (response.data?.sections) {
          setSections(response.data.sections);
        }
      } catch (err) {
        console.error("Error fetching counselor sections:", err);
      }
    };
    fetchSections();
  }, []);

  const handlePostCreated = () => setRefreshPosts((prev) => !prev);

  // Modules where the section filter should be visible
  const showSectionFilter = ["dashboard", "analytics", "interventions", "forum"].includes(activeModule);

  const renderMainContent = () => {
    switch (activeModule) {
      case "dashboard":
        return (
          <>
            <DailySubmissions sectionId={selectedSection} />
            <MentalHealthOverview sectionId={selectedSection} />
          </>
        );
      case "analytics":
        return (
          <StudentAnalytics
            initialStudentId={studentId}
            sectionId={selectedSection}
          />
        );
      case "interventions":
        return <InterventionPlans sectionId={selectedSection} />;
      case "reports":
        return <Reports />;
      case "messaging":
        return <MessagingContainer />;
      case "forum":
        return (
          <>
            <CreatePostForm
              onPostCreated={handlePostCreated}
              sectionId={selectedSection}
            />
            <PostList key={`${refreshPosts}-${selectedSection}`} sectionId={selectedSection} />
          </>
        );
      case "settings":
        return <UserSettings />;
      case "history":
        return <InterventionHistory />;
      default:
        return (
          <>
            <DailySubmissions sectionId={selectedSection} />
            <MentalHealthOverview sectionId={selectedSection} />
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
          <div className="main-content-container">
            {showSectionFilter && sections.length > 0 && (
              <div className="section-filter-bar">
                <div className="section-filter-label">
                  <i className="bi bi-funnel"></i> Filter by Section:
                </div>
                <select
                  className="section-filter-select"
                  value={selectedSection || ""}
                  onChange={(e) =>
                    setSelectedSection(e.target.value || null)
                  }
                >
                  <option value="">All Sections</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                      {section.gradeLevel ? ` (${section.gradeLevel})` : ""}
                      {` - ${section.studentCount} students`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {renderMainContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounselorDashboard;
