import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import LoginModal from '../../auth/LoginModal';
import RegisterModal from '../../auth/RegisterModal';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Navbar: React.FC = () => {
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { t, i18n } = useTranslation('navbar');
  const currentLang = i18n.language.startsWith('es') ? 'es' : 'en';

  useEffect(() => {
    const closeMenu = () => setShowUserMenu(false);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUserMenu(!showUserMenu);
  };

  const changeLang = (lng: 'es' | 'en') => {
    i18n.changeLanguage(lng);
  };

  return (
    <>
      <nav className="navbar">
        <div>
          <img src="/logo.png" alt="Logo" className="logo" />
        </div>

        <div className="nav-links">
          <Link to="/">{t('home')}</Link>
          <Link to="/espanya">{t('spain')}</Link>
          <Link to="/dubai">{t('dubai')}</Link>
          <Link to="/romania">{t('romania')}</Link>

          {/* Dropdown Agencia */}
          <div className="nav-item dropdown" tabIndex={0}>
            <span className="dropdown-toggle">{t('agency')}</span>
            <div className="dropdown-menu">
              <Link to="/who" className="dropdown-item">{t('who')}</Link>
              <Link to="/servicios" className="dropdown-item">{t('services')}</Link>
            </div>
          </div>

          <Link to="/contacto">{t('contact')}</Link>

          {user ? (
            <div className="user-menu-container" onClick={handleMenuClick}>
              <img src="/user-profile.svg" alt="Usuario" className="user-icon" />
              {showUserMenu && (
                <div className="user-menu-dropdown">
                  <button onClick={() => navigate('/profile')} style={{ color: '#000' }}>
                    {t('profile')}
                  </button>
                  <button onClick={() => navigate('/favoritos')} style={{ color: '#000' }}>
                    {t('favorites')}
                  </button>
                  <button onClick={logout}>{t('logout')}</button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthModal('login')}
              className="login-button"
              style={{ color: '#2563eb', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              {t('login')}
            </button>
          )}

          <span className="language-selector">
            <button
              onClick={() => changeLang('es')}
              style={{ fontWeight: currentLang === 'es' ? 700 : 400 }}
            >
              {t('spanish')}
            </button>
            {' | '}
            <button
              onClick={() => changeLang('en')}
              style={{ fontWeight: currentLang === 'en' ? 700 : 400 }}
            >
              {t('english')}
            </button>
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
