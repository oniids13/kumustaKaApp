import { useState, useEffect } from "react";
import { Form, Button, Card, Alert, Spinner } from "react-bootstrap";
import axios from "axios";

const RecordMood = () => {
  const [currentMood, setCurrentMood] = useState(3);
  const [currentMoodNote, setCurrentMoodNote] = useState("");
  const [submittingMood, setSubmittingMood] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);
  const [isForceSubmit, setIsForceSubmit] = useState(false);

  const user = JSON.parse(localStorage.getItem("userData"));

  const checkTodaySubmission = async (forceCheck = false) => {
    try {
      setLoading(true);

      // Include client-side time information in the request
      const clientTime = new Date();
      const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const response = await axios.get(
        `http://localhost:3000/api/moodEntry/checkToday${
          forceCheck ? "?forceCheck=true" : ""
        }`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "X-Client-Time": clientTime.toISOString(),
            "X-Client-Timezone": clientTimezone,
          },
        }
      );

      console.log("Server response:", response.data);
      setDebugInfo(response.data);

      if (response.data.hasSubmitted) {
        setAlreadySubmitted(true);
      } else {
        // Reset the flag if server says we haven't submitted
        setAlreadySubmitted(false);

        // If we're coming from a force check, flag this as a force submit
        if (forceCheck) {
          setIsForceSubmit(true);
        }
      }
    } catch (err) {
      console.error("Error checking today's submission:", err);
      setError("Could not verify if you've already recorded your mood today.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkTodaySubmission();
  }, []);

  const handleSubmitMood = async () => {
    try {
      setSubmittingMood(true);
      setError(null);

      console.log("[DEBUG] Starting mood submission with level:", currentMood);

      await axios.post(
        "http://localhost:3000/api/moodEntry/newMoodEntry",
        {
          moodLevel: currentMood,
          notes: currentMoodNote,
          forceCreate: isForceSubmit, // Use force create if needed
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("[DEBUG] Successfully submitted mood entry");
      setSuccess(true);
      setAlreadySubmitted(true);
      setCurrentMoodNote("");
    } catch (err) {
      console.error("[ERROR] Error submitting mood:", err);
      if (err.response?.data?.error?.includes("already submitted")) {
        setAlreadySubmitted(true);
      } else {
        setError("Failed to save your mood. Please try again.");
      }
    } finally {
      setSubmittingMood(false);
      setIsForceSubmit(false); // Reset after use
    }
  };

  // Reset the incorrect "already submitted" status
  const handleForceReset = () => {
    checkTodaySubmission(true);
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" />
        <p className="mt-2">Checking today's mood record...</p>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <Alert variant="info">
        <Alert.Heading>Mood Already Recorded</Alert.Heading>
        <p>You've already recorded your mood for today. Come back tomorrow!</p>

        {/* Debug information and reset option */}
        <div className="mt-3 border-top pt-2">
          <small className="text-muted">
            <p>Debug Information:</p>
            <pre style={{ fontSize: "0.8rem" }}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
            <p>Current browser time: {new Date().toISOString()}</p>
            <p>
              Local timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </p>
          </small>
          <Button
            variant="outline-warning"
            size="sm"
            onClick={handleForceReset}
            className="mt-2"
          >
            Override and Record Mood Anyway
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Header as="h5">
        {isForceSubmit
          ? "Record Today's Mood (Override Mode)"
          : "Record Today's Mood"}
      </Card.Header>
      <Card.Body>
        {success && (
          <Alert variant="success" className="mb-3">
            Your mood has been recorded successfully!
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {isForceSubmit && (
          <Alert variant="warning" className="mb-3">
            You are in override mode. The system previously detected you already
            submitted today, but you've chosen to record a new mood anyway.
          </Alert>
        )}

        {/* Add debug info if available */}
        {debugInfo && (
          <Alert variant="light" className="mb-3 small">
            <details>
              <summary>Debug Info</summary>
              <pre style={{ fontSize: "0.8rem" }}>
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </Alert>
        )}

        <Form.Group className="mb-3">
          <Form.Label>
            <strong>How are you feeling today?</strong>
          </Form.Label>
          <div className="d-flex justify-content-between mb-2">
            <span>😢 Very Low</span>
            <span>😀 Excellent</span>
          </div>
          <Form.Range
            min={1}
            max={5}
            step={1}
            value={currentMood}
            onChange={(e) => setCurrentMood(parseInt(e.target.value))}
          />
          <div className="text-center mb-3">
            <span className="fs-3">
              {["😢", "😞", "😐", "🙂", "😀"][currentMood - 1]}
            </span>
          </div>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>
            <strong>Notes (optional)</strong>
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Add any notes about how you're feeling today..."
            value={currentMoodNote}
            onChange={(e) => setCurrentMoodNote(e.target.value)}
          />
        </Form.Group>

        <div className="text-center">
          <Button
            variant={isForceSubmit ? "warning" : "primary"}
            onClick={handleSubmitMood}
            disabled={submittingMood}
          >
            {submittingMood ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Saving...
              </>
            ) : (
              `${isForceSubmit ? "Override and Save" : "Save My Mood"}`
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default RecordMood;
