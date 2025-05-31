import { useState } from "react";
import axios from "axios";
import "../styles/ChangePassword.css";

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationState, setValidationState] = useState({
    length: false,
    complexity: false,
  });

  const validatePassword = (password) => {
    const length = password.length >= 8;
    const complexity = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
    return { length, complexity };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time password validation
    if (name === "newPassword") {
      setValidationState(validatePassword(value));
    }

    setError(null);
    setMessage(null);
  };

  const validateForm = () => {
    if (
      !formData.currentPassword ||
      !formData.newPassword ||
      !formData.confirmPassword
    ) {
      setError("All fields are required");
      return false;
    }

    if (formData.newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return false;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      setError("New password must contain at least one uppercase letter, one lowercase letter, and one number");
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirm password do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const userData = JSON.parse(localStorage.getItem("userData"));

      if (!userData || !userData.token) {
        setError("You must be logged in to change your password");
        setIsLoading(false);
        return;
      }

      const response = await axios.post(
        "http://localhost:3000/api/password/change",
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${userData.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMessage(response.data.message);
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setValidationState({ length: false, complexity: false });
    } catch (error) {
      console.error("Error changing password:", error);
      setError(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <div className="change-password-card">
        <h2>Change Password</h2>

        <div className="password-policy-info">
          <h4>Password Requirements:</h4>
          <ul>
            <li>Must be at least 8 characters long</li>
            <li>Must contain at least one uppercase letter</li>
            <li>Must contain at least one lowercase letter</li>
            <li>Must contain at least one number</li>
            <li><strong>Cannot be any of your last 3 passwords</strong></li>
          </ul>
        </div>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="change-password-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength={8}
              className={formData.newPassword ? (validationState.length && validationState.complexity ? "valid" : "invalid") : ""}
            />
            {formData.newPassword && (
              <div className="password-requirements">
                <small className="form-helper-text">Password must contain:</small>
                <ul className="requirements-list">
                  <li className={validationState.length ? "requirement-met" : "requirement-pending"}>
                    <i className={`fas ${validationState.length ? 'fa-check' : 'fa-circle'}`}></i>
                    At least 8 characters
                  </li>
                  <li className={validationState.complexity ? "requirement-met" : "requirement-pending"}>
                    <i className={`fas ${validationState.complexity ? 'fa-check' : 'fa-circle'}`}></i>
                    One uppercase letter, one lowercase letter, and one number
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={formData.confirmPassword ? (formData.newPassword === formData.confirmPassword ? "valid" : "invalid") : ""}
            />
            {formData.confirmPassword && (
              <div className="validation-guide">
                <small className="form-helper-text">
                  <i className={`fas ${formData.newPassword === formData.confirmPassword ? 'fa-check text-success' : 'fa-times text-error'}`}></i>
                  {formData.newPassword === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                </small>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="change-password-button"
            disabled={isLoading}
          >
            {isLoading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
