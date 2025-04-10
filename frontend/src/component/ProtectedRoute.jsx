import { Navigate, useOutletContext } from 'react-router-dom';
import UnauthorizedPage from '../pages/UnauthorizedPage';

const ProtectedRoute = ({ children, roles = [] }) => {
    const { token } = useOutletContext();
    const userData = JSON.parse(localStorage.getItem("userData")) || {};

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    
    const upperCaseRoles = roles.map(role => role.toUpperCase());
    
    if (upperCaseRoles.length > 0 && !upperCaseRoles.includes(userData.role)) {
        return <UnauthorizedPage />;
    }

    return children;
};

export default ProtectedRoute;