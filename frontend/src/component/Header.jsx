import { Link } from "react-router-dom";
import LogOutButton from "./LogoutButton";


const Header = ({token, setToken}) => {
    
    return (
        <header className="d-flex flex-column align-items-center justify-content-center border-bottom p-3">
                <div><img className="logo" src="images\kumustaKaLogo.png" alt="kumustaKaLogo" /></div>
        

        {!token ? (
            ''
        ) : (
            <div className="d-flex flex-row align-items-center justify-content-center gap-3">
                
                <LogOutButton setToken={setToken} />

            </div>
        )}
            
    </header>
    )
}

export default Header;