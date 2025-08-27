import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import LoginModal from '../../auth/LoginModal';
import RegisterModal from '../../auth/RegisterModal';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const closeMenu = () => setShowUserMenu(false);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // evitar que se cierre al hacer clic en el ícono
    setShowUserMenu(!showUserMenu);
  };

  return (
    <>
      <nav className="navbar">
        <div>
          <img src="/logo.png" alt="Logo" className="logo" />
        </div>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/espanya">España</Link>
          <Link to="/dubai">Dubái</Link>
          <Link to="/romania">Rumanía</Link>
          <Link to="/agencia">Agencia</Link>
          <Link to="/servicios">Servicios</Link>
          <Link to="/contacto">Contacto</Link>

          {user ? (
            <div className="user-menu-container" onClick={handleMenuClick}>
              <img
                src="/user-profile.svg"
                alt="Usuario"
                className="user-icon"
              />
              {showUserMenu && (
                <div className="user-menu-dropdown">
                  <button onClick={() => navigate('/profile')} style={{ color: '#000' }}>
                    Perfil
                  </button>
                  <button onClick={logout}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthModal('login')}
              className="login-button"
              style={{
                color: '#2563eb',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Login
            </button>
          )}

          <span className="language-selector">
            <button>Español</button> | <button>English</button>
          </span>
          <span className="phone">📞 +34 911 644 182</span>
        </div>
      </nav>

      {authModal === 'login' && (
        <LoginModal
          onClose={() => setAuthModal(null)}
          onSwitchToRegister={() => setAuthModal('register')}
        />
      )}

      {authModal === 'register' && (
        <RegisterModal
          onClose={() => setAuthModal(null)}
          onSwitchToLogin={() => setAuthModal('login')}
        />
      )}
    </>
  );
};

export default Navbar;
