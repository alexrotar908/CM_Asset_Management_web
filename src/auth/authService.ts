// src/auth/authService.ts
import { supabase } from '../lib/supabaseClient';

// ─────────────────────────────────────────────────────────────────────────────
// AUTH BÁSICO
// ─────────────────────────────────────────────────────────────────────────────
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS PARA PERFIL (tablas 1:1)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene la fila de `public.usuarios` por auth.uid (auth.users.id)
 * Devuelve id y las FK útiles para enlazar los bloques 1:1.
 */
export async function getUsuarioByAuthId(uid: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, datos_basicos_id, datos_contacto_id, preferencias_inmobiliarias_id, info_sociodemografica_id, info_financiera_id, preferencias_comunicacion_id')
    .eq('user_id', uid)
    .maybeSingle();

  if (error) throw error;
  return data; // puede ser null si aún no lo creó el trigger (haz retry fuera)
}

/**
 * Upsert en datos_basicos por usuario_id.
 * payload: { nombre?, apellidos?, fecha_nacimiento?, genero? }
 */
export async function upsertDatosBasicos(usuarioId: string, payload: {
  nombre?: string | null;
  apellidos?: string | null;
  fecha_nacimiento?: string | null; // 'YYYY-MM-DD'
  genero?: string | null;
}) {
  const { data, error } = await supabase
    .from('datos_basicos')
    .upsert({ usuario_id: usuarioId, ...payload }, { onConflict: 'usuario_id' })
    .select('id')
    .single();

  if (error) throw error;
  return data; // { id: uuid }
}

/**
 * Upsert en datos_contacto por usuario_id.
 * payload: { telefono_principal?, email? }  -> el email normalmente lo mete el trigger
 */
export async function upsertDatosContacto(usuarioId: string, payload: {
  telefono_principal?: string | null;
  email?: string | null;
}) {
  const { data, error } = await supabase
    .from('datos_contacto')
    .upsert({ usuario_id: usuarioId, ...payload }, { onConflict: 'usuario_id' })
    .select('id')
    .single();

  if (error) throw error;
  return data; // { id: uuid }
}

/**
 * Actualiza en `usuarios` las FK a bloques 1:1 (pasa solo las que tengas).
 * Ej: linkUsuariosFk(usuarioId, { datos_basicos_id: idDB, datos_contacto_id: idDC })
 */
export async function linkUsuariosFk(
  usuarioId: string,
  partialFk: Partial<{
    datos_basicos_id: string | null;
    datos_contacto_id: string | null;
    preferencias_inmobiliarias_id: string | null;
    info_sociodemografica_id: string | null;
    info_financiera_id: string | null;
    preferencias_comunicacion_id: string | null;
  }>
) {
  const { error } = await supabase
    .from('usuarios')
    .update(partialFk)
    .eq('id', usuarioId);

  if (error) throw error;
}
