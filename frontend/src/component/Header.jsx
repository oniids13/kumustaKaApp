import { Link } from "react-router-dom";
import LogOutButton from "./LogoutButton";
import "../styles/Header.css";

const Header = ({ token, setToken }) => {
  return (
    <header className="kk-header">
      <div className="kk-header-inner">
        <div className="kk-header-brand">
          <img
            className="kk-header-logo"
            src="/images/kumustaKaLogo.png"
            alt="KumustaKa Logo"
          />
          <span className="kk-header-name">KumustaKa</span>
        </div>

        {token && (
          <div className="kk-header-actions">
            <LogOutButton setToken={setToken} />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
