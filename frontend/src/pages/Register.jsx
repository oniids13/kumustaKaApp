import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Register.css";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    passwordMatch: "",
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    passcode: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  });

  const handleRegistration = async (userData) => {
    setLoading(true);
    setErrors({}); // Clear previous errors
    console.log("Submitting registration data:", userData);

    try {
      const response = await axios.post(
        "http://localhost:3000/api/user/register",
        userData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 201) {
        navigate("/login");
      } else {
        console.error("Unexpected response:", response);
        alert("Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err.response?.data || err.message);
      
      if (err.response?.data?.errors) {
        // Handle validation errors from backend
        const backendErrors = {};
        err.response.data.errors.forEach(error => {
          const field = error.path || error.param;
          backendErrors[field] = error.msg;
        });
        setErrors(backendErrors);
      } else {
        alert(
          err.response?.data?.message ||
            "Registration failed. Please check your inputs."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h2>Join KumustaKa</h2>
          <p>Create your account to start your wellness journey</p>
        </div>

        <RegistrationForm 
          onSubmit={handleRegistration} 
          loading={loading} 
          errors={errors}
          setErrors={setErrors}
        />

        <div className="register-footer">
          <p>
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Sign In</span>
          </p>
          <button className="back-button" onClick={() => navigate("/")}>
            <i className="fas fa-arrow-left"></i> Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

const RegistrationForm = ({ onSubmit, loading, errors, setErrors }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "STUDENT",
    passcode: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  });

  const ROLES = [
    { value: "STUDENT", label: "Student" },
    { value: "TEACHER", label: "Teacher" },
    { value: "ADMIN", label: "Admin" },
    { value: "COUNSELOR", label: "Counselor" },
  ];

  const RELATIONSHIPS = [
    { value: "Parent", label: "Parent" },
    { value: "Guardian", label: "Guardian" },
    { value: "Sibling", label: "Sibling" },
    { value: "Spouse", label: "Spouse" },
    { value: "Friend", label: "Friend" },
    { value: "Relative", label: "Relative" },
    { value: "Other", label: "Other" },
  ];

  const ADMIN_PASSCODE = "TEST";
  const requiresPasscode = ["ADMIN", "TEACHER", "COUNSELOR"].includes(formData.role);
  const isStudent = formData.role === "STUDENT";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear passcode when switching to student role
    if (name === "role" && value === "STUDENT") {
      setFormData((prev) => ({
        ...prev,
        passcode: "",
      }));
    }

    // Clear emergency contact fields when switching away from student role
    if (name === "role" && value !== "STUDENT") {
      setFormData((prev) => ({
        ...prev,
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelationship: "",
      }));
    }

    if (errors.passwordMatch && name.includes("password")) {
      setErrors((prev) => ({ ...prev, passwordMatch: "" }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      passwordMatch: "",
      email: "",
      phone: "",
      firstName: "",
      lastName: "",
      passcode: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
    };

    if (formData.password !== formData.confirmPassword) {
      newErrors.passwordMatch = "Passwords do not match";
      valid = false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
      valid = false;
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
      valid = false;
    } else if (!/^[A-Za-z\s]+$/.test(formData.firstName)) {
      newErrors.firstName = "First name must only contain letters and spaces";
      valid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
      valid = false;
    } else if (!/^[A-Za-z\s]+$/.test(formData.lastName)) {
      newErrors.lastName = "Last name must only contain letters and spaces";
      valid = false;
    }

    if (formData.phone && !/^09\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be exactly 11 digits starting with 09";
      valid = false;
    }

    // Validate passcode for admin, teacher, and counselor roles
    if (requiresPasscode) {
      if (!formData.passcode.trim()) {
        newErrors.passcode = "Access code is required for this role";
        valid = false;
      } else if (formData.passcode !== ADMIN_PASSCODE) {
        newErrors.passcode = "Invalid access code. Contact your administrator.";
        valid = false;
      }
    }

    // Validate emergency contact fields for students
    if (isStudent) {
      if (!formData.emergencyContactName.trim()) {
        newErrors.emergencyContactName = "Emergency contact name is required";
        valid = false;
      } else if (!/^[A-Za-z\s]+$/.test(formData.emergencyContactName)) {
        newErrors.emergencyContactName = "Name must only contain letters and spaces";
        valid = false;
      }

      if (!formData.emergencyContactPhone.trim()) {
        newErrors.emergencyContactPhone = "Emergency contact phone is required";
        valid = false;
      } else if (!/^09\d{9}$/.test(formData.emergencyContactPhone)) {
        newErrors.emergencyContactPhone = "Phone number must be exactly 11 digits starting with 09";
        valid = false;
      }

      if (!formData.emergencyContactRelationship.trim()) {
        newErrors.emergencyContactRelationship = "Relationship is required";
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const data = { ...formData };
      delete data.confirmPassword;
      
      if (!requiresPasscode) {
        delete data.passcode;
      }
      
      // Only include emergency contact data for students
      if (!isStudent) {
        delete data.emergencyContactName;
        delete data.emergencyContactPhone;
        delete data.emergencyContactRelationship;
      } else {
        // Mark emergency contact as primary for students
        data.emergencyContactIsPrimary = true;
      }
      
      onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <div className="form-row">
        {/* First Name */}
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            placeholder="Enter your first name"
            className={errors.firstName ? "error" : ""}
          />
          {errors.firstName && (
            <span className="error-message">{errors.firstName}</span>
          )}
        </div>

        {/* Last Name */}
        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            placeholder="Enter your last name"
            className={errors.lastName ? "error" : ""}
          />
          {errors.lastName && (
            <span className="error-message">{errors.lastName}</span>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="Enter your email"
          className={errors.email ? "error" : ""}
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>

      {/* Phone */}
      <div className="form-group">
        <label htmlFor="phone">Phone Number</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          pattern="09[0-9]{9}"
          placeholder="e.g. 09123456789 (11 digits)"
          className={errors.phone ? "error" : ""}
        />
        {errors.phone && <span className="error-message">{errors.phone}</span>}
      </div>

      {/* Role Selection */}
      <div className="form-group">
        <label htmlFor="role">I am a</label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
        >
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      {/* Emergency Contact Section - Only for Students */}
      {isStudent && (
        <div className="emergency-contact-section">
          <h4 className="section-title">
            Emergency Contact <span className="required-indicator">*</span>
          </h4>
          <p className="section-description">
            This will be your primary emergency contact for health and safety purposes.
          </p>
          
          <div className="form-row">
            {/* Emergency Contact Name */}
            <div className="form-group">
              <label htmlFor="emergencyContactName">
                Emergency Contact Name <span className="required-indicator">*</span>
              </label>
              <input
                type="text"
                id="emergencyContactName"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                required
                placeholder="Full name of emergency contact"
                className={errors.emergencyContactName ? "error" : ""}
              />
              {errors.emergencyContactName && (
                <span className="error-message">{errors.emergencyContactName}</span>
              )}
            </div>

            {/* Emergency Contact Relationship */}
            <div className="form-group">
              <label htmlFor="emergencyContactRelationship">
                Relationship <span className="required-indicator">*</span>
              </label>
              <select
                id="emergencyContactRelationship"
                name="emergencyContactRelationship"
                value={formData.emergencyContactRelationship}
                onChange={handleChange}
                required
                className={errors.emergencyContactRelationship ? "error" : ""}
              >
                <option value="">Select relationship</option>
                {RELATIONSHIPS.map((relationship) => (
                  <option key={relationship.value} value={relationship.value}>
                    {relationship.label}
                  </option>
                ))}
              </select>
              {errors.emergencyContactRelationship && (
                <span className="error-message">{errors.emergencyContactRelationship}</span>
              )}
            </div>
          </div>

          {/* Emergency Contact Phone */}
          <div className="form-group">
            <label htmlFor="emergencyContactPhone">
              Emergency Contact Phone <span className="required-indicator">*</span>
            </label>
            <input
              type="tel"
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              value={formData.emergencyContactPhone}
              onChange={handleChange}
              pattern="09[0-9]{9}"
              required
              placeholder="e.g. 09123456789 (11 digits)"
              className={errors.emergencyContactPhone ? "error" : ""}
            />
            {errors.emergencyContactPhone && (
              <span className="error-message">{errors.emergencyContactPhone}</span>
            )}
          </div>
        </div>
      )}

      {/* Access Code - Only for Admin, Teacher, Counselor */}
      {requiresPasscode && (
        <div className="form-group passcode-group">
          <label htmlFor="passcode">
            Access Code <span className="required-indicator">*</span>
          </label>
          <input
            type="password"
            id="passcode"
            name="passcode"
            value={formData.passcode}
            onChange={handleChange}
            required
            placeholder="Enter your access code"
            className={errors.passcode ? "error" : ""}
          />
          <small className="form-helper-text">
            Contact your administrator for the access code
          </small>
          {errors.passcode && (
            <span className="error-message">{errors.passcode}</span>
          )}
        </div>
      )}

      <div className="form-row">
        {/* Password */}
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            minLength="8"
            required
            placeholder="Create a password"
            className={errors.passwordMatch ? "error" : ""}
          />
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Confirm your password"
            className={errors.passwordMatch ? "error" : ""}
            onBlur={() => {
              if (formData.password !== formData.confirmPassword) {
                setErrors((prev) => ({
                  ...prev,
                  passwordMatch: "Passwords do not match",
                }));
              }
            }}
          />
          {errors.passwordMatch && (
            <span className="error-message">{errors.passwordMatch}</span>
          )}
        </div>
      </div>

      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? (
          <>
            <span className="spinner"></span> Creating Account...
          </>
        ) : (
          "Create Account"
        )}
      </button>
    </form>
  );
};

export default RegisterPage;
