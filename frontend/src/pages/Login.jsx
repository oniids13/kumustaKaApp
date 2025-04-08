import { useNavigate } from 'react-router-dom';


const Login = () => {

    const navigate = useNavigate();

  return (
    <div className="container wrapper">
      <h1>Login</h1>
      <form>
        <div className="mb-3">
          <label htmlFor="username" className="form-label">Username</label>
          <input type="text" className="form-control" id="username" />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input type="password" className="form-control" id="password" />
        </div>
        <button type="submit" className="btn btn-primary">Login</button>
      </form>
      <button className="btn btn-secondary mt-3" onClick={() => navigate('/')}>Back</button>
    </div>
  );
}

export default Login;