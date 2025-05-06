import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Modal, Button, Spinner } from "react-bootstrap";

// Student module components
import SidePanel from "./component/SidePanel";
import Journal from "./component/Journal";
import MoodTracker from "./component/MoodTracker";
import ResourceLibrary from "./component/ResourceLibrary";
import PrivacyConsentSection from "./component/ConsentSection";
import EmergencyContact from "./component/EmergencyContact";
import Quiz from "./component/Quiz";
import GoalTracker from "./component/GoalTracker";

// Forum Post Components
import CreatePostForm from "../../component/ForumPosts/CreatePostForm";
import PostList from "../../component/ForumPosts/PostList";

// CSS
import "./styles/StudentModule.css";

const StudentDashboard = () => {
  const user = JSON.parse(localStorage.getItem("userData"));

  const [activeModule, setActiveModule] = useState("forum");
  const [refreshPosts, setRefreshPosts] = useState(false);

  const [quote, setQuote] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const navigate = useNavigate();
  const [showAssessmentPrompt, setShowAssessmentPrompt] = useState(false);
  const [loading, setLoading] = useState(true);

  const handlePostCreated = () => setRefreshPosts((prev) => !prev);

  const renderMainContent = () => {
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
    const fetchQuote = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:3000/api/quotes", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (Array.isArray(response.data) && response.data.length > 0) {
          setQuote(response.data[0]);
          setShowQuoteModal(true);
        }
      } catch (err) {
        console.error("Error fetching quote:", err);
      }
    };

    fetchQuote();
  }, []);

  useEffect(() => {
    const checkOrCreateAssessment = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("userData"));
        const token = user.token;

        // First try to get existing assessment
        try {
          const res = await axios.get(
            "http://localhost:3000/api/initialAssessment/getInitialAssessment",
            { headers: { Authorization: `Bearer ${token}` } }
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
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowAssessmentPrompt(true);
          } else {
            throw getError;
          }
        }
      } catch (err) {
        console.error("Assessment error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkOrCreateAssessment();
  }, []);

  const handleAssessmentResponse = (takeAssessment) => {
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
        onHide={() => setShowQuoteModal(false)}
        centered
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
            <p>Loading quote...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowQuoteModal(false)}>
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
        <Modal.Header closeButton>
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
            variant="outline-secondary"
            onClick={() => handleAssessmentResponse(false)}
          >
            I'll Do It Later
          </Button>
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
