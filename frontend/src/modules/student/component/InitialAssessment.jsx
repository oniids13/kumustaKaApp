import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Form, ProgressBar, Alert, Spinner, Button } from "react-bootstrap";

const InitialAssessmentPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("userData"));
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          { headers: { Authorization: `Bearer ${user.token}` } }
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
            "Failed to load assessment. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };
    loadAssessment();
  }, [user.token]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: Number(value) }));
  };

  const handleSubmit = async () => {
    try {
      await axios.post(
        "http://localhost:3000/api/initialAssessment/submitInitialAssessment",
        { answers },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      alert("Assessment submitted successfully!");
      navigate("/student");
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

  // Calculate progress
  const allQuestions =
    assessment?.assessmentData?.sections?.flatMap((section) =>
      section?.questions?.map((q) => ({
        ...q,
        category: section.category,
        scaleOptions: q.scale?.options || defaultScaleOptions,
      }))
    ) || [];

  const progress =
    allQuestions.length > 0
      ? Math.round(Object.keys(answers).length / allQuestions.length) * 100
      : 0;

  return (
    <div className="container py-4">
      <h2 className="mb-4">Initial Mental Health Assessment</h2>
      <p>
        Hi! This is a short questionnaire with 21 questions about your{" "}
        <strong>feelings and thoughts during the past week</strong>. There are
        no right or wrong answers — it’s simply about how you’ve been feeling.
      </p>
      <p>
        For each question, choose the answer that best shows how much the
        statement applied to you:
      </p>
      <p>
        <ul>
          <li>0 = Did not apply to me at all</li>
          <li>1 = Applied to me to some degree, or some of the time</li>
          <li>
            2 = Applied to me to a considerable degree, or a good part of time
          </li>
          <li>3 = Applied to me very much, or most of the time</li>
        </ul>
      </p>
      <p>
        Please:
        <ul>
          <li>
            Be honest about your answers — this helps us understand how you’re
            really feeling.
          </li>
          <li>
            Don’t spend too much time on each question; just pick the option
            that feels right for you.
          </li>
          <li>
            Remember, your answers are private and will only be used to help
            support your well-being.
          </li>
        </ul>
      </p>
      <ProgressBar now={progress} label={`${progress}%`} className="mb-4" />

      {allQuestions.length === 0 ? (
        <Alert variant="warning">No assessment questions found.</Alert>
      ) : (
        <Form>
          {assessment.assessmentData.sections.map((section) => (
            <div key={section.category} className="mb-5">
              <h4 className="mb-3">{section.category}</h4>
              {section.questions.map((q, idx) => {
                const options = q.scale?.options || defaultScaleOptions;
                return (
                  <Form.Group key={q.id} className="mb-4 p-3 border rounded">
                    <Form.Label className="fw-bold d-block">
                      {idx + 1}. {q.question}
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

      <div className="d-flex justify-content-end mt-4">
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={progress < 100 || allQuestions.length === 0}
        >
          {progress < 100 ? "Complete All Questions" : "Submit Assessment"}
        </Button>
      </div>
    </div>
  );
};

export default InitialAssessmentPage;
