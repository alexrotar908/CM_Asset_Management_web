import React, { useState } from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

const AuthWrapper = () => {
  const [modalType, setModalType] = useState<'login' | 'register' | null>('login');

  return (
    <>
      {modalType === 'login' && (
        <LoginModal
          onClose={() => setModalType(null)}
          onSwitchToRegister={() => setModalType('register')}
        />
      )}

      {modalType === 'register' && (
        <RegisterModal
          onClose={() => setModalType(null)}
          onSwitchToLogin={() => setModalType('login')}
        />
      )}
    </>
  );
};

export default AuthWrapper;
