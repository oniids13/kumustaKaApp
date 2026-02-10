import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useEffect, useState } from "react";

const PUBLIC_PATHS = ["/", "/login", "/register"];

const MainContent = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isPublicPage = PUBLIC_PATHS.includes(location.pathname);
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
            {!isPublicPage && <Header token={token} setToken={setToken} />}
            <Outlet context={{ token, setToken }} />
            {!isPublicPage && <Footer />}
        </>
    );
};

export default MainContent;