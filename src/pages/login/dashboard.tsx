import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/'); // Redirige al home si no hay sesión
    }
  }, [user, navigate]);

  if (!user) return null; // Evita parpadeos visuales

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>Bienvenido, <span style={{ color: '#0d2c54' }}>{user.email}</span></h1>
      <p style={{ margin: '20px 0' }}>Estás dentro del área privada del sistema.</p>
      <button
        onClick={logout}
        style={{
          padding: '10px 20px',
          background: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Cerrar sesión
      </button>
    </div>
  );
};

export default Dashboard;
