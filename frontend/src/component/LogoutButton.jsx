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
      className="btn logout-btn"
      style={{
        background: 'transparent',
        border: '1.5px solid var(--kk-accent, #E07A5F)',
        color: 'var(--kk-accent, #E07A5F)',
        borderRadius: 'var(--kk-radius-full, 50px)',
        fontFamily: 'var(--kk-font-heading)',
        fontWeight: 700,
        fontSize: '0.82rem',
        padding: '0.4rem 1rem',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => { e.target.style.background = 'var(--kk-accent, #E07A5F)'; e.target.style.color = '#fff'; }}
      onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--kk-accent, #E07A5F)'; }}
    >
      <i className="bi bi-box-arrow-right me-1"></i>
      Log Out
    </button>
  );
};

export default LogOutButton;
