import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

/** ===== Tipos ===== */
export type Genero =
  | 'masculino'
  | 'femenino'
  | 'no_binario'
  | 'prefiero_no_decirlo'
  | '';

export interface BasicData {
  nombre: string;
  apellidos: string;
  fecha_nacimiento: string; // yyyy-mm-dd
  genero: Genero;
}

export interface ContactData {
  email_from_auth: string; // solo lectura
  telefono_principal: string;
  telefono_alternativo: string;
  direccion_linea1: string;
  direccion_linea2: string;
  ciudad: string;
  codigo_postal: string;
  pais: string;
  nacionalidad: string;
}

export interface PrefInmoData {
  tipos_propiedad_preferidos: string[]; // text[]
  ubicaciones_preferidas: string[];     // text[]
  presupuesto_min: number | null;
  presupuesto_max: number | null;
  dormitorios: number | null;
  banos: number | null;
  operacion: 'compra' | 'alquiler' | 'ambas' | '';
  interes_principal: 'inversion' | 'vivienda' | 'segunda_residencia' | '';
}

export interface SocioData {
  estado_civil: 'soltero' | 'casado' | 'pareja' | 'otro' | '';
  ocupacion: string;
  ingresos_anuales_min: number | null;
  ingresos_anuales_max: number | null;
  situacion_laboral: 'empleado' | 'autonomo' | 'jubilado' | 'estudiante' | 'otro' | '';
}

export interface FinanData {
  capacidad_financiacion_estimada: number | null;
  interes_hipoteca: boolean | null;
  banco_referencia: string;
}

export interface CommsData {
  idioma_preferido: string; // 'es' | 'en' | 'ro' | ...
  canal_preferido: 'email' | 'telefono' | 'whatsapp' | '';
  horario_preferido: 'manana' | 'tarde' | 'fin_de_semana' | 'indistinto' | '';
}

export interface FavoritoCard {
  id: string;
  propiedad_id: string;
  titulo: string;
  precio: number;
  imagen: string | null;
  ciudad: string | null;
  zona: string | null;
}

interface UsuarioRow {
  id: string;
  datos_basicos_id?: string | null;
  datos_contacto_id?: string | null;
  preferencias_inmobiliarias_id?: string | null;
  info_sociodemografica_id?: string | null;
  info_financiera_id?: string | null;
  preferencias_comunicacion_id?: string | null;
}

/** ===== Hook principal ===== */
export function useProfileData() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // estado general
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // toggles de edición por bloque
  const [editBasic, setEditBasic] = useState(false);
  const [editContact, setEditContact] = useState(false);
  const [editPrefInmo, setEditPrefInmo] = useState(false);
  const [editSocio, setEditSocio] = useState(false);
  const [editFinan, setEditFinan] = useState(false);
  const [editComms, setEditComms] = useState(false);

  // password
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // ids
  const [usuarioId, setUsuarioId] = useState<string | null>(null);

  // datos por bloque
  const [basic, setBasic] = useState<BasicData>({
    nombre: '',
    apellidos: '',
    fecha_nacimiento: '',
    genero: '',
  });

  const [contact, setContact] = useState<ContactData>({
    email_from_auth: '',
    telefono_principal: '',
    telefono_alternativo: '',
    direccion_linea1: '',
    direccion_linea2: '',
    ciudad: '',
    codigo_postal: '',
    pais: '',
    nacionalidad: '',
  });

  const [prefInmo, setPrefInmo] = useState<PrefInmoData>({
    tipos_propiedad_preferidos: [],
    ubicaciones_preferidas: [],
    presupuesto_min: null,
    presupuesto_max: null,
    dormitorios: null,
    banos: null,
    operacion: '',
    interes_principal: '',
  });

  const [socio, setSocio] = useState<SocioData>({
    estado_civil: '',
    ocupacion: '',
    ingresos_anuales_min: null,
    ingresos_anuales_max: null,
    situacion_laboral: '',
  });

  const [finan, setFinan] = useState<FinanData>({
    capacidad_financiacion_estimada: null,
    interes_hipoteca: null,
    banco_referencia: '',
  });

  const [comms, setComms] = useState<CommsData>({
    idioma_preferido: '',
    canal_preferido: '',
    horario_preferido: '',
  });

  const [favoritos, setFavoritos] = useState<FavoritoCard[]>([]);

  const emailAuth = useMemo(() => user?.email ?? '', [user]);

  const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

  const getUsuarioWithRetry = async (uid: string) => {
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase
        .from('usuarios')
        .select(
          'id, datos_basicos_id, datos_contacto_id, preferencias_inmobiliarias_id, info_sociodemografica_id, info_financiera_id, preferencias_comunicacion_id'
        )
        .eq('user_id', uid)
        .maybeSingle();
      if (data?.id) return data as UsuarioRow;
      await wait(300);
    }
    return null;
  };

  /** Carga inicial */
  useEffect(() => {
    const init = async () => {
      if (!user) {
        navigate('/');
        return;
      }
      setLoading(true);
      setSuccessMessage('');
      setErrorMessage('');

      try {
        const u = await getUsuarioWithRetry(user.id);
        if (!u?.id) throw new Error('No se encontró el perfil de usuario.');
        setUsuarioId(u.id);

        // datos_basicos
        const { data: db } = await supabase
          .from('datos_basicos')
          .select('nombre, apellidos, fecha_nacimiento, genero')
          .eq('usuario_id', u.id)
          .maybeSingle();
        if (db) {
          setBasic({
            nombre: db.nombre ?? '',
            apellidos: db.apellidos ?? '',
            fecha_nacimiento: db.fecha_nacimiento ?? '',
            genero: (db.genero ?? '') as Genero,
          });
        }

        // datos_contacto
        const { data: dc } = await supabase
          .from('datos_contacto')
          .select('telefono_principal, telefono_alternativo, direccion_linea1, direccion_linea2, ciudad, codigo_postal, pais, nacionalidad, email')
          .eq('usuario_id', u.id)
          .maybeSingle();
        setContact({
          email_from_auth: emailAuth || dc?.email || '',
          telefono_principal: dc?.telefono_principal ?? '',
          telefono_alternativo: dc?.telefono_alternativo ?? '',
          direccion_linea1: dc?.direccion_linea1 ?? '',
          direccion_linea2: dc?.direccion_linea2 ?? '',
          ciudad: dc?.ciudad ?? '',
          codigo_postal: dc?.codigo_postal ?? '',
          pais: dc?.pais ?? '',
          nacionalidad: dc?.nacionalidad ?? '',
        });

        // preferencias_inmobiliarias
        const { data: pi } = await supabase
          .from('preferencias_inmobiliarias')
          .select(
            'tipos_propiedad_preferidos, ubicaciones_preferidas, presupuesto_min, presupuesto_max, dormitorios, banos, operacion, interes_principal'
          )
          .eq('usuario_id', u.id)
          .maybeSingle();
        if (pi) {
          setPrefInmo({
            tipos_propiedad_preferidos: pi.tipos_propiedad_preferidos ?? [],
            ubicaciones_preferidas: pi.ubicaciones_preferidas ?? [],
            presupuesto_min: pi.presupuesto_min ?? null,
            presupuesto_max: pi.presupuesto_max ?? null,
            dormitorios: pi.dormitorios ?? null,
            banos: pi.banos ?? null,
            operacion: pi.operacion ?? '',
            interes_principal: pi.interes_principal ?? '',
          });
        }

        // info_sociodemografica
        const { data: isd } = await supabase
          .from('info_sociodemografica')
          .select('estado_civil, ocupacion, ingresos_anuales_min, ingresos_anuales_max, situacion_laboral')
          .eq('usuario_id', u.id)
          .maybeSingle();
        if (isd) {
          setSocio({
            estado_civil: isd.estado_civil ?? '',
            ocupacion: isd.ocupacion ?? '',
            ingresos_anuales_min: isd.ingresos_anuales_min ?? null,
            ingresos_anuales_max: isd.ingresos_anuales_max ?? null,
            situacion_laboral: isd.situacion_laboral ?? '',
          });
        }

        // info_financiera
        const { data: ifin } = await supabase
          .from('info_financiera')
          .select('capacidad_financiacion_estimada, interes_hipoteca, banco_referencia')
          .eq('usuario_id', u.id)
          .maybeSingle();
        if (ifin) {
          setFinan({
            capacidad_financiacion_estimada: ifin.capacidad_financiacion_estimada ?? null,
            interes_hipoteca: typeof ifin.interes_hipoteca === 'boolean' ? ifin.interes_hipoteca : null,
            banco_referencia: ifin.banco_referencia ?? '',
          });
        }

        // preferencias_comunicacion
        const { data: pc } = await supabase
          .from('preferencias_comunicacion')
          .select('idioma_preferido, canal_preferido, horario_preferido')
          .eq('usuario_id', u.id)
          .maybeSingle();
        if (pc) {
          setComms({
            idioma_preferido: pc.idioma_preferido ?? '',
            canal_preferido: pc.canal_preferido ?? '',
            horario_preferido: pc.horario_preferido ?? '',
          });
        }

        // favoritos
        const { data: favs } = await supabase
          .from('favoritos')
          .select(`
            id,
            propiedad_id,
            propiedades (
              id,
              titulo,
              precio,
              imagen_principal,
              zona_id,
              zonas ( ciudad, area )
            )
          `)
          .eq('usuario_id', u.id)
          .order('id', { ascending: false });

        setFavoritos(
          (favs || []).map((f: any) => ({
            id: f.id,
            propiedad_id: f.propiedad_id,
            titulo: f.propiedades?.titulo ?? 'Propiedad',
            precio: f.propiedades?.precio ?? 0,
            imagen: f.propiedades?.imagen_principal ?? null,
            ciudad: f.propiedades?.zonas?.ciudad ?? null,
            zona: f.propiedades?.zonas?.area ?? null,
          }))
        );
      } catch (e: any) {
        setErrorMessage(e?.message || 'No se pudo cargar el perfil.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user, navigate, emailAuth]);

  /** ===== Guardados por bloque ===== */

  const handleSaveBasic = async () => {
    if (!usuarioId) return;
    setErrorMessage('');
    const { data, error } = await supabase
      .from('datos_basicos')
      .upsert(
        {
          usuario_id: usuarioId,
          nombre: basic.nombre || null,
          apellidos: basic.apellidos || null,
          fecha_nacimiento: basic.fecha_nacimiento || null,
          genero: basic.genero || null,
        },
        { onConflict: 'usuario_id' }
      )
      .select('id')
      .single();

    if (error) return setErrorMessage('Error al guardar datos básicos.');
    if (data?.id) await supabase.from('usuarios').update({ datos_basicos_id: data.id }).eq('id', usuarioId);
    setSuccessMessage('Datos básicos guardados correctamente.');
    setEditBasic(false);
  };

  const handleSaveContact = async () => {
    if (!usuarioId) return;
    setErrorMessage('');
    const { data, error } = await supabase
      .from('datos_contacto')
      .upsert(
        {
          usuario_id: usuarioId,
          telefono_principal: contact.telefono_principal || null,
          telefono_alternativo: contact.telefono_alternativo || null,
          direccion_linea1: contact.direccion_linea1 || null,
          direccion_linea2: contact.direccion_linea2 || null,
          ciudad: contact.ciudad || null,
          codigo_postal: contact.codigo_postal || null,
          pais: contact.pais || null,
          nacionalidad: contact.nacionalidad || null,
        },
        { onConflict: 'usuario_id' }
      )
      .select('id')
      .single();

    if (error) return setErrorMessage('Error al guardar contacto.');
    if (data?.id) await supabase.from('usuarios').update({ datos_contacto_id: data.id }).eq('id', usuarioId);
    setSuccessMessage('Datos de contacto guardados correctamente.');
    setEditContact(false);
  };

  const handleSavePrefInmo = async () => {
    if (!usuarioId) return;
    setErrorMessage('');
    const { data, error } = await supabase
      .from('preferencias_inmobiliarias')
      .upsert(
        {
          usuario_id: usuarioId,
          tipos_propiedad_preferidos: prefInmo.tipos_propiedad_preferidos,
          ubicaciones_preferidas: prefInmo.ubicaciones_preferidas,
          presupuesto_min: prefInmo.presupuesto_min,
          presupuesto_max: prefInmo.presupuesto_max,
          dormitorios: prefInmo.dormitorios,
          banos: prefInmo.banos,
          operacion: prefInmo.operacion || null,
          interes_principal: prefInmo.interes_principal || null,
        },
        { onConflict: 'usuario_id' }
      )
      .select('id')
      .single();

    if (error) return setErrorMessage('Error al guardar preferencias inmobiliarias.');
    if (data?.id)
      await supabase.from('usuarios').update({ preferencias_inmobiliarias_id: data.id }).eq('id', usuarioId);
    setSuccessMessage('Preferencias inmobiliarias guardadas.');
    setEditPrefInmo(false);
  };

  const handleSaveSocio = async () => {
    if (!usuarioId) return;
    setErrorMessage('');
    const { data, error } = await supabase
      .from('info_sociodemografica')
      .upsert(
        {
          usuario_id: usuarioId,
          estado_civil: socio.estado_civil || null,
          ocupacion: socio.ocupacion || null,
          ingresos_anuales_min: socio.ingresos_anuales_min,
          ingresos_anuales_max: socio.ingresos_anuales_max,
          situacion_laboral: socio.situacion_laboral || null,
        },
        { onConflict: 'usuario_id' }
      )
      .select('id')
      .single();

    if (error) return setErrorMessage('Error al guardar datos sociodemográficos.');
    if (data?.id)
      await supabase.from('usuarios').update({ info_sociodemografica_id: data.id }).eq('id', usuarioId);
    setSuccessMessage('Datos sociodemográficos guardados.');
    setEditSocio(false);
  };

  const handleSaveFinan = async () => {
    if (!usuarioId) return;
    setErrorMessage('');
    const { data, error } = await supabase
      .from('info_financiera')
      .upsert(
        {
          usuario_id: usuarioId,
          capacidad_financiacion_estimada: finan.capacidad_financiacion_estimada,
          interes_hipoteca: finan.interes_hipoteca,
          banco_referencia: finan.banco_referencia || null,
        },
        { onConflict: 'usuario_id' }
      )
      .select('id')
      .single();

    if (error) return setErrorMessage('Error al guardar información financiera.');
    if (data?.id) await supabase.from('usuarios').update({ info_financiera_id: data.id }).eq('id', usuarioId);
    setSuccessMessage('Información financiera guardada.');
    setEditFinan(false);
  };

  const handleSaveComms = async () => {
    if (!usuarioId) return;
    setErrorMessage('');
    const { data, error } = await supabase
      .from('preferencias_comunicacion')
      .upsert(
        {
          usuario_id: usuarioId,
          idioma_preferido: comms.idioma_preferido || null,
          canal_preferido: comms.canal_preferido || null,
          horario_preferido: comms.horario_preferido || null,
        },
        { onConflict: 'usuario_id' }
      )
      .select('id')
      .single();

    if (error) return setErrorMessage('Error al guardar preferencias de comunicación.');
    if (data?.id)
      await supabase.from('usuarios').update({ preferencias_comunicacion_id: data.id }).eq('id', usuarioId);
    setSuccessMessage('Preferencias de comunicación guardadas.');
    setEditComms(false);
  };

  /** ===== Cambio de contraseña ===== */
  const handlePasswordChange = async () => {
    setPasswordMessage('');

    if (!user?.email) {
      setPasswordMessage('No se encontró el email del usuario.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage('Las contraseñas no coinciden');
      return;
    }
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (loginError) {
      setPasswordMessage('Contraseña actual incorrecta');
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setPasswordMessage(`Error: ${updateError.message}`);
    } else {
      setPasswordMessage('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  return {
    // auth & nav
    user,
    logout,

    // mensajes/estado
    loading,
    successMessage,
    errorMessage,
    setSuccessMessage,
    setErrorMessage,

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
  };
}
