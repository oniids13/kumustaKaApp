import { useEffect, useState } from "react";
import { Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";

const DailySurveyAlert = () => {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("userData"));

  useEffect(() => {
    const checkSurveyStatus = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/survey/status",
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        setCompleted(response.data.data.submitted);
      } catch (error) {
        console.error("Error checking survey status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSurveyStatus();
  }, []);

  if (loading) return null;
  if (completed)
    return (
      <Alert variant="warning" className="text-center mt-3" rounded shadow>
        <div className="d-flex justify-content-between align-items-center">
          <span>✔ Good Job! Daily mental health check completed today.</span>
        </div>
      </Alert>
    );

  return (
    <Alert variant="danger" className="text-center mt-3" rounded shadow>
      <div className="d-flex justify-content-between align-items-center">
        <span>📝 Complete your daily mental health check-in</span>
        <Button as={Link} to="/daily-survey" variant="outline-danger" size="sm">
          Start Survey
        </Button>
      </div>
    </Alert>
  );
};

export default DailySurveyAlert;
