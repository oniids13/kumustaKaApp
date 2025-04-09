import { Link } from "react-router-dom";
import LogOutButton from "./LogoutButton";


const Header = ({token, setToken}) => {
    
    return (
        <header className="d-flex flex-column align-items-center justify-content-center border-bottom p-3">
            <a href="/" className="link-body-emphasis text-decoration-none">
                <img className="logo" src="images\kumustaKaLogo.png" alt="kumustaKaLogo" />
            </a>

        {!token ? (
            ''
        ) : (
            <div className="d-flex flex-row align-items-center justify-content-center gap-3">
                <Link to={'/home'}><button className="btn btn-primary nav-item">Home</button></Link>
                <LogOutButton setToken={setToken} />

            </div>
        )}
            
    </header>
    )
}

export default Header;