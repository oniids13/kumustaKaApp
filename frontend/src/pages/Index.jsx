import { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const Index = () => {
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  
  const CORRECT_CODE = "TEST"; 

  const handleVerifyCode = () => {
    if (code === CORRECT_CODE) {
      navigate('/register');
    } else {
      setError('Incorrect code. Contact your admin.');
    }
  };

  return (
    <>
      <div className="d-flex flex-column justify-content-center align-items-center wrapper">
        <div className="border border-2 rounded-3 p-5 m-5 d-flex flex-column justify-content-center align-items-center bg-warning-subtle">
          <h1>Welcome to Kumusta Ka!</h1>
          <p>Your go-to app for mental health support.</p>
          <div className="d-flex flex-column justify-content-center align-items-center">
            <button className="btn btn-success" onClick={() => navigate('/login')}>Login</button>
            <span>or</span>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Register
            </Button>
          </div>
        </div>
      </div>

      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setError('');
        }}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Access Code Required</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Enter your access code:</Form.Label>
              <Form.Control
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError('');
                }}
                placeholder="Enter code"
                isInvalid={!!error}
              />
              {error && (
                <Alert variant="danger" className="mt-2">
                  {error}
                </Alert>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleVerifyCode}>
            Verify Code
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Index;