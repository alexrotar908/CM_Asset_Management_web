// src/pages/ResetPassword.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useSearchParams } from 'react-router-dom';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const access_token = searchParams.get('access_token');
  const refresh_token = searchParams.get('refresh_token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).catch((error) => {
        setMessage('Error al establecer la sesión. Token no válido o expirado');
      });
    } else {
      setMessage('Token no válido o expirado');
    }
  }, [access_token, refresh_token]);

  const handleReset = async () => {
    if (newPassword !== confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('✅ Contraseña actualizada con éxito. Ya puedes iniciar sesión.');
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '400px', margin: '50px auto' }}>
      <h2>Resetear Contraseña</h2>
      <input
        type="password"
        placeholder="Nueva contraseña"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        style={{ width: '100%', marginBottom: '10px', padding: '10px' }}
      />
      <input
        type="password"
        placeholder="Confirmar contraseña"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        style={{ width: '100%', marginBottom: '10px', padding: '10px' }}
      />
      <button
        onClick={handleReset}
        style={{ width: '100%', padding: '10px', backgroundColor: '#0d2c54', color: '#fff', border: 'none' }}
      >
        Cambiar contraseña
      </button>
      {message && <p style={{ marginTop: '15px', color: '#333' }}>{message}</p>}
    </div>
  );
};

export default ResetPassword;
