import { useState, useEffect } from "react";
import axios from "axios";
import {
  Modal,
  Button,
  Alert,
  Form,
  ProgressBar,
  Spinner,
} from "react-bootstrap";

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
  const API_BASE = "http://localhost:3000/api";

  const [activeModule, setActiveModule] = useState("forum");
  const [refreshPosts, setRefreshPosts] = useState(false);

  const [quote, setQuote] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentData, setAssessmentData] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showError, setShowError] = useState(null);
  const [loadingAssessment, setLoadingAssessment] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

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
      setLoadingAssessment(true);
      try {
        // Try to get existing assessment
        const res = await axios.get(
          `${API_BASE}/initialAssessment/getInitialAssessment`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );

        const assessment = res.data;
        const allQuestions = flattenQuestions(assessment.assessmentData);
        setAssessmentData(allQuestions);

        // Only show modal if no answers exist
        if (
          !assessment.answers ||
          Object.keys(assessment.answers).length === 0
        ) {
          setShowAssessmentModal(true);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          try {
            // Create new assessment
            const createRes = await axios.post(
              `${API_BASE}/initialAssessment/createInitialAssessment`,
              {},
              { headers: { Authorization: `Bearer ${user.token}` } }
            );

            const allQuestions = flattenQuestions(
              createRes.data.assessmentData
            );
            setAssessmentData(allQuestions);
            setShowAssessmentModal(true);
          } catch (createErr) {
            console.error("Creation failed:", createErr);
          }
        } else {
          console.error("Assessment error:", err);
        }
      } finally {
        setLoadingAssessment(false);
      }
    };

    // Helper function to flatten questions
    const flattenQuestions = (data) => {
      if (!data?.sections) return [];
      return data.sections.flatMap((section) =>
        section.questions.map((q) => ({
          ...q,
          category: section.category,
        }))
      );
    };

    checkOrCreateAssessment();
  }, []);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: Number(value), // Ensure numeric value
    }));
  };

  const handleSubmitAssessment = async () => {
    // Validation
    if (Object.keys(answers).length !== assessmentData.length) {
      alert("Please answer all questions before submitting");
      return;
    }

    setSubmitLoading(true);
    try {
      // No key conversion needed now (backend accepts original keys)
      await axios.post(
        `${API_BASE}/initialAssessment/submitInitialAssessment`,
        { answers }, // Sends original { D1: 2, A2: 1 } format
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      // Success handling
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitLoading(false);
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
      {showError && (
        <Alert variant="danger" className="mt-3">
          {showError}
        </Alert>
      )}
      <Modal
        show={showAssessmentModal}
        onHide={() => setShowAssessmentModal(false)}
        size="lg"
        centered
        scrollable
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            🧠 Initial Mental Health Assessment (DASS-21)
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <h5>DASS-21 Assessment</h5>
            <p className="text-muted">
              Please read each statement and select the option that indicates
              how much the statement applied to you over the past week.
            </p>

            <ProgressBar
              now={progress}
              label={`${progress}%`}
              className="mb-3"
              visuallyHidden={false}
            />
          </div>

          {assessmentData.length > 0 ? (
            <Form>
              {assessmentData.map((q, idx) => (
                <Form.Group key={q.id} className="mb-4">
                  <Form.Label className="fw-bold">
                    {idx + 1}. {q.question}
                  </Form.Label>
                  <div className="mt-2">
                    {[0, 1, 2, 3].map((value) => (
                      <Form.Check
                        key={value}
                        inline
                        type="radio"
                        id={`${q.id}-${value}`}
                        label={`${value} - ${
                          q.scale.options.find((o) => o.value === value)
                            ?.label || ""
                        }`}
                        name={`question-${q.id}`}
                        value={value}
                        checked={answers[q.id] === value}
                        onChange={(e) =>
                          handleAnswerChange(q.id, e.target.value)
                        }
                        className="py-1"
                      />
                    ))}
                  </div>
                </Form.Group>
              ))}
            </Form>
          ) : (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading assessment questions...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowAssessmentModal(false)}
          >
            I'll Complete This Later
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitAssessment}
            disabled={
              submitLoading ||
              Object.keys(answers).length !== assessmentData.length
            }
          >
            {submitLoading ? (
              <>
                <Spinner size="sm" animation="border" /> Submitting...
              </>
            ) : (
              "Submit Assessment"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StudentDashboard;
