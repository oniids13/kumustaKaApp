import { useEffect, useState } from "react";
import { Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";

const DailySurveyAlert = () => {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  const checkSurveyStatus = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setError(true);
      return;
    }

    try {
      const response = await axios.get(
        "http://localhost:3000/api/survey/status",
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (response.data && response.data.data) {
        setCompleted(response.data.data.submitted);
      } else {
        console.warn(
          "Unexpected survey status response format:",
          response.data
        );
        setError(true);
      }
    } catch (error) {
      console.error("Error checking survey status:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSurveyStatus();
  }, []);

  if (loading) return null;

  if (error)
    return (
      <Alert variant="secondary" className="text-center mt-3" rounded shadow>
        <div className="d-flex justify-content-between align-items-center">
          <span>Unable to check daily survey status.</span>
        </div>
      </Alert>
    );

  if (completed)
    return (
      <Alert variant="warning" className="text-center mt-3" rounded shadow>
        <div className="d-flex justify-content-between align-items-center">
          <span>✔ Good Job! Daily mental health check completed today.</span>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={checkSurveyStatus}
            aria-label="Refresh survey status"
          >
            Refresh
          </Button>
        </div>
      </Alert>
    );

  return (
    <Alert variant="danger" className="text-center mt-3" rounded shadow>
      <div className="d-flex justify-content-between align-items-center">
        <span>📝 Complete your daily mental health check-in</span>
        <div>
          <Button
            variant="outline-secondary"
            size="sm"
            className="me-2 my-2"
            onClick={checkSurveyStatus}
            aria-label="Refresh survey status"
          >
            Refresh
          </Button>
          <Button as={Link} to="/daily-survey" variant="success" size="sm">
            Start Survey
          </Button>
        </div>
      </div>
    </Alert>
  );
};

export default DailySurveyAlert;
