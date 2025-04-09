import axios from "axios";
import { useNavigate } from "react-router-dom";

const LogOutButton = ({setToken}) => {   
    
    
    const navigate = useNavigate();


    const handleLogout = async () => {
        await axios.post("http://localhost:3000/api/logout", {}, {
            headers: { "Content-Type": "application/json" }
        })

        localStorage.removeItem("userData");
        setToken(null);
        navigate('/');
        
    };

    return (
        <button onClick={handleLogout} className="btn btn-danger">
            Log Out
        </button>
    );
}

export default LogOutButton;