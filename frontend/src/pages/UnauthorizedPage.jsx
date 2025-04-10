import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  
  return (
    <div className="unauthorized-container">
      <h1>403 - Access Denied</h1>
      <p>
        You don't have permission to access this page as a <strong>{userData.role || 'guest'}</strong>.
      </p>
      <button 
        onClick={() => navigate(-1)} 
        className="btn btn-secondary me-2"
      >
        Go Back
      </button>
      <button 
        onClick={() => navigate(`/${userData.role || ''}`)} 
        className="btn btn-primary"
      >
        Go to My Dashboard
      </button>
    </div>
  );
};

export default UnauthorizedPage;