import { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Alert, Form } from "react-bootstrap";

// Student module components
import SidePanel from "./component/SidePanel";
import Journal from "./component/Journal";
import MoodTracker from "./component/MoodTracker";
import ResourceLibrary from "./component/ResourceLibrary";
import PrivacyConsentSection from "./component/ConsentSection";
import EmergencyContact from "./component/EmergencyContact";
import Quiz from "./component/Quiz";

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

  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentData, setAssessmentData] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

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
        const res = await axios.get(
          "http://localhost:3000/api/initialAssessment/getInitialAssessment",
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        const assessment = res.data;

        if (
          !assessment?.answers ||
          Object.keys(assessment.answers).length === 0
        ) {
          setAssessmentData(assessment.assessmentData || []);
          setShowAssessmentModal(true);
        }
      } catch (err) {
        if (
          err.response?.data?.message ===
          "Initial assessment not found for this student."
        ) {
          try {
            const createRes = await axios.post(
              "http://localhost:3000/api/initialAssessment/createInitialAssessment",
              {},
              {
                headers: { Authorization: `Bearer ${user.token}` },
              }
            );

            setAssessmentData(createRes.data.assessmentData || []);
            setShowAssessmentModal(true);
          } catch (createErr) {
            console.error("Failed to create assessment:", createErr);
          }
        } else {
          console.error("Failed to check assessment:", err);
        }
      }
    };

    checkOrCreateAssessment();
  }, []);

  const handleAnswerChange = (questionId, score) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }));
  };

  const handleSubmitAssessment = async () => {
    if (Object.keys(answers).length < assessmentData.length) {
      alert("Please answer all questions.");
      return;
    }

    // Grouping by categories
    const scores = { Depression: 0, Anxiety: 0, Stress: 0 };

    assessmentData.forEach((q) => {
      const response = parseInt(answers[q._id], 10);
      if (!isNaN(response)) {
        scores[q.category] += response;
      }
    });

    try {
      await axios.put(
        "http://localhost:3000/api/initialAssessment/updateInitialAssessment",
        {
          answers,
          scores,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      setShowAssessmentModal(false);
      setShowSuccess(true);
    } catch (err) {
      console.error("Failed to submit assessment:", err);
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

      {showSuccess && (
        <Alert variant="success" className="text-center mt-3">
          ✅ Initial assessment submitted successfully!
        </Alert>
      )}

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

      {/* Assessment Modal */}
      <Modal
        show={showAssessmentModal}
        onHide={() => setShowAssessmentModal(false)}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>🧠 Initial DASS-21 Mental Health Assessment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Please answer the following 21 questions honestly. Select the option
            that best describes your experience over the past week.
          </p>
          {assessmentData.length > 0 ? (
            assessmentData.map((q, idx) => (
              <Form.Group key={q._id} className="mb-4">
                <Form.Label>
                  {idx + 1}. {q.question}{" "}
                  <span className="text-muted">({q.category})</span>
                </Form.Label>
                <div>
                  {[0, 1, 2, 3].map((val) => (
                    <Form.Check
                      inline
                      key={val}
                      type="radio"
                      label={`${val}`}
                      name={`question-${q._id}`}
                      checked={answers[q._id] === val}
                      onChange={() => handleAnswerChange(q._id, val)}
                    />
                  ))}
                </div>
              </Form.Group>
            ))
          ) : (
            <p>Loading assessment...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowAssessmentModal(false)}
          >
            Cancel
          </Button>
          <Button variant="success" onClick={handleSubmitAssessment}>
            Submit Assessment
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StudentDashboard;
