import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

type Mode = 'login' | 'register' | null;

const AuthWrapper: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>(null);

  // Abrir por query param: ?auth=login | register
  useEffect(() => {
    const q = searchParams.get('auth');
    if (q === 'login' || q === 'register') setMode(q);
  }, [searchParams]);

  // Cerrar al autenticar correctamente
  useEffect(() => {
    if (user && mode) {
      setMode(null);
      if (searchParams.get('auth')) {
        const sp = new URLSearchParams(searchParams);
        sp.delete('auth');
        setSearchParams(sp, { replace: true });
      }
    }
  }, [user, mode, searchParams, setSearchParams]);

  const close = useCallback(() => {
    setMode(null);
    if (searchParams.get('auth')) {
      const sp = new URLSearchParams(searchParams);
      sp.delete('auth');
      setSearchParams(sp, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <>
      {mode === 'login' && (
        <LoginModal
          onClose={close}
          onSwitchToRegister={() => setMode('register')}
        />
      )}
      {mode === 'register' && (
        <RegisterModal
          onClose={close}
          onSwitchToLogin={() => setMode('login')}
        />
      )}
    </>
  );
};

export default AuthWrapper;
