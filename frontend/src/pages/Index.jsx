import { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { CONSENT_TEXT, CONSENT_SUMMARY } from "../data/consentText";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Index.css";

const Index = () => {
  const [showModal, setShowModal] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleAcceptConsent = () => {
    if (consentAccepted) {
      navigate("/register");
    } else {
      setError("You must accept the consent form to proceed with registration.");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setConsentAccepted(false);
    setError("");
  };

  return (
    <div className="index-container">
      <div className="login-card">
        <div className="card-header">
          <h1 className="app-title">Welcome to Kumusta Ka!</h1>
          <p className="app-subtitle">Your mental wellness companion</p>
        </div>

        <div className="card-body">
          <div className="app-description">
            <p>
              Connect with support resources and track your mental health
              journey
            </p>
          </div>

          <div className="auth-buttons">
            <button className="login-btn" onClick={() => navigate("/login")}>
              Login
            </button>
            <div className="divider">
              <span>or</span>
            </div>
            <button className="register-btn" onClick={() => setShowModal(true)}>
              Register
            </button>
          </div>
        </div>
      </div>

      <Modal
        show={showModal}
        onHide={handleCloseModal}
        backdrop="static"
        keyboard={false}
        centered
        className="consent-modal"
        size="lg"
      >
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title>📋 Informed Consent</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          <div className="consent-content">
            <div className="consent-text-container">
              <pre className="consent-text">{CONSENT_TEXT}</pre>
            </div>
            
            <Form className="consent-form">
              <Form.Group className="consent-checkbox-group">
                <Form.Check
                  type="checkbox"
                  id="consent-checkbox"
                  checked={consentAccepted}
                  onChange={(e) => {
                    setConsentAccepted(e.target.checked);
                    setError("");
                  }}
                  label={CONSENT_SUMMARY}
                  className="consent-checkbox"
                />
              </Form.Group>
              
              {error && (
                <Alert variant="warning" className="error-alert">
                  {error}
                </Alert>
              )}
            </Form>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button
            variant="secondary"
            onClick={handleCloseModal}
            className="cancel-btn"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAcceptConsent}
            className={`accept-btn ${!consentAccepted ? 'disabled' : ''}`}
            disabled={!consentAccepted}
          >
            I Accept & Continue
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Index;
