import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
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
    gender: "",
    passcode: "",
    sectionCode: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    password: "",
  });

  const handleRegistration = async (userData) => {
    setLoading(true);
    setErrors({});

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
        const backendErrors = {};
        err.response.data.errors.forEach((error) => {
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
    <div className="reg-page">
      {/* Background */}
      <div className="reg-bg">
        <img src="/images/homeBg.jpg" alt="" className="reg-bg-img" />
        <div className="reg-bg-overlay"></div>
      </div>

      <div className="reg-card">
        {/* Header */}
        <div className="reg-header">
          <div className="reg-brand">
            <img
              src="/images/kumustaKaLogo.png"
              alt="KumustaKa Logo"
              className="reg-brand-logo"
            />
            <span className="reg-brand-text">KumustaKa</span>
          </div>
          <h2 className="reg-title">Create Your Account</h2>
          <p className="reg-subtitle">
            Join our community and start your wellness journey
          </p>
        </div>

        <RegistrationForm
          onSubmit={handleRegistration}
          loading={loading}
          errors={errors}
          setErrors={setErrors}
        />

        <div className="reg-footer">
          <p className="reg-footer-text">
            Already have an account?{" "}
            <span className="reg-footer-link" onClick={() => navigate("/login")}>
              Sign In
            </span>
          </p>
          <button className="reg-back-btn" onClick={() => navigate("/")}>
            <FaArrowLeft /> Back to Home
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
    gender: "",
    role: "STUDENT",
    passcode: "",
    sectionCode: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  });

  const [validationState, setValidationState] = useState({
    password: {
      length: false,
      complexity: false,
    },
    email: false,
    phone: false,
    firstName: false,
    lastName: false,
    emergencyContactName: false,
    emergencyContactPhone: false,
    sectionCode: false,
  });

  const [sectionInfo, setSectionInfo] = useState(null);
  const [verifyingSection, setVerifyingSection] = useState(false);

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

  const GENDERS = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
    { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
  ];

  const ADMIN_PASSCODE = "TEST";
  const requiresPasscode = ["ADMIN", "TEACHER", "COUNSELOR"].includes(
    formData.role
  );
  const isStudent = formData.role === "STUDENT";

  // Validation functions
  const validatePassword = (password) => {
    const length = password.length >= 8;
    const complexity = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
    return { length, complexity };
  };

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const validatePhone = (phone) => {
    return /^09\d{9}$/.test(phone);
  };

  const validateName = (name) => {
    return /^[A-Za-z\s]+$/.test(name) && name.trim().length >= 2;
  };

  const validateSectionCode = (code) => {
    return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
  };

  const verifySectionCode = async (code) => {
    if (!validateSectionCode(code)) {
      setSectionInfo(null);
      return;
    }

    setVerifyingSection(true);
    try {
      const response = await axios.get(
        `http://localhost:3000/api/sections/verify/${code.toUpperCase()}`
      );
      if (response.data.valid) {
        setSectionInfo(response.data.section);
        setValidationState((prev) => ({ ...prev, sectionCode: true }));
        setErrors((prev) => ({ ...prev, sectionCode: "" }));
      } else {
        setSectionInfo(null);
        setValidationState((prev) => ({ ...prev, sectionCode: false }));
        setErrors((prev) => ({ ...prev, sectionCode: response.data.message }));
      }
    } catch (err) {
      setSectionInfo(null);
      setValidationState((prev) => ({ ...prev, sectionCode: false }));
      setErrors((prev) => ({
        ...prev,
        sectionCode: err.response?.data?.message || "Invalid section code",
      }));
    } finally {
      setVerifyingSection(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation
    let newValidationState = { ...validationState };

    if (name === "password") {
      newValidationState.password = validatePassword(value);
      if (errors.password) {
        setErrors((prev) => ({ ...prev, password: "" }));
      }
    } else if (name === "email") {
      newValidationState.email = validateEmail(value);
      if (errors.email) {
        setErrors((prev) => ({ ...prev, email: "" }));
      }
    } else if (name === "phone") {
      newValidationState.phone = validatePhone(value);
      if (errors.phone) {
        setErrors((prev) => ({ ...prev, phone: "" }));
      }
    } else if (name === "firstName") {
      newValidationState.firstName = validateName(value);
      if (errors.firstName) {
        setErrors((prev) => ({ ...prev, firstName: "" }));
      }
    } else if (name === "lastName") {
      newValidationState.lastName = validateName(value);
      if (errors.lastName) {
        setErrors((prev) => ({ ...prev, lastName: "" }));
      }
    } else if (name === "emergencyContactName") {
      newValidationState.emergencyContactName = validateName(value);
      if (errors.emergencyContactName) {
        setErrors((prev) => ({ ...prev, emergencyContactName: "" }));
      }
    } else if (name === "emergencyContactPhone") {
      newValidationState.emergencyContactPhone = validatePhone(value);
      if (errors.emergencyContactPhone) {
        setErrors((prev) => ({ ...prev, emergencyContactPhone: "" }));
      }
    }

    setValidationState(newValidationState);

    // Handle section code changes
    if (name === "sectionCode") {
      const upperCode = value.toUpperCase();
      setFormData((prev) => ({
        ...prev,
        sectionCode: upperCode,
      }));
      if (upperCode.length === 6) {
        verifySectionCode(upperCode);
      } else {
        setSectionInfo(null);
        setValidationState((prev) => ({ ...prev, sectionCode: false }));
      }
      return;
    }

    // Clear passcode when switching to student role
    if (name === "role" && value === "STUDENT") {
      setFormData((prev) => ({
        ...prev,
        passcode: "",
      }));
    }

    // Clear emergency contact and section fields when switching away from student role
    if (name === "role" && value !== "STUDENT") {
      setFormData((prev) => ({
        ...prev,
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelationship: "",
        sectionCode: "",
      }));
      setSectionInfo(null);
      setValidationState((prev) => ({ ...prev, sectionCode: false }));
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
      gender: "",
      passcode: "",
      sectionCode: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      password: "",
    };

    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
      valid = false;
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
      valid = false;
    }

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
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters long";
      valid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
      valid = false;
    } else if (!/^[A-Za-z\s]+$/.test(formData.lastName)) {
      newErrors.lastName = "Last name must only contain letters and spaces";
      valid = false;
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters long";
      valid = false;
    }

    if (formData.phone && !/^09\d{9}$/.test(formData.phone)) {
      newErrors.phone =
        "Phone number must be exactly 11 digits starting with 09";
      valid = false;
    }

    if (requiresPasscode) {
      if (!formData.passcode.trim()) {
        newErrors.passcode = "Access code is required for this role";
        valid = false;
      } else if (formData.passcode !== ADMIN_PASSCODE) {
        newErrors.passcode = "Invalid access code. Contact your administrator.";
        valid = false;
      }
    }

    if (isStudent) {
      if (!formData.sectionCode.trim()) {
        newErrors.sectionCode = "Section code is required";
        valid = false;
      } else if (!validateSectionCode(formData.sectionCode)) {
        newErrors.sectionCode = "Section code must be exactly 6 characters";
        valid = false;
      } else if (!sectionInfo) {
        newErrors.sectionCode = "Please enter a valid section code";
        valid = false;
      }

      if (!formData.emergencyContactName.trim()) {
        newErrors.emergencyContactName = "Emergency contact name is required";
        valid = false;
      } else if (!/^[A-Za-z\s]+$/.test(formData.emergencyContactName)) {
        newErrors.emergencyContactName =
          "Name must only contain letters and spaces";
        valid = false;
      } else if (formData.emergencyContactName.trim().length < 2) {
        newErrors.emergencyContactName =
          "Name must be at least 2 characters long";
        valid = false;
      }

      if (!formData.emergencyContactPhone.trim()) {
        newErrors.emergencyContactPhone = "Emergency contact phone is required";
        valid = false;
      } else if (!/^09\d{9}$/.test(formData.emergencyContactPhone)) {
        newErrors.emergencyContactPhone =
          "Phone number must be exactly 11 digits starting with 09";
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

      if (!data.gender) {
        delete data.gender;
      }

      if (!isStudent) {
        delete data.emergencyContactName;
        delete data.emergencyContactPhone;
        delete data.emergencyContactRelationship;
        delete data.sectionCode;
      } else {
        data.emergencyContactIsPrimary = true;
      }

      onSubmit(data);
    }
  };

  const getInputClass = (field) => {
    if (errors[field]) return "reg-input error";
    if (field === "password") {
      return validationState.password.length && validationState.password.complexity
        ? "reg-input valid"
        : "reg-input";
    }
    if (validationState[field]) return "reg-input valid";
    return "reg-input";
  };

  const getConfirmPasswordClass = () => {
    if (errors.passwordMatch) return "reg-input error";
    if (formData.confirmPassword && formData.password === formData.confirmPassword)
      return "reg-input valid";
    return "reg-input";
  };

  const ValidationHint = ({ isValid, text }) => (
    <div className="reg-hint">
      <i
        className={`bi ${isValid ? "bi-check-circle-fill reg-hint-ok" : "bi-info-circle reg-hint-default"}`}
      ></i>
      <small>{text}</small>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="reg-form">
      {/* Name row */}
      <div className="reg-row">
        <div className="reg-field">
          <label htmlFor="firstName">
            First Name <span className="reg-required">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            placeholder="Enter your first name"
            className={getInputClass("firstName")}
          />
          <ValidationHint
            isValid={validationState.firstName}
            text="At least 2 characters, letters and spaces only"
          />
          {errors.firstName && (
            <span className="reg-error">{errors.firstName}</span>
          )}
        </div>

        <div className="reg-field">
          <label htmlFor="lastName">
            Last Name <span className="reg-required">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            placeholder="Enter your last name"
            className={getInputClass("lastName")}
          />
          <ValidationHint
            isValid={validationState.lastName}
            text="At least 2 characters, letters and spaces only"
          />
          {errors.lastName && (
            <span className="reg-error">{errors.lastName}</span>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="reg-field">
        <label htmlFor="email">
          Email Address <span className="reg-required">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="Enter your email"
          className={getInputClass("email")}
        />
        <ValidationHint
          isValid={validationState.email}
          text="Valid email format (e.g., user@example.com)"
        />
        {errors.email && <span className="reg-error">{errors.email}</span>}
      </div>

      {/* Phone */}
      <div className="reg-field">
        <label htmlFor="phone">Phone Number</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          pattern="09[0-9]{9}"
          placeholder="e.g. 09123456789"
          className={getInputClass("phone")}
        />
        <ValidationHint
          isValid={validationState.phone}
          text="11 digits starting with 09 (e.g., 09123456789)"
        />
        {errors.phone && <span className="reg-error">{errors.phone}</span>}
      </div>

      {/* Gender + Role row */}
      <div className="reg-row">
        <div className="reg-field">
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className={errors.gender ? "reg-input error" : "reg-input"}
          >
            <option value="">Select gender (optional)</option>
            {GENDERS.map((gender) => (
              <option key={gender.value} value={gender.value}>
                {gender.label}
              </option>
            ))}
          </select>
          {errors.gender && <span className="reg-error">{errors.gender}</span>}
        </div>

        <div className="reg-field">
          <label htmlFor="role">
            I am a <span className="reg-required">*</span>
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className="reg-input"
          >
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section Code — Students only */}
      {isStudent && (
        <div className="reg-section-code-card">
          <div className="reg-field">
            <label htmlFor="sectionCode">
              Section Code <span className="reg-required">*</span>
            </label>
            <div className="reg-code-wrapper">
              <input
                type="text"
                id="sectionCode"
                name="sectionCode"
                value={formData.sectionCode}
                onChange={handleChange}
                maxLength={6}
                placeholder="Enter 6-character code"
                className={getInputClass("sectionCode")}
                style={{ textTransform: "uppercase" }}
              />
              {verifyingSection && (
                <span className="reg-verifying">
                  <i className="bi bi-arrow-repeat reg-spin"></i>
                </span>
              )}
            </div>
            <ValidationHint
              isValid={validationState.sectionCode}
              text="Ask your teacher or admin for your section code"
            />
            {errors.sectionCode && (
              <span className="reg-error">{errors.sectionCode}</span>
            )}
            {sectionInfo && (
              <div className="reg-section-verified">
                <div className="reg-section-verified-header">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Section Verified</span>
                </div>
                <div className="reg-section-verified-details">
                  <p><strong>{sectionInfo.name}</strong></p>
                  {sectionInfo.gradeLevel && (
                    <p className="reg-section-meta">{sectionInfo.gradeLevel}</p>
                  )}
                  {sectionInfo.teacherName && (
                    <p className="reg-section-meta">
                      <i className="bi bi-person-badge"></i> {sectionInfo.teacherName}
                    </p>
                  )}
                  <p className="reg-section-meta">
                    <i className="bi bi-people"></i> {sectionInfo.studentCount} students enrolled
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emergency Contact — Students only */}
      {isStudent && (
        <div className="reg-emergency-card">
          <h4 className="reg-card-title">
            <i className="bi bi-telephone"></i>
            Emergency Contact <span className="reg-required">*</span>
          </h4>
          <p className="reg-card-desc">
            This will be your primary emergency contact for health and safety purposes.
          </p>

          <div className="reg-row">
            <div className="reg-field">
              <label htmlFor="emergencyContactName">
                Contact Name <span className="reg-required">*</span>
              </label>
              <input
                type="text"
                id="emergencyContactName"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                required
                placeholder="Full name of emergency contact"
                className={getInputClass("emergencyContactName")}
              />
              <ValidationHint
                isValid={validationState.emergencyContactName}
                text="At least 2 characters, letters and spaces only"
              />
              {errors.emergencyContactName && (
                <span className="reg-error">{errors.emergencyContactName}</span>
              )}
            </div>

            <div className="reg-field">
              <label htmlFor="emergencyContactRelationship">
                Relationship <span className="reg-required">*</span>
              </label>
              <select
                id="emergencyContactRelationship"
                name="emergencyContactRelationship"
                value={formData.emergencyContactRelationship}
                onChange={handleChange}
                required
                className={
                  errors.emergencyContactRelationship
                    ? "reg-input error"
                    : "reg-input"
                }
              >
                <option value="">Select relationship</option>
                {RELATIONSHIPS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {errors.emergencyContactRelationship && (
                <span className="reg-error">
                  {errors.emergencyContactRelationship}
                </span>
              )}
            </div>
          </div>

          <div className="reg-field">
            <label htmlFor="emergencyContactPhone">
              Contact Phone <span className="reg-required">*</span>
            </label>
            <input
              type="tel"
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              value={formData.emergencyContactPhone}
              onChange={handleChange}
              pattern="09[0-9]{9}"
              required
              placeholder="e.g. 09123456789"
              className={getInputClass("emergencyContactPhone")}
            />
            <ValidationHint
              isValid={validationState.emergencyContactPhone}
              text="11 digits starting with 09 (e.g., 09123456789)"
            />
            {errors.emergencyContactPhone && (
              <span className="reg-error">{errors.emergencyContactPhone}</span>
            )}
          </div>
        </div>
      )}

      {/* Access Code — Admin/Teacher/Counselor */}
      {requiresPasscode && (
        <div className="reg-passcode-card">
          <div className="reg-field">
            <label htmlFor="passcode">
              <i className="bi bi-key"></i>{" "}
              Access Code <span className="reg-required">*</span>
            </label>
            <input
              type="password"
              id="passcode"
              name="passcode"
              value={formData.passcode}
              onChange={handleChange}
              required
              placeholder="Enter your access code"
              className={errors.passcode ? "reg-input error" : "reg-input"}
            />
            <ValidationHint
              isValid={false}
              text="Contact your administrator for the access code"
            />
            {errors.passcode && (
              <span className="reg-error">{errors.passcode}</span>
            )}
          </div>
        </div>
      )}

      {/* Passwords row */}
      <div className="reg-row">
        <div className="reg-field">
          <label htmlFor="password">
            Password <span className="reg-required">*</span>
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            minLength="8"
            required
            placeholder="Create a password"
            className={getInputClass("password")}
          />
          <div className="reg-pw-requirements">
            <small className="reg-pw-label">Password must contain:</small>
            <ul className="reg-pw-list">
              <li className={validationState.password.length ? "met" : ""}>
                <i
                  className={`bi ${
                    validationState.password.length
                      ? "bi-check-circle-fill"
                      : "bi-circle"
                  }`}
                ></i>
                At least 8 characters
              </li>
              <li className={validationState.password.complexity ? "met" : ""}>
                <i
                  className={`bi ${
                    validationState.password.complexity
                      ? "bi-check-circle-fill"
                      : "bi-circle"
                  }`}
                ></i>
                Uppercase, lowercase, and a number
              </li>
            </ul>
          </div>
          {errors.password && (
            <span className="reg-error">{errors.password}</span>
          )}
        </div>

        <div className="reg-field">
          <label htmlFor="confirmPassword">
            Confirm Password <span className="reg-required">*</span>
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Confirm your password"
            className={getConfirmPasswordClass()}
            onBlur={() => {
              if (formData.password !== formData.confirmPassword) {
                setErrors((prev) => ({
                  ...prev,
                  passwordMatch: "Passwords do not match",
                }));
              }
            }}
          />
          <ValidationHint
            isValid={
              formData.confirmPassword &&
              formData.password === formData.confirmPassword
            }
            text="Must match the password above"
          />
          {errors.passwordMatch && (
            <span className="reg-error">{errors.passwordMatch}</span>
          )}
        </div>
      </div>

      <button type="submit" className="reg-submit-btn" disabled={loading}>
        {loading ? (
          <>
            <span className="reg-spinner"></span> Creating Account...
          </>
        ) : (
          "Create Account"
        )}
      </button>
    </form>
  );
};

export default RegisterPage;
