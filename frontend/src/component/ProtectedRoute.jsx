import { useOutletContext } from "react-router-dom";
import UnauthorizedPage from "../pages/UnauthorizedPage";

import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, roles = [] }) => {
  const { token } = useOutletContext();
  const userData = JSON.parse(localStorage.getItem("userData")) || {};

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Convert input roles to uppercase for comparison
  const requiredRoles = roles.map((role) => role.toUpperCase());

  if (requiredRoles.length > 0 && !requiredRoles.includes(userData.role)) {
    return <UnauthorizedPage />;
  }

  return children;
};

export default ProtectedRoute;
