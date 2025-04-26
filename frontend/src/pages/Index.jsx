import { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Index.css";

const Index = () => {
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const CORRECT_CODE = "TEST";

  const handleVerifyCode = () => {
    if (code === CORRECT_CODE) {
      navigate("/register");
    } else {
      setError("Incorrect code. Contact your admin.");
    }
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
        onHide={() => {
          setShowModal(false);
          setError("");
        }}
        backdrop="static"
        keyboard={false}
        centered
        className="access-modal"
      >
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title>🔒 Access Code Required</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Enter your access code:</Form.Label>
              <Form.Control
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                placeholder="Enter code"
                isInvalid={!!error}
                className="code-input"
              />
              {error && (
                <Alert variant="danger" className="error-alert">
                  {error}
                </Alert>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
            className="cancel-btn"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleVerifyCode}
            className="verify-btn"
          >
            Verify Code
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Index;
