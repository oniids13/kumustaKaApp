import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Header.css";

const LogOutButton = ({ setToken }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await axios.post(
      "http://localhost:3000/api/logout",
      {},
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    localStorage.removeItem("userData");
    setToken(null);
    navigate("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="btn btn-outline-danger logout-btn"
    >
      <i className="bi bi-box-arrow-right me-2"></i>
      Log Out
    </button>
  );
};

export default LogOutButton;
