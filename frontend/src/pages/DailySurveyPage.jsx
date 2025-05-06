// pages/DailySurveyPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Spinner, Alert } from "react-bootstrap";
import axios from "axios";

function DailySurveyPage() {
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  const user = JSON.parse(localStorage.getItem("userData"));

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        // First check if already completed today
        const statusRes = await axios.get(
          "http://localhost:3000/api/survey/status",
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        if (statusRes.data.data.submitted) {
          setAlreadyCompleted(true);
          return;
        }

        // Get survey questions
        const surveyRes = await axios.get(
          "http://localhost:3000/api/survey/daily",
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        setSurvey(surveyRes.data.data);
      } catch (error) {
        setError(error.response?.data?.error || "Failed to load survey");
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, []);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: parseInt(value),
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      await axios.post(
        "http://localhost:3000/api/survey/submit",
        { answers },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      alert("Survey submitted successfully!");
      navigate("/student", { state: { surveyCompleted: true } });
    } catch (error) {
      setError(error.response?.data?.error || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (alreadyCompleted) {
    return (
      <Container className="mt-5">
        <Alert variant="success">
          You've already completed today's survey. Come back tomorrow!
          <Button variant="link" onClick={() => navigate("/student")}>
            Return to Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <Card>
        <Card.Header>
          <h4>Daily Mental Health Check-In</h4>
        </Card.Header>
        <Card.Body>
          <div>
            <strong>Instruction:</strong>
            <p>
              Complete this short survey by selecting one option per question (1
              = Strongly Disagree, 5 = Strongly Agree) to share how you felt
              today. Answer honestly—there are no right or wrong responses. Once
              finished, click Submit to return to your dashboard.
            </p>
          </div>
          <Form>
            {survey?.questions.map((question) => (
              <Form.Group key={question.id} className="mb-4">
                <Form.Label>
                  <strong>{question.question}</strong>
                </Form.Label>
                <div>
                  {question.options.map((option) => (
                    <Form.Check
                      key={option.value}
                      type="radio"
                      label={`${option.value} - ${option.label}`}
                      name={`question-${question.id}`}
                      id={`question-${question.id}-${option.value}`}
                      checked={answers[question.id] === option.value}
                      onChange={() =>
                        handleAnswerChange(question.id, option.value)
                      }
                      className="mb-2"
                    />
                  ))}
                </div>
              </Form.Group>
            ))}
          </Form>

          {error && <Alert variant="danger">{error}</Alert>}

          <div className="d-flex justify-content-between mt-4">
            <Button
              variant="outline-secondary"
              onClick={() => navigate("/student")}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={
                submitting ||
                Object.keys(answers).length < survey.questions.length
              }
            >
              {submitting ? (
                <>
                  <Spinner as="span" size="sm" animation="border" />{" "}
                  Submitting...
                </>
              ) : (
                "Submit Survey"
              )}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default DailySurveyPage;
