import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

const RegisterPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleRegistration = async (userData) => {
        setLoading(true);
        console.log('Submitting registration data:', userData);

        try {
            const response = await axios.post(
              "http://localhost:3000/api/user/register", 
              userData, 
              {
                headers: { "Content-Type": "application/json" }
              }
            );
        
            // Only navigate on successful response
            if (response.status === 201) {  // 201 Created is common for registration
              navigate('/login');
            } else {
              console.error('Unexpected response:', response);
              alert('Registration failed. Please try again.');
            }
          } catch (err) {
            console.error('Registration error:', err.response?.data || err.message);
            alert(err.response?.data?.message || 'Registration failed. Please check your inputs.');
          } finally {
            setLoading(false);
          }

    }

    return (
        <div className="container my-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <h2 className="mb-4">Create Account</h2>
                    <RegistrationForm onSubmit={handleRegistration} loading={loading} />
                    <button className="btn btn-primary mt-3" onClick={() => navigate('/')}>⬅</button>
                </div>
            </div>
        </div>
    )
}



const RegistrationForm = ({ onSubmit, loading }) => {
    
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        phone: "",
        role: "STUDENT",
    });
  
  const [errors, setErrors] = useState({
    passwordMatch: '',
    email: '',
    phone: '',
  });

  const ROLES = [
    { value: "STUDENT", label: "Student" },
    { value: "TEACHER", label: "Teacher" },
    { value: "ADMIN", label: "Admin" },
    { value: "COUNSELOR", label: "Counselor" },
  ]
  
  const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
        ...prev,
        [name]: value
        }));

        // Clear errors when typing
        if (errors.passwordMatch && name.includes('password')) {
        setErrors(prev => ({ ...prev, passwordMatch: '' }));
        }
    };

    const validateForm = () => {
        let valid = true;
        const newErrors = { ...errors };

        // Password match validation
        if (formData.password !== formData.confirmPassword) {
            newErrors.passwordMatch = "Passwords do not match";
            valid = false;
        }

        // Email validation
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Invalid email format";
            valid = false;
        }
        // Phone number validation
        if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
            newErrors.phone = "Please enter a valid phone number";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    }
  
    const handleSubmit = (e) => {
      e.preventDefault();
        if (validateForm()) {
            const { confirmPassword, ...data } = formData;
            onSubmit(data);
        }
      
    }

    return (
    <>
        <form onSubmit={handleSubmit} className="needs-validation" noValidate>
            {/* Email */}
            <div className="form-floating mb-3">
                <input
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                id="floatingEmail"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                />
                <label htmlFor="floatingEmail">Email address</label>
                {errors.email && (
                <div className="invalid-feedback">{errors.email}</div>
                )}
            </div>

            {/* Password */}
            <div className="form-floating mb-3">
                <input
                type="password"
                className={`form-control ${errors.passwordMatch ? 'is-invalid' : ''}`}
                id="floatingPassword"
                name="password"
                value={formData.password}
                onChange={handleChange}
                minLength="8"
                required
                />
                <label htmlFor="floatingPassword">Password</label>
            </div>

            {/* Confirm Password */}
            <div className="form-floating mb-3">
                <input
                type="password"
                className={`form-control ${errors.passwordMatch ? 'is-invalid' : ''}`}
                id="floatingConfirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={() => {
                    if (formData.password !== formData.confirmPassword) {
                    setErrors(prev => ({
                        ...prev,
                        passwordMatch: 'Passwords do not match'
                    }));
                    }
                }}
                required
                />
                <label htmlFor="floatingConfirmPassword">Confirm Password</label>
                {errors.passwordMatch && (
                <div className="invalid-feedback">{errors.passwordMatch}</div>
                )}
            </div>

            {/* First Name */}
            <div className="form-floating mb-3">
                <input
                type="text"
                className="form-control"
                id="floatingFirstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                />
                <label htmlFor="floatingFirstName">First Name</label>
            </div>

            {/* Last Name */}
            <div className="form-floating mb-3">
                <input
                type="text"
                className="form-control"
                id="floatingLastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                />
                <label htmlFor="floatingLastName">Last Name</label>
            </div>

            {/* Phone */}
            <div className="form-floating mb-3">
                <input
                type="tel"
                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                id="floatingPhone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                pattern="[0-9]{10,15}"
                placeholder="(+63) 10 digit number"
                />
                <label htmlFor="floatingPhone">Phone Number (enter 10 digit number not including 0)</label>
                {errors.phone && (
                <div className="invalid-feedback">{errors.phone}</div>
                )}
            </div>

            {/* Role Selection */}
            <div className="mb-3">
                <label htmlFor="roleSelect" className="form-label">User Role</label>
                <select
                className="form-select"
                id="roleSelect"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                >
                {ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                    {role.label}
                    </option>
                ))}
                </select>
            </div>

            <button type="submit" className="btn btn-success w-100 py-2" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
            </button>   
        </form>
       </>
    )
}

export default RegisterPage;