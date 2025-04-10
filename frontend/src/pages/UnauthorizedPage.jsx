// src/pages/UnauthorizedPage.jsx
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  
  const getDashboardPath = () => {
    switch(userData.role) {
      case 'STUDENT': return '/student';
      case 'COUNSELOR': return '/counselor';
      case 'TEACHER': return '/teacher';
      case 'ADMIN': return '/admin';
      default: return '/';
    }
  };

  return (
    <div className="unauthorized-container text-center mt-5">
      <h1 className="text-danger">403 - Access Denied</h1>
      <p className="lead">
        You don't have permission to access this page as a <strong>{userData.role || 'guest'}</strong>.
      </p>
      <div className="d-flex justify-content-center gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="btn btn-outline-secondary"
        >
          Go Back
        </button>
        <button 
          onClick={() => navigate(getDashboardPath())} 
          className="btn btn-primary"
        >
          Go to My Dashboard
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;