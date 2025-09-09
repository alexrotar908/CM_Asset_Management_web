// src/pages/ResetPassword.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useSearchParams } from 'react-router-dom';

const parseHashParams = () => {
  // soporta enlaces con tokens en el hash: #access_token=...&refresh_token=...
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  return { access_token, refresh_token };
};

const passwordIsStrong = (pwd: string) => {
  // regla simple: mínimo 8 chars; añade lo que quieras (número, mayúscula, etc.)
  return pwd.length >= 8;
};

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Nuevo flujo (PKCE): ?code=...
  const code = searchParams.get('code');

  // Flujo antiguo: #access_token & #refresh_token o ?access_token=&refresh_token=
  const queryAccess = searchParams.get('access_token');
  const queryRefresh = searchParams.get('refresh_token');
  const hashTokens = useMemo(parseHashParams, []);
  const access_token = queryAccess || hashTokens.access_token || null;
  const refresh_token = queryRefresh || hashTokens.refresh_token || null;

  useEffect(() => {
    const establishSession = async () => {
      try {
        // 1) Nuevo flujo: exchangeCodeForSession
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (!data?.session) throw new Error('No se pudo establecer la sesión (code).');
          setMessage('Código verificado. Ya puedes cambiar tu contraseña.');
          return;
        }

        // 2) Flujo antiguo: setSession con access/refresh
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
          setMessage('Sesión verificada. Ya puedes cambiar tu contraseña.');
          return;
        }

        // Si no hay nada válido
        setMessage('Enlace no válido o caducado. Solicita de nuevo el cambio de contraseña.');
      } catch (err: any) {
        setMessage('No se pudo verificar el enlace. Solicita de nuevo el cambio de contraseña.');
      }
    };

    establishSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, access_token, refresh_token]);

  const handleReset = async () => {
    setMessage('');
    if (newPassword !== confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      return;
    }
    if (!passwordIsStrong(newPassword)) {
      setMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage('✅ Contraseña actualizada con éxito. Ya puedes iniciar sesión.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage('Error al actualizar la contraseña. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
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
        disabled={loading}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: loading ? '#6b7280' : '#0d2c54',
          color: '#fff',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Actualizando…' : 'Cambiar contraseña'}
      </button>

      {message && <p style={{ marginTop: '15px', color: '#333' }}>{message}</p>}
    </div>
  );
};

export default ResetPassword;
