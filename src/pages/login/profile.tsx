import React from 'react';
import './profile.css';
import { useProfileData } from './profileData';

const Profiles: React.FC = () => {
  const {
    user, logout,
    loading, successMessage, errorMessage,

    // toggles
    editBasic, setEditBasic,
    editContact, setEditContact,
    editPrefInmo, setEditPrefInmo,
    editSocio, setEditSocio,
    editFinan, setEditFinan,
    editComms, setEditComms,

    // data + setters
    basic, setBasic,
    contact, setContact,
    prefInmo, setPrefInmo,
    socio, setSocio,
    finan, setFinan,
    comms, setComms,

    // acciones
    handleSaveBasic,
    handleSaveContact,
    handleSavePrefInmo,
    handleSaveSocio,
    handleSaveFinan,
    handleSaveComms,

    // contraseña
    showChangePassword, setShowChangePassword,
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmNewPassword, setConfirmNewPassword,
    passwordMessage, handlePasswordChange,

    // favoritos
    favoritos,
  } = useProfileData();

  if (!user) return null;

  return (
    <div className="profile-container">
      <h1 className="profile-title">Perfil de Usuario</h1>

      <div className="profile-info">
        <p><strong>Email (login):</strong> {user.email}</p>
      </div>

      {/* ====== Datos básicos ====== */}
      <h2 className="profile-title">Datos básicos</h2>
      <div className="profile-info">
        {editBasic ? (
          <>
            <label>Nombre:</label>
            <input className="profile-input" value={basic.nombre} onChange={(e)=>setBasic({...basic, nombre:e.target.value})} />
            <label>Apellidos:</label>
            <input className="profile-input" value={basic.apellidos} onChange={(e)=>setBasic({...basic, apellidos:e.target.value})} />
            <label>Fecha de nacimiento:</label>
            <input className="profile-input" type="date" value={basic.fecha_nacimiento} onChange={(e)=>setBasic({...basic, fecha_nacimiento:e.target.value})} />
            <label>Género:</label>
            <select className="profile-input" value={basic.genero} onChange={(e)=>setBasic({...basic, genero: e.target.value as any})}>
              <option value="">Selecciona…</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="no_binario">No binario</option>
              <option value="prefiero_no_decirlo">Prefiero no decirlo</option>
            </select>
            <div className="profile-buttons">
              <button className="save-button" onClick={handleSaveBasic}>Guardar</button>
              <button className="cancel-button" onClick={()=>setEditBasic(false)}>Cancelar</button>
            </div>
          </>
        ) : (
          <>
            <p><strong>Nombre:</strong> {basic.nombre || '—'}</p>
            <p><strong>Apellidos:</strong> {basic.apellidos || '—'}</p>
            <p><strong>Fecha de nacimiento:</strong> {basic.fecha_nacimiento || '—'}</p>
            <p><strong>Género:</strong> {basic.genero || '—'}</p>
            <div className="profile-buttons">
              <button className="edit-button" onClick={()=>setEditBasic(true)}>Editar datos básicos</button>
            </div>
          </>
        )}
      </div>

      {/* ====== Contacto ====== */}
      <h2 className="profile-title">Datos de contacto</h2>
      <div className="profile-info">
        <p><strong>Email de contacto:</strong> {contact.email_from_auth || '—'}</p>
        {editContact ? (
          <>
            <label>Teléfono principal:</label>
            <input className="profile-input" value={contact.telefono_principal} onChange={(e)=>setContact({...contact, telefono_principal:e.target.value})} />
            <label>Teléfono alternativo:</label>
            <input className="profile-input" value={contact.telefono_alternativo} onChange={(e)=>setContact({...contact, telefono_alternativo:e.target.value})} />
            <label>Dirección (línea 1):</label>
            <input className="profile-input" value={contact.direccion_linea1} onChange={(e)=>setContact({...contact, direccion_linea1:e.target.value})} />
            <label>Dirección (línea 2):</label>
            <input className="profile-input" value={contact.direccion_linea2} onChange={(e)=>setContact({...contact, direccion_linea2:e.target.value})} />
            <label>Ciudad:</label>
            <input className="profile-input" value={contact.ciudad} onChange={(e)=>setContact({...contact, ciudad:e.target.value})} />
            <label>Código postal:</label>
            <input className="profile-input" value={contact.codigo_postal} onChange={(e)=>setContact({...contact, codigo_postal:e.target.value})} />
            <label>País:</label>
            <input className="profile-input" value={contact.pais} onChange={(e)=>setContact({...contact, pais:e.target.value})} />
            <label>Nacionalidad:</label>
            <input className="profile-input" value={contact.nacionalidad} onChange={(e)=>setContact({...contact, nacionalidad:e.target.value})} />
            <div className="profile-buttons">
              <button className="save-button" onClick={handleSaveContact}>Guardar</button>
              <button className="cancel-button" onClick={()=>setEditContact(false)}>Cancelar</button>
            </div>
          </>
        ) : (
          <>
            <p><strong>Teléfono principal:</strong> {contact.telefono_principal || '—'}</p>
            <p><strong>Teléfono alternativo:</strong> {contact.telefono_alternativo || '—'}</p>
            <p><strong>Dirección:</strong> {contact.direccion_linea1 || '—'} {contact.direccion_linea2}</p>
            <p><strong>Ciudad / CP / País:</strong> {contact.ciudad || '—'} {contact.codigo_postal ? `(${contact.codigo_postal})` : ''} {contact.pais ? `- ${contact.pais}` : ''}</p>
            <p><strong>Nacionalidad:</strong> {contact.nacionalidad || '—'}</p>
            <div className="profile-buttons">
              <button className="edit-button" onClick={()=>setEditContact(true)}>Editar contacto</button>
              <button className="logout-button" onClick={logout}>Cerrar sesión</button>
            </div>
          </>
        )}
      </div>

      {/* ====== Preferencias inmobiliarias ====== */}
      <h2 className="profile-title">Preferencias inmobiliarias</h2>
      <div className="profile-info">
        {editPrefInmo ? (
          <>
            <label>Tipos preferidos (coma-separado):</label>
            <input
              className="profile-input"
              value={prefInmo.tipos_propiedad_preferidos.join(', ')}
              onChange={(e)=>setPrefInmo({...prefInmo, tipos_propiedad_preferidos: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
            />
            <label>Ubicaciones preferidas (coma-separado):</label>
            <input
              className="profile-input"
              value={prefInmo.ubicaciones_preferidas.join(', ')}
              onChange={(e)=>setPrefInmo({...prefInmo, ubicaciones_preferidas: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
            />
            <label>Presupuesto mínimo (€):</label>
            <input className="profile-input" type="number" value={prefInmo.presupuesto_min ?? ''} onChange={(e)=>setPrefInmo({...prefInmo, presupuesto_min: e.target.value===''?null:Number(e.target.value)})} />
            <label>Presupuesto máximo (€):</label>
            <input className="profile-input" type="number" value={prefInmo.presupuesto_max ?? ''} onChange={(e)=>setPrefInmo({...prefInmo, presupuesto_max: e.target.value===''?null:Number(e.target.value)})} />
            <label>Dormitorios:</label>
            <input className="profile-input" type="number" value={prefInmo.dormitorios ?? ''} onChange={(e)=>setPrefInmo({...prefInmo, dormitorios: e.target.value===''?null:Number(e.target.value)})} />
            <label>Baños:</label>
            <input className="profile-input" type="number" value={prefInmo.banos ?? ''} onChange={(e)=>setPrefInmo({...prefInmo, banos: e.target.value===''?null:Number(e.target.value)})} />
            <label>Operación:</label>
            <select className="profile-input" value={prefInmo.operacion} onChange={(e)=>setPrefInmo({...prefInmo, operacion: e.target.value as any})}>
              <option value="">Selecciona…</option>
              <option value="compra">Compra</option>
              <option value="alquiler">Alquiler</option>
              <option value="ambas">Ambas</option>
            </select>
            <label>Interés principal:</label>
            <select className="profile-input" value={prefInmo.interes_principal} onChange={(e)=>setPrefInmo({...prefInmo, interes_principal: e.target.value as any})}>
              <option value="">Selecciona…</option>
              <option value="inversion">Inversión</option>
              <option value="vivienda">Vivienda propia</option>
              <option value="segunda_residencia">Segunda residencia</option>
            </select>
            <div className="profile-buttons">
              <button className="save-button" onClick={handleSavePrefInmo}>Guardar</button>
              <button className="cancel-button" onClick={()=>setEditPrefInmo(false)}>Cancelar</button>
            </div>
          </>
        ) : (
          <>
            <p><strong>Tipos:</strong> {prefInmo.tipos_propiedad_preferidos.join(', ') || '—'}</p>
            <p><strong>Ubicaciones:</strong> {prefInmo.ubicaciones_preferidas.join(', ') || '—'}</p>
            <p><strong>Presupuesto:</strong> {prefInmo.presupuesto_min ?? '—'} – {prefInmo.presupuesto_max ?? '—'} €</p>
            <p><strong>Dormitorios / Baños:</strong> {prefInmo.dormitorios ?? '—'} / {prefInmo.banos ?? '—'}</p>
            <p><strong>Operación:</strong> {prefInmo.operacion || '—'}</p>
            <p><strong>Interés:</strong> {prefInmo.interes_principal || '—'}</p>
            <div className="profile-buttons">
              <button className="edit-button" onClick={()=>setEditPrefInmo(true)}>Editar preferencias</button>
            </div>
          </>
        )}
      </div>

      {/* ====== Sociodemográfica ====== */}
      <h2 className="profile-title">Información sociodemográfica</h2>
      <div className="profile-info">
        {editSocio ? (
          <>
            <label>Estado civil:</label>
            <select className="profile-input" value={socio.estado_civil} onChange={(e)=>setSocio({...socio, estado_civil: e.target.value as any})}>
              <option value="">Selecciona…</option>
              <option value="soltero">Soltero/a</option>
              <option value="casado">Casado/a</option>
              <option value="pareja">Pareja</option>
              <option value="otro">Otro</option>
            </select>
            <label>Ocupación:</label>
            <input className="profile-input" value={socio.ocupacion} onChange={(e)=>setSocio({...socio, ocupacion:e.target.value})} />
            <label>Ingresos anuales mín (€):</label>
            <input className="profile-input" type="number" value={socio.ingresos_anuales_min ?? ''} onChange={(e)=>setSocio({...socio, ingresos_anuales_min: e.target.value===''?null:Number(e.target.value)})} />
            <label>Ingresos anuales máx (€):</label>
            <input className="profile-input" type="number" value={socio.ingresos_anuales_max ?? ''} onChange={(e)=>setSocio({...socio, ingresos_anuales_max: e.target.value===''?null:Number(e.target.value)})} />
            <label>Situación laboral:</label>
            <select className="profile-input" value={socio.situacion_laboral} onChange={(e)=>setSocio({...socio, situacion_laboral: e.target.value as any})}>
              <option value="">Selecciona…</option>
              <option value="empleado">Empleado</option>
              <option value="autonomo">Autónomo</option>
              <option value="jubilado">Jubilado</option>
              <option value="estudiante">Estudiante</option>
              <option value="otro">Otro</option>
            </select>
            <div className="profile-buttons">
              <button className="save-button" onClick={handleSaveSocio}>Guardar</button>
              <button className="cancel-button" onClick={()=>setEditSocio(false)}>Cancelar</button>
            </div>
          </>
        ) : (
          <>
            <p><strong>Estado civil:</strong> {socio.estado_civil || '—'}</p>
            <p><strong>Ocupación:</strong> {socio.ocupacion || '—'}</p>
            <p><strong>Ingresos (mín–máx):</strong> {socio.ingresos_anuales_min ?? '—'} – {socio.ingresos_anuales_max ?? '—'} €</p>
            <p><strong>Situación laboral:</strong> {socio.situacion_laboral || '—'}</p>
            <div className="profile-buttons">
              <button className="edit-button" onClick={()=>setEditSocio(true)}>Editar sociodemográfica</button>
            </div>
          </>
        )}
      </div>

      {/* ====== Financiera ====== */}
      <h2 className="profile-title">Información financiera</h2>
      <div className="profile-info">
        {editFinan ? (
          <>
            <label>Capacidad de financiación estimada (€):</label>
            <input className="profile-input" type="number" value={finan.capacidad_financiacion_estimada ?? ''} onChange={(e)=>setFinan({...finan, capacidad_financiacion_estimada: e.target.value===''?null:Number(e.target.value)})} />
            <label>¿Interesado en hipoteca?</label>
            <select className="profile-input" value={finan.interes_hipoteca === null ? '' : finan.interes_hipoteca ? 'si' : 'no'}
              onChange={(e)=>setFinan({...finan, interes_hipoteca: e.target.value===''?null:(e.target.value==='si')})}>
              <option value="">Selecciona…</option>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
            <label>Banco de referencia:</label>
            <input className="profile-input" value={finan.banco_referencia} onChange={(e)=>setFinan({...finan, banco_referencia: e.target.value})} />
            <div className="profile-buttons">
              <button className="save-button" onClick={handleSaveFinan}>Guardar</button>
              <button className="cancel-button" onClick={()=>setEditFinan(false)}>Cancelar</button>
            </div>
          </>
        ) : (
          <>
            <p><strong>Capacidad financiación:</strong> {finan.capacidad_financiacion_estimada ?? '—'} €</p>
            <p><strong>Interés hipoteca:</strong> {finan.interes_hipoteca === null ? '—' : (finan.interes_hipoteca ? 'Sí' : 'No')}</p>
            <p><strong>Banco referencia:</strong> {finan.banco_referencia || '—'}</p>
            <div className="profile-buttons">
              <button className="edit-button" onClick={()=>setEditFinan(true)}>Editar financiera</button>
            </div>
          </>
        )}
      </div>

      {/* ====== Preferencias de comunicación ====== */}
      <h2 className="profile-title">Preferencias de comunicación</h2>
      <div className="profile-info">
        {editComms ? (
          <>
            <label>Idioma preferido:</label>
            <select className="profile-input" value={comms.idioma_preferido} onChange={(e)=>setComms({...comms, idioma_preferido: e.target.value})}>
              <option value="">Selecciona…</option>
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="ro">Română</option>
            </select>
            <label>Canal preferido:</label>
            <select className="profile-input" value={comms.canal_preferido} onChange={(e)=>setComms({...comms, canal_preferido: e.target.value as any})}>
              <option value="">Selecciona…</option>
              <option value="email">Email</option>
              <option value="telefono">Teléfono</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
            <label>Horario preferido:</label>
            <select className="profile-input" value={comms.horario_preferido} onChange={(e)=>setComms({...comms, horario_preferido: e.target.value as any})}>
              <option value="">Selecciona…</option>
              <option value="manana">Mañana</option>
              <option value="tarde">Tarde</option>
              <option value="fin_de_semana">Fin de semana</option>
              <option value="indistinto">Indistinto</option>
            </select>
            <div className="profile-buttons">
              <button className="save-button" onClick={handleSaveComms}>Guardar</button>
              <button className="cancel-button" onClick={()=>setEditComms(false)}>Cancelar</button>
            </div>
          </>
        ) : (
          <>
            <p><strong>Idioma:</strong> {comms.idioma_preferido || '—'}</p>
            <p><strong>Canal:</strong> {comms.canal_preferido || '—'}</p>
            <p><strong>Horario:</strong> {comms.horario_preferido || '—'}</p>
            <div className="profile-buttons">
              <button className="edit-button" onClick={()=>setEditComms(true)}>Editar preferencias de comunicación</button>
            </div>
          </>
        )}
      </div>

      {/* ===== Mensajes / carga ===== */}
      {loading && <p className="success-message">Cargando…</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <hr />

      {/* ====== Cambio de contraseña ====== */}
      <button
        className="edit-button"
        style={{ marginBottom: '10px' }}
        onClick={() => setShowChangePassword(!showChangePassword)}
      >
        {showChangePassword ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
      </button>

      {showChangePassword && (
        <div className="password-change-form">
          <input className="profile-input" type="password" placeholder="Contraseña actual" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} />
          <input className="profile-input" type="password" placeholder="Nueva contraseña" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} />
          <input className="profile-input" type="password" placeholder="Confirmar nueva contraseña" value={confirmNewPassword} onChange={(e)=>setConfirmNewPassword(e.target.value)} />
          <button className="save-button" onClick={handlePasswordChange}>Actualizar contraseña</button>
          {passwordMessage && <p className="success-message">{passwordMessage}</p>}
        </div>
      )}

      {/* ====== Favoritos ====== */}
      {favoritos.length > 0 ? (
        <>
          <h2 className="profile-title" style={{ marginTop: '40px' }}>Propiedades Favoritas</h2>
          <div className="favoritos-grid">
            {favoritos.map((fav) => (
              <div key={fav.id} className="favorito-card">
                {fav.imagen ? (
                  <img src={fav.imagen} alt={fav.titulo} className="favorito-img" />
                ) : (
                  <div className="favorito-img" style={{display:'flex',alignItems:'center',justifyContent:'center',background:'#f3f4f6',color:'#6b7280'}}>Sin imagen</div>
                )}
                <div className="favorito-info">
                  <h3>{fav.titulo}</h3>
                  <p>{fav.ciudad || '—'}{fav.zona ? ` - ${fav.zona}` : ''}</p>
                  <p><strong>{Number(fav.precio || 0).toLocaleString()} €</strong></p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="success-message" style={{ marginTop: 20 }}>Aún no tienes favoritos guardados.</p>
      )}
    </div>
  );
};

export default Profiles;
