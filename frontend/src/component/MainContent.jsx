import { Outlet, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useEffect, useState } from "react";

const MainContent = () => {
    const navigate = useNavigate();
    const [token, setToken] = useState(() => {
        const userData = JSON.parse(localStorage.getItem("userData")) || {};
        return userData.token || null;
    });

    useEffect(() => {
        const handleStorageChange = () => {
            const userData = JSON.parse(localStorage.getItem("userData")) || {};
            setToken(userData.token || null);
            
            if (userData.token) {
           
                switch(userData.role) {
                    case 'STUDENT': navigate("/student"); break;
                    case 'COUNSELOR': navigate("/counselor"); break;
                    case 'TEACHER': navigate("/teacher"); break;
                    case 'ADMIN': navigate("/admin"); break;
                    default: navigate("/");
                }
            } else {
                navigate("/");
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
      
        const userData = JSON.parse(localStorage.getItem("userData")) || {};
        if (userData.token) {
            switch(userData.role) {
                case 'STUDENT': navigate("/student"); break;
                case 'COUNSELOR': navigate("/counselor"); break;
                case 'TEACHER': navigate("/teacher"); break;
                case 'ADMIN': navigate("/admin"); break;
                default: navigate("/");
            }
        }

        return () => window.removeEventListener('storage', handleStorageChange);
    }, [navigate]);

    return (
        <>
            <Header token={token} setToken={setToken} />
            <Outlet context={{ token, setToken }} />
            <Footer />
        </>
    );
};

export default MainContent;