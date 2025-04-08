import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';



const Login = () => {

    const {setToken} = useOutletContext();

    const navigate = useNavigate();
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:3000/api/login", formData, {
                headers: {"Content-Type": "application/json"}
            });


            const userData = {
                token: response.data.token,
                userId: response.data.user.id,
                name: response.data.user.fullName,
                role: response.data.user.role,
            }

            localStorage.setItem("userData", JSON.stringify(userData))
    
            setToken(response.data.token)
           
            navigate("/home");
        } catch (error) {
            console.error(error.message)
            setError("Invalid Login Credentials");
        }
    }

  return (
    <div className="container wrapper mt-5 d-flex justify-content-center align-items-center flex-column">
      <LoginForm
      handleChange={handleChange}
      handleLogin={handleLogin}
      error={error}
      />
    </div>
  );
}



const LoginForm = ({handleChange, handleLogin, error}) => {

  const navigate = useNavigate();

  return (
  <>
    <form className="login-form" onSubmit={handleLogin}>
      <h1 className="h3 mb-3 fw-normal">Please sign in</h1>

      {error && <p className='text-danger'>{error}</p>}

      <div className="form-floating">
      <input type="email" className="form-control" id="floatingInput" placeholder="name@example.com" name="email" required onChange={handleChange} />
      <label htmlFor="floatingInput">Email address</label>
      </div>
      <div className="form-floating">
      <input type="password" className="form-control" id="floatingPassword" placeholder="Password" name="password" required onChange={handleChange} />
      <label htmlFor="floatingPassword">Password</label>
      </div>
      <button className="btn btn-primary w-100 py-2" type="submit">Sign in</button>
  </form>
  <button className="btn btn-secondary mt-3" onClick={() => navigate('/')}>Back</button>
  </>
  )
}


export default Login;