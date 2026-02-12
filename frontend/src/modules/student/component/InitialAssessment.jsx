import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Form, ProgressBar, Alert, Spinner, Button } from "react-bootstrap";
import { message } from "antd";
import "../styles/InitialAssessment.css";

const InitialAssessmentPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("userData"));
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const defaultScaleOptions = [
    { value: 0, label: "Did not apply to me at all" },
    { value: 1, label: "Applied to me to some degree, or some of the time" },
    {
      value: 2,
      label: "Applied to me to a considerable degree, or a good part of time",
    },
    { value: 3, label: "Applied to me very much, or most of the time" },
  ];

  useEffect(() => {
    const loadAssessment = async () => {
      try {
        const res = await axios.get(
          "http://localhost:3000/api/initialAssessment/getInitialAssessment",
          { headers: { Authorization: `Bearer ${user.token}` } },
        );
        if (res.data?.assessmentData) {
          setAssessment(res.data);
        } else {
          throw new Error("Invalid assessment data structure");
        }
      } catch (err) {
        console.error("Error fetching assessment:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load assessment. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };
    loadAssessment();
  }, [user.token]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: Number(value) }));
    if (validationError) {
      setValidationError(null);
    }
  };

  const getAllQuestions = () => {
    return (
      assessment?.assessmentData?.sections?.flatMap((section) =>
        section?.questions?.map((q) => ({
          ...q,
          category: section.category,
          scaleOptions: q.scale?.options || defaultScaleOptions,
        })),
      ) || []
    );
  };

  const getUnansweredQuestions = () => {
    const allQuestions = getAllQuestions();
    return allQuestions.filter((q) => answers[q.id] === undefined);
  };

  const validateForm = () => {
    const unanswered = getUnansweredQuestions();
    if (unanswered.length > 0) {
      const unansweredCount = unanswered.length;
      setValidationError(
        `Please answer all questions before submitting. You have ${unansweredCount} unanswered question${
          unansweredCount > 1 ? "s" : ""
        }.`,
      );
      setAttemptedSubmit(true);
      const firstUnansweredId = unanswered[0].id;
      const element = document.querySelector(
        `[name="question-${firstUnansweredId}"]`,
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await axios.post(
        "http://localhost:3000/api/initialAssessment/submitInitialAssessment",
        { answers },
        { headers: { Authorization: `Bearer ${user.token}` } },
      );

      message.success("Assessment submitted successfully!");
      setTimeout(() => navigate("/student"), 800);
    } catch (err) {
      console.error("Error submitting assessment:", err);
      setError("Submission failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const allQuestions = getAllQuestions();
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = allQuestions.length;
  const progress =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const isComplete = answeredCount === totalQuestions && totalQuestions > 0;

  const isQuestionUnanswered = (questionId) => {
    return attemptedSubmit && answers[questionId] === undefined;
  };

  return (
    <>
      {/* Fixed Progress Bar - Outside container for proper fixed positioning */}
      <div className="assessment-progress-bar">
        <div className="progress-content">
          <div className="progress-header">
            <span className="progress-text">
              Progress: {answeredCount} of {totalQuestions} questions answered
            </span>
            <span
              className={`progress-percentage ${
                isComplete ? "complete" : "incomplete"
              }`}
            >
              {progress}%
            </span>
          </div>
          <ProgressBar
            now={progress}
            variant={isComplete ? "success" : "primary"}
          />
          {!isComplete ? (
            <div className="progress-status remaining">
              {totalQuestions - answeredCount} question
              {totalQuestions - answeredCount !== 1 ? "s" : ""} remaining
            </div>
          ) : (
            <div className="progress-status complete">
              All questions answered. Ready to submit!
            </div>
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className="assessment-spacer"></div>

      {/* Main Content */}
      <div className="assessment-page">
        <div className="container">
          <div className="assessment-intro">
            <h2>Initial Mental Health Assessment</h2>
            <p>
              Hi! This is a short questionnaire with 21 questions about your{" "}
              <strong>feelings and thoughts during the past week</strong>. There
              are no right or wrong answers — it's simply about how you've been
              feeling.
            </p>
            <p>
              For each question, choose the answer that best shows how much the
              statement applied to you:
            </p>
            <ul>
              <li>0 = Did not apply to me at all</li>
              <li>1 = Applied to me to some degree, or some of the time</li>
              <li>
                2 = Applied to me to a considerable degree, or a good part of
                time
              </li>
              <li>3 = Applied to me very much, or most of the time</li>
            </ul>
            <p className="mt-3 mb-0">
              <strong>Please:</strong> Be honest, don't overthink, and remember
              your answers are private.
            </p>
          </div>

          {validationError && (
            <Alert
              variant="danger"
              className="mb-4"
              dismissible
              onClose={() => setValidationError(null)}
            >
              {validationError}
            </Alert>
          )}

          {allQuestions.length === 0 ? (
            <Alert variant="warning">No assessment questions found.</Alert>
          ) : (
            <Form>
              {assessment.assessmentData.sections.map((section) => (
                <div key={section.category} className="mb-5">
                  <h4 className="mb-3 text-primary">{section.category}</h4>
                  {section.questions.map((q, idx) => {
                    const options = q.scale?.options || defaultScaleOptions;
                    const unanswered = isQuestionUnanswered(q.id);
                    return (
                      <Form.Group
                        key={q.id}
                        className={`mb-4 p-3 border rounded ${
                          unanswered
                            ? "border-danger bg-danger bg-opacity-10"
                            : ""
                        }`}
                      >
                        <Form.Label className="fw-bold d-block">
                          {idx + 1}. {q.question}
                          {unanswered && (
                            <span className="text-danger ms-2">(Required)</span>
                          )}
                        </Form.Label>
                        <div className="mt-2">
                          {options.map((option) => (
                            <Form.Check
                              inline
                              key={option.value}
                              type="radio"
                              label={`${option.value} - ${option.label}`}
                              name={`question-${q.id}`}
                              checked={answers[q.id] === option.value}
                              onChange={() =>
                                handleAnswerChange(q.id, option.value)
                              }
                              className="py-1"
                            />
                          ))}
                        </div>
                      </Form.Group>
                    );
                  })}
                </div>
              ))}
            </Form>
          )}

          <div className="d-flex justify-content-end mt-4 mb-5">
            <Button
              variant={isComplete ? "success" : "primary"}
              size="lg"
              onClick={handleSubmit}
              disabled={allQuestions.length === 0}
            >
              {isComplete ? "Submit Assessment" : "Submit Assessment"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default InitialAssessmentPage;
