import { useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import {
  FaSignInAlt,
  FaArrowLeft,
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import "../styles/Login.css";

const Login = () => {
  const { setToken } = useOutletContext();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setError("");
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:3000/api/login",
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const userData = {
        token: response.data.token,
        userId: response.data.user.id,
        name: response.data.user.fullName,
        role: response.data.user.role,
        avatar: response.data.user.avatar,
      };

      localStorage.setItem("userData", JSON.stringify(userData));
      setToken(response.data.token);

      switch (userData.role) {
        case "STUDENT":
          navigate("/student");
          break;
        case "COUNSELOR":
          navigate("/counselor");
          break;
        case "TEACHER":
          navigate("/teacher");
          break;
        case "ADMIN":
          navigate("/admin");
          break;
        default:
          navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.response?.data?.message || "Invalid Login Credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background */}
      <div className="login-bg">
        <img
          src="/images/homeBg.jpg"
          alt=""
          className="login-bg-img"
        />
        <div className="login-bg-overlay"></div>
      </div>

      {/* Login card */}
      <div className="login-card">
        <div className="login-card-header">
          <div className="login-brand">
            <img
              src="/images/kumustaKaLogo.png"
              alt="KumustaKa Logo"
              className="login-brand-logo"
            />
            <span className="login-brand-text">KumustaKa</span>
          </div>
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to continue your wellness journey</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="login-input-group">
            <span className="login-input-icon">
              <FaUser />
            </span>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              onChange={handleChange}
            />
          </div>

          <div className="login-input-group login-password-group">
            <span className="login-input-icon">
              <FaLock />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              required
              onChange={handleChange}
            />
            <button
              type="button"
              className="login-password-toggle"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="login-forgot">
            <p>
              Forgot your password? Please contact an administrator for a password
              reset.
            </p>
          </div>

          <button type="submit" disabled={isLoading} className="login-submit-btn">
            {isLoading ? (
              <span className="login-spinner"></span>
            ) : (
              <>
                <FaSignInAlt /> Sign In
              </>
            )}
          </button>

          <div className="login-footer">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="login-back-btn"
            >
              <FaArrowLeft /> Back to Home
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
