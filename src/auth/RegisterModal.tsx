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
  const [apellidos, setApellidos] = useState('');
  const [telefonoPrincipal, setTelefonoPrincipal] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState(''); // yyyy-mm-dd
  const [genero, setGenero] = useState<'masculino' | 'femenino' | 'no_binario' | 'prefiero_no_decirlo' | ''>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      alert('Las contraseñas no coinciden');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      alert('Email no válido');
      return;
    }
    if (!/^\+?\d[\d\s\-]{5,}$/.test(telefonoPrincipal)) {
      alert('Teléfono no válido');
      return;
    }

    try {
      await signUp(email, password);

      // Guardamos los datos para completarlos tras la confirmación y primer login
      localStorage.setItem('pending_nombre', nombre);
      localStorage.setItem('pending_apellidos', apellidos);
      localStorage.setItem('pending_telefono_principal', telefonoPrincipal);
      localStorage.setItem('pending_fecha_nacimiento', fechaNacimiento || '');
      localStorage.setItem('pending_genero', genero || '');
      // El email lo mete el trigger en datos_contacto

      alert('Cuenta creada. Revisa tu email para confirmar y luego inicia sesión.');
      onClose();
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
          <input type="text" placeholder="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} required />
          <input type="tel" placeholder="Teléfono principal" value={telefonoPrincipal} onChange={(e) => setTelefonoPrincipal(e.target.value)} required />
          <input type="date" placeholder="Fecha de nacimiento" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
          <select value={genero} onChange={(e) => setGenero(e.target.value as any)}>
            <option value="">Género (opcional)</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="no_binario">No binario</option>
            <option value="prefiero_no_decirlo">Prefiero no decirlo</option>
          </select>
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
