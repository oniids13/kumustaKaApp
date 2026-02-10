import { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { CONSENT_TEXT, CONSENT_SUMMARY } from "../data/consentText";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Index.css";

const Index = () => {
  const [showModal, setShowModal] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
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
    <div className="home-page">
      {/* Full-screen background image */}
      <div className="home-bg">
        <img
          src="/images/homeBg.jpg"
          alt="Kumusta Ka - Wellness illustration"
          className="home-bg-img"
        />
      </div>

      {/* Content overlay */}
      <div className="home-overlay">
        {/* Branding area - top left */}
        <div className="home-branding">
          <div className="home-logo">
            <img
              src="/images/kumustaKaLogo.png"
              alt="KumustaKa Logo"
              className="home-logo-img"
            />
            <span className="home-logo-text">KumustaKa</span>
          </div>
          <h1 className="home-heading">
            Your safe space for<br />
            mental wellness.
          </h1>
          <p className="home-subtext">
            Supporting students, teachers, and counselors — 
            because mental health matters for everyone.
          </p>
        </div>

        {/* Action area - bottom center */}
        <div className="home-actions">
          <button className="home-login-btn" onClick={() => navigate("/login")}>
            Log In
          </button>
          <div className="home-links">
            <button
              className="home-link-btn"
              onClick={() => setShowModal(true)}
            >
              Sign Up
            </button>
            <span className="home-link-separator">|</span>
            <button
              className="home-link-btn"
              onClick={() => setShowLearnMore(true)}
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Consent Modal */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        backdrop="static"
        keyboard={false}
        centered
        className="consent-modal"
        size="lg"
      >
        <Modal.Header closeButton className="consent-modal-header">
          <Modal.Title className="consent-modal-title">
            <i className="bi bi-clipboard-check"></i> Informed Consent
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="consent-modal-body">
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
                <Alert variant="warning" className="consent-error-alert">
                  {error}
                </Alert>
              )}
            </Form>
          </div>
        </Modal.Body>
        <Modal.Footer className="consent-modal-footer">
          <Button
            variant="secondary"
            onClick={handleCloseModal}
            className="consent-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAcceptConsent}
            className={`consent-accept-btn ${!consentAccepted ? "disabled" : ""}`}
            disabled={!consentAccepted}
          >
            I Accept & Continue
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Learn More Modal */}
      <Modal
        show={showLearnMore}
        onHide={() => setShowLearnMore(false)}
        centered
        className="learn-more-modal"
        size="lg"
      >
        <Modal.Header closeButton className="learn-more-modal-header">
          <Modal.Title className="learn-more-modal-title">
            <img
              src="/images/kumustaKaLogo.png"
              alt="KumustaKa Logo"
              className="learn-more-logo"
            />
            About KumustaKa
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="learn-more-modal-body">
          <div className="learn-more-content">
            <h5 className="learn-more-tagline">Mental health matters.</h5>
            <p>
              <strong>KumustaKa</strong> is a school-based mental wellness platform
              designed to help students, teachers, and guidance counselors work together
              to support student well-being.
            </p>

            <div className="learn-more-features">
              <div className="learn-more-feature">
                <div className="learn-more-feature-icon">
                  <i className="bi bi-emoji-smile"></i>
                </div>
                <div>
                  <h6>For Students</h6>
                  <p>
                    Track your daily mood, complete wellness check-ins, journal your
                    thoughts, and connect with your school community through a safe,
                    anonymous forum.
                  </p>
                </div>
              </div>

              <div className="learn-more-feature">
                <div className="learn-more-feature-icon">
                  <i className="bi bi-person-workspace"></i>
                </div>
                <div>
                  <h6>For Teachers</h6>
                  <p>
                    Monitor the general mental health status of your section, identify
                    students who may need extra support, and stay informed with
                    easy-to-read analytics.
                  </p>
                </div>
              </div>

              <div className="learn-more-feature">
                <div className="learn-more-feature-icon">
                  <i className="bi bi-heart-pulse"></i>
                </div>
                <div>
                  <h6>For Counselors</h6>
                  <p>
                    Access comprehensive mental health reports across sections, create
                    intervention plans, track DASS-21 assessments, and receive
                    data-driven insights to guide your support strategies.
                  </p>
                </div>
              </div>
            </div>

            <div className="learn-more-note">
              <i className="bi bi-shield-check"></i>
              <p>
                All data is kept confidential and secure. Student identities are
                protected, and only authorized personnel can access individual records.
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="learn-more-modal-footer">
          <Button
            className="learn-more-close-btn"
            onClick={() => setShowLearnMore(false)}
          >
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Index;
