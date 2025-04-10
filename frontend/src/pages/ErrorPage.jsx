import { useNavigate } from 'react-router-dom';

const ErrorPage = () => {
    const userData = JSON.parse(localStorage.getItem("userData")) || {};
    const navigate = useNavigate();

    const handleRedirect = () => {
        if (!userData.token) return navigate('/');
        
        // Handle uppercase roles
        switch(userData.role) {
            case 'STUDENT': return navigate('/student');
            case 'COUNSELOR': return navigate('/counselor');
            case 'TEACHER': return navigate('/teacher');
            case 'ADMIN': return navigate('/admin');
            default: return navigate('/');
        }
    };

    return (
        <div className="error-page container text-center mt-5">
            <h1>Ooops!</h1>
            <p>Sorry, the page you are looking for does not exist.</p>
            <button 
                className='btn btn-primary' 
                onClick={handleRedirect}
            >
                {userData.token ? 'Go to My Dashboard' : 'Go Home'}
            </button>
        </div>
    );
};

export default ErrorPage;