import { useNavigate } from 'react-router-dom';



const ErrorPage = () => {

    const userData = JSON.parse(localStorage.getItem("userData")) || '{}';

    const navigate = useNavigate();

    return (
        <div className="error-page container text-center mt-5">
            <h1>Ooops!</h1>
            <p>Sorry, the page you are looking for does not exist.</p>
            {!userData.token ? (
                <button className='btn btn-primary' onClick={() => navigate('/')}>Go Back</button>         
            ) : (
                <button className='btn btn-primary' onClick={() => navigate('/home')}>Go Back</button>

            )}
        </div>
    );
}

export default ErrorPage;