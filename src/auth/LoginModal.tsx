// src/auth/LoginModal.tsx
import React, { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { insertUserData } from './authService';
import { supabase } from '../lib/supabaseClient';
import './auth.css';

interface LoginModalProps {
  onClose: () => void;
  onSwitchToRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false); // ← alterna entre login y reset

  useEffect(() => {
    const remembered = localStorage.getItem('rememberedEmail');
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isResetMode) {
      // Modo reset password
      if (!email) {
        alert('Por favor, introduce tu email.');
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:5173/reset-password',
      });

      if (error) {
        alert('Error al enviar el correo');
      } else {
        alert('Te hemos enviado un enlace para restablecer la contraseña');
        setIsResetMode(false); // Vuelve al login después
      }

      return;
    }

    try {
      await login(email, password);

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      const nombre = localStorage.getItem('pendingNombre');
      const telefono = localStorage.getItem('pendingTelefono');
      const pendingEmail = localStorage.getItem('pendingEmail');

      if (nombre && telefono && pendingEmail) {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) throw new Error('No se pudo obtener el usuario');

        await insertUserData(user.id, pendingEmail, nombre, telefono);

        localStorage.removeItem('pendingNombre');
        localStorage.removeItem('pendingTelefono');
        localStorage.removeItem('pendingEmail');
      }

      alert('Sesión iniciada correctamente');
      onClose();
    } catch (error: any) {
      alert(error.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="login-backdrop">
      <div className="login-modal">
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <h2 className="modal-title">{isResetMode ? 'Reset Password' : 'Login'}</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {isResetMode ? (
            <>
              <p style={{ fontSize: '14px', marginTop: '10px' }}>
                Te enviaremos un enlace para restablecer la contraseña.
              </p>
              <button type="submit" style={{ marginTop: '10px' }}>
                Enviar enlace
              </button>
              <div className="switch-link">
                <span className="link-text" onClick={() => setIsResetMode(false)}>
                  ← Volver al login
                </span>
              </div>
            </>
          ) : (
            <>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="login-extra-options">
                <label>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Recuérdame
                </label>
                <span className="forgot-password" onClick={() => setIsResetMode(true)}>
                  ¿Olvidaste tu contraseña?
                </span>
              </div>

              <button type="submit">Login</button>

              <div className="switch-link">
                ¿No tienes cuenta?{' '}
                <span className="link-text" onClick={onSwitchToRegister}>Regístrate</span>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
