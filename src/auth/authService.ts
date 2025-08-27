import { supabase } from '../lib/supabaseClient';

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const insertUserData = async (user_id: string, email: string, nombre: string, telefono: string) => {
  const { error } = await supabase.from('usuarios').insert([
    { user_id, email, nombre, telefono },
  ]);
  if (error) throw error;
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
