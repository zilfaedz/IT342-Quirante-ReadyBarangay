import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutModal from './LogoutModal';
import logo from '../assets/ReadyBarangay_Logo.png';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Hide navbar on login and register pages
    if (['/login', '/register'].includes(location.pathname)) {
        return null;
    }

    const confirmLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <img src={logo} alt="Logo" style={{ height: '30px', marginRight: '10px', verticalAlign: 'middle' }} />
                    ReadyBarangay
                </Link>
                <div className="navbar-links">
                    {!user ? (
                        <>
                            <Link to="/login" className="nav-link">Login</Link>
                            <Link to="/register" className="nav-link">Register</Link>
                        </>
                    ) : (
                        <>
                            <span className="nav-user-greeting">Hi, {user?.firstName || user?.name || (user?.email && user.email.split('@')[0]) || 'User'}</span>
                            <Link to="/dashboard" className="nav-link">Dashboard</Link>
                            <button onClick={() => setShowLogoutModal(true)} className="nav-btn">Logout</button>
                        </>
                    )}
                </div>
            </div>
            <LogoutModal
                show={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={confirmLogout}
            />
        </nav>
    );
};

export default Navbar;
