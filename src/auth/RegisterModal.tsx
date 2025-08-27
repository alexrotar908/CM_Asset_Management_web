import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { signUp } from './authService';
import './auth.css';

interface RegisterModalProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ onClose, onSwitchToLogin }) => {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      alert('Las contraseñas no coinciden');
      return;
    }

    try {
      await signUp(email, password); // Solo signup
      // Guarda temporalmente nombre y telefono en localStorage
      localStorage.setItem('pendingNombre', nombre);
      localStorage.setItem('pendingTelefono', telefono);
      localStorage.setItem('pendingEmail', email);
      alert('Cuenta creada. Revisa tu email para confirmar y luego inicia sesión.');
      onClose(); // Cierra el modal
    } catch (error: any) {
      alert(error.message || 'Error al registrarse');
    }
  };

  return (
    <div className="login-backdrop">
      <div className="login-modal">
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <h2 className="modal-title">Registro</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          <input type="tel" placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input type="password" placeholder="Confirm Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <button type="submit">Registrarse</button>
        </form>
        <div className="switch-link">
          ¿Ya tienes cuenta? <span className="link-text" onClick={onSwitchToLogin}>Inicia sesión</span>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
