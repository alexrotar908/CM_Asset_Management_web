import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import './Profile.css';

interface Favorita {
  id: string;
  propiedad_id: string;
  propiedades: {
    titulo: string;
    precio: number;
    imagen: string;
    ciudad: string;
    zona: string;
  };
}

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [favoritos, setFavoritos] = useState<Favorita[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchUserData = async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('nombre, telefono')
        .eq('user_id', user.id!)
        .single();

      if (data && !error) {
        setNombre(data.nombre || '');
        setTelefono(data.telefono || '');
      }
    };

    const fetchFavoritos = async () => {
  const { data, error } = await supabase
    .from('favoritos')
    .select(`
      id,
      propiedad_id,
      propiedades (
        titulo,
        precio,
        imagen,
        ciudad,
        zona
      )
    `)
    .eq('user_id', user.id);

  if (!error && data) {
    const normalizados = data.map((fav: any) => ({
      ...fav,
      propiedades: Array.isArray(fav.propiedades)
        ? fav.propiedades[0]
        : fav.propiedades,
    }));

    setFavoritos(normalizados);
  } else {
    console.error('Error al obtener favoritos:', error?.message);
  }
};

    fetchUserData();
    fetchFavoritos();
  }, [user, navigate]);

  const handleSave = async () => {
    if (!nombre.trim() || !telefono.trim()) {
      setSuccessMessage('Por favor, completa todos los campos');
      return;
    }

    const { error } = await supabase
      .from('usuarios')
      .update({ nombre, telefono })
      .eq('user_id', user!.id);

    if (error) {
      setSuccessMessage('Error al guardar los cambios');
    } else {
      setSuccessMessage('Datos actualizados correctamente');
      setEditMode(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordMessage('');

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage('Las contraseñas no coinciden');
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPassword,
    });

    if (loginError) {
      setPasswordMessage('Contraseña actual incorrecta');
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setPasswordMessage(`Error: ${updateError.message}`);
    } else {
      setPasswordMessage('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  if (!user) return null;

  return (
    <div className="profile-container">
      <h1 className="profile-title">Perfil de Usuario</h1>

      <div className="profile-info">
        <p><strong>Email:</strong> {user.email}</p>

        {editMode ? (
          <>
            <label>Nombre:</label>
            <input
              className="profile-input"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <label>Teléfono:</label>
            <input
              className="profile-input"
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </>
        ) : (
          <>
            <p><strong>Nombre:</strong> {nombre}</p>
            <p><strong>Teléfono:</strong> {telefono}</p>
          </>
        )}
      </div>

      <div className="profile-buttons">
        {editMode ? (
          <>
            <button className="save-button" onClick={handleSave}>Guardar</button>
            <button className="cancel-button" onClick={() => setEditMode(false)}>Cancelar</button>
          </>
        ) : (
          <button className="edit-button" onClick={() => setEditMode(true)}>Editar datos</button>
        )}
        <button className="logout-button" onClick={logout}>Cerrar sesión</button>
      </div>

      {successMessage && <p className="success-message">{successMessage}</p>}

      <hr style={{ margin: '30px 0' }} />

      <button
        className="edit-button"
        style={{ marginBottom: '10px' }}
        onClick={() => setShowChangePassword(!showChangePassword)}
      >
        {showChangePassword ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
      </button>

      {showChangePassword && (
        <div className="password-change-form">
          <input
            className="profile-input"
            type="password"
            placeholder="Contraseña actual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <input
            className="profile-input"
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            className="profile-input"
            type="password"
            placeholder="Confirmar nueva contraseña"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
          <button className="save-button" onClick={handlePasswordChange}>Actualizar contraseña</button>
          {passwordMessage && <p className="success-message">{passwordMessage}</p>}
        </div>
      )}

      {favoritos.length > 0 && (
        <>
          <h2 className="profile-title" style={{ marginTop: '40px' }}>Propiedades Favoritas</h2>
          <div className="favoritos-grid">
            {favoritos.map((fav) => (
              <div key={fav.id} className="favorito-card">
                <img src={fav.propiedades.imagen} alt={fav.propiedades.titulo} className="favorito-img" />
                <div className="favorito-info">
                  <h3>{fav.propiedades.titulo}</h3>
                  <p>{fav.propiedades.ciudad} - {fav.propiedades.zona}</p>
                  <p><strong>{fav.propiedades.precio.toLocaleString()} €</strong></p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;
