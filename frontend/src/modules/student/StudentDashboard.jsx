import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Modal, Button, Spinner, Alert } from "react-bootstrap";

// Student module components
import SidePanel from "./component/SidePanel";
import Journal from "./component/Journal";
import MoodTracker from "./component/MoodTracker";
import ResourceLibrary from "./component/ResourceLibrary";
import PrivacyConsentSection from "./component/ConsentSection";
import EmergencyContact from "./component/EmergencyContact";
import Quiz from "./component/Quiz";
import GoalTracker from "./component/GoalTracker";
import UserSettings from "../../component/UserSettings";

// Forum Post Components
import CreatePostForm from "../../component/ForumPosts/CreatePostForm";
import PostList from "../../component/ForumPosts/PostList";

// Messaging Component
import MessagingContainer from "../../component/Messaging/MessagingContainer";

// CSS
import "./styles/StudentModule.css";

const StudentDashboard = () => {
  // Get user data safely
  const getUserData = () => {
    try {
      const userData = localStorage.getItem("userData");
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.error("Error parsing user data:", e);
      return null;
    }
  };

  const user = getUserData();
  const isAuthenticated = user && user.token;

  const [activeModule, setActiveModule] = useState("forum");
  const [refreshPosts, setRefreshPosts] = useState(false);
  const [quote, setQuote] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

  const navigate = useNavigate();
  const [showAssessmentPrompt, setShowAssessmentPrompt] = useState(false);
  const [loading, setLoading] = useState(true);

  const handlePostCreated = () => setRefreshPosts((prev) => !prev);

  const renderMainContent = () => {
    if (!isAuthenticated) {
      return (
        <Alert variant="danger">
          <Alert.Heading>Authentication Error</Alert.Heading>
          <p>Unable to load dashboard. Please try logging in again.</p>
          <Button variant="primary" onClick={() => navigate("/login")}>
            Go to Login
          </Button>
        </Alert>
      );
    }

    if (dashboardError) {
      return (
        <Alert variant="warning">
          <Alert.Heading>Warning</Alert.Heading>
          <p>{dashboardError}</p>
        </Alert>
      );
    }

    switch (activeModule) {
      case "journal":
        return <Journal />;
      case "moodtracker":
        return <MoodTracker />;
      case "quiz":
        return <Quiz />;
      case "resources":
        return <ResourceLibrary />;
      case "consent":
        return <PrivacyConsentSection />;
      case "emergency":
        return <EmergencyContact />;
      case "goaltracker":
        return <GoalTracker />;
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

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const fetchQuote = async () => {
      // Check if quote has already been shown today
      const today = new Date().toDateString();
      const quoteShownToday = localStorage.getItem("quoteShownDate") === today;
      const firstLogin = localStorage.getItem("firstLoginDate");
      const isNewUser = !firstLogin;

      // For a new user, always show a quote regardless of quoteShownToday
      if (!isNewUser && quoteShownToday) {
        return;
      }

      try {
        // If this is a first login, save the date
        if (isNewUser) {
          localStorage.setItem("firstLoginDate", today);
        }

        // Add cache busting to prevent multiple calls
        const cacheBuster = new Date().getTime();
        const response = await axios.get(
          `http://localhost:3000/api/quotes?t=${cacheBuster}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              "Cache-Control": "no-cache",
            },
          }
        );

        if (Array.isArray(response.data) && response.data.length > 0) {
          setQuote(response.data[0]);
          setShowQuoteModal(true);
        }
      } catch (err) {
        console.error("Error fetching quote:", err);
      }
    };

    fetchQuote();
  }, [isAuthenticated]);

  // Handler for when quote modal is closed
  const handleCloseQuoteModal = () => {
    setShowQuoteModal(false);
    // Mark quote as shown for today
    const today = new Date().toDateString();
    localStorage.setItem("quoteShownDate", today);
  };

  useEffect(() => {
    const checkOrCreateAssessment = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        // First try to get existing assessment
        try {
          const res = await axios.get(
            "http://localhost:3000/api/initialAssessment/getInitialAssessment",
            { headers: { Authorization: `Bearer ${user.token}` } }
          );

          // If exists but not completed
          if (!res.data.answers || Object.keys(res.data.answers).length === 0) {
            setShowAssessmentPrompt(true);
          }
        } catch (getError) {
          if (getError.response?.status === 404) {
            // If not exists, create one
            await axios.post(
              "http://localhost:3000/api/initialAssessment/createInitialAssessment",
              {},
              { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setShowAssessmentPrompt(true);
          } else {
            setDashboardError(
              "There was an error checking your assessment status. Some features may be limited."
            );
            console.error("Assessment fetch error:", getError);
          }
        }
      } catch (err) {
        console.error("Assessment error:", err);
        setDashboardError(
          "There was an error initializing your dashboard. Some features may be limited."
        );
      } finally {
        setLoading(false);
      }
    };

    checkOrCreateAssessment();
  }, [isAuthenticated, user]);

  const handleAssessmentResponse = (takeAssessment) => {
    // Always hide the modal
    setShowAssessmentPrompt(false);

    if (takeAssessment) {
      navigate("/student/initial-assessment");
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

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

      {/* Quote Modal */}
      <Modal
        show={showQuoteModal}
        onHide={handleCloseQuoteModal}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>✨ Daily Motivation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {quote ? (
            <>
              <p className="fs-5 fst-italic">"{quote.q}"</p>
              <p className="text-end fw-bold">- {quote.a}</p>
            </>
          ) : (
            <div className="text-center">
              <Spinner animation="border" />
              <p className="mt-2">Loading your daily motivation...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleCloseQuoteModal}>
            Let's Start the Day!
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Assessment Prompt Modal */}
      <Modal
        show={showAssessmentPrompt}
        onHide={() => handleAssessmentResponse(false)}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header>
          <Modal.Title>Welcome to Your Mental Health Journey</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            To provide you with the best support, we'd like you to complete a
            brief initial assessment.
          </p>
          <p>This will only take about 5-10 minutes.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => handleAssessmentResponse(true)}
          >
            Start Assessment Now
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StudentDashboard;
