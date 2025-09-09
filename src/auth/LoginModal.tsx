// src/auth/LoginModal.tsx
import React, { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
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
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);

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
      if (!email) {
        alert('Por favor, introduce tu email.');
        return;
      }
      try {
        setLoading(true);
        // Redirección dinámica: funciona en local y producción
        const redirectTo = `${window.location.origin}/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
        if (error) throw error;
        alert('Te hemos enviado un enlace para restablecer la contraseña.');
        setIsResetMode(false);
      } catch (err: any) {
        alert(err.message || 'Error al enviar el correo');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email.trim());
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // ❌ Ya no hacemos insert en `usuarios` ni usamos pendingNombre/Telefono/Email aquí.
      // ✅ El AuthContext completa el perfil con pending_* al detectar sesión.
      alert('Sesión iniciada correctamente');
      onClose();
    } catch (error: any) {
      alert(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
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
              <button type="submit" style={{ marginTop: '10px' }} disabled={loading}>
                {loading ? 'Enviando…' : 'Enviar enlace'}
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

              <button type="submit" disabled={loading}>
                {loading ? 'Entrando…' : 'Login'}
              </button>

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
