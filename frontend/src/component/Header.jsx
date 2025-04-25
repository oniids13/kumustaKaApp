import { Link } from "react-router-dom";
import LogOutButton from "./LogoutButton";
import "../styles/Header.css";

const Header = ({ token, setToken }) => {
  return (
    <header className="header-container">
      <div className="header-content">
        <img
          className="logo"
          src="/images/kumustaKaLogo.png"
          alt="kumustaKa Logo"
        />

        {token && (
          <div className="nav-actions">
            <LogOutButton setToken={setToken} />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
