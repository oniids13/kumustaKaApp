import { Link } from "react-router-dom";


const Header = ({token, setToken}) => {
    
    return (
        <header className="d-flex flex-column align-items-center justify-content-center border-bottom p-3">
            <a href="/" className="link-body-emphasis text-decoration-none">
                <img className="logo" src="images\kumustaKaLogo.png" alt="kumustaKaLogo" />
            </a>

        {!token ? (
            ''
        ) : (
            <ul className="nav nav-pills">
                <li class="nav-item"><a href="#" class="nav-link active" aria-current="page">Home</a></li>
                <li class="nav-item"><a href="#" class="nav-link">Features</a></li>
                <li class="nav-item"><a href="#" class="nav-link">Pricing</a></li>
                <li class="nav-item"><a href="#" class="nav-link">FAQs</a></li>
                <li class="nav-item"><a href="#" class="nav-link">About</a></li>
            </ul>
        )}
            
    </header>
    )
}

export default Header;