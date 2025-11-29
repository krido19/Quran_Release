import { NavLink } from 'react-router-dom';

export default function Navbar() {
    return (
        <nav className="bottom-nav">
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <i className="fa-solid fa-book-quran"></i>
                <span>Quran</span>
            </NavLink>
            <NavLink to="/prayer" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <i className="fa-solid fa-clock"></i>
                <span>Prayer</span>
            </NavLink>
            <NavLink to="/qibla" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <i className="fa-solid fa-kaaba"></i>
                <span>Qibla</span>
            </NavLink>
            <NavLink to="/tasbih" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <i className="fa-solid fa-fingerprint"></i>
                <span>Tasbih</span>
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <i className="fa-regular fa-user"></i>
                <span>Profile</span>
            </NavLink>
        </nav>
    );
}
