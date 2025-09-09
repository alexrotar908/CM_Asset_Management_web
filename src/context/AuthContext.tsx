// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const postRegSyncedRef = useRef(false); // evita ejecutar varias veces por sesión

  // ==== Helper: espera ms ====
  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

  // ==== Completar perfil tras primer login ====
  const completarPerfilPostRegistro = async (uid: string) => {
    // lee datos guardados en el registro
    const pending_nombre = localStorage.getItem('pending_nombre');
    const pending_apellidos = localStorage.getItem('pending_apellidos');
    const pending_tel = localStorage.getItem('pending_telefono_principal');
    const pending_fnac = localStorage.getItem('pending_fecha_nacimiento');
    const pending_genero = localStorage.getItem('pending_genero');

    // si no hay nada pendiente, no hacemos nada
    if (!pending_nombre && !pending_apellidos && !pending_tel && !pending_fnac && !pending_genero) return;

    // 1) Obtener public.usuarios.id (con retry por si el trigger aún no insertó)
    let usuarioRow: { id: string; datos_basicos_id?: string | null; datos_contacto_id?: string | null } | null = null;
    for (let i = 0; i < 5; i++) {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, datos_basicos_id, datos_contacto_id')
        .eq('user_id', uid)
        .maybeSingle();

      if (error) break;
      if (data?.id) {
        usuarioRow = data as any;
        break;
      }
      await sleep(400); // pequeño margen para que dispare el trigger de auth.users
    }
    if (!usuarioRow?.id) return;
    const usuarioId = usuarioRow.id;

    // 2) UPSERT datos_basicos (si hay info)
    if (pending_nombre || pending_apellidos || pending_fnac || pending_genero) {
      const { data: dbRes } = await supabase
        .from('datos_basicos')
        .upsert(
          {
            usuario_id: usuarioId,
            nombre: pending_nombre || null,
            apellidos: pending_apellidos || null,
            fecha_nacimiento: pending_fnac || null, // yyyy-mm-dd
            genero: pending_genero || null,
          },
          { onConflict: 'usuario_id' }
        )
        .select('id')
        .single();

      if (dbRes?.id && !usuarioRow.datos_basicos_id) {
        await supabase.from('usuarios').update({ datos_basicos_id: dbRes.id }).eq('id', usuarioId);
      }
    }

    // 3) UPSERT datos_contacto (teléfono principal). El email lo copia el trigger.
    if (pending_tel) {
      const { data: dcRes } = await supabase
        .from('datos_contacto')
        .upsert(
          {
            usuario_id: usuarioId,
            telefono_principal: pending_tel,
          },
          { onConflict: 'usuario_id' }
        )
        .select('id')
        .single();

      if (dcRes?.id && !usuarioRow.datos_contacto_id) {
        await supabase.from('usuarios').update({ datos_contacto_id: dcRes.id }).eq('id', usuarioId);
      }
    }

    // 4) Limpiar los pendientes
    localStorage.removeItem('pending_nombre');
    localStorage.removeItem('pending_apellidos');
    localStorage.removeItem('pending_telefono_principal');
    localStorage.removeItem('pending_fecha_nacimiento');
    localStorage.removeItem('pending_genero');
  };

  useEffect(() => {
    // Sesión inicial
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getSession();

    // Listener de cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // cuando hay user y aún no hemos sincronizado, completar perfil
      if (session?.user && !postRegSyncedRef.current) {
        postRegSyncedRef.current = true;
        completarPerfilPostRegistro(session.user.id).catch(() => {
          // no romper el flujo si falla
        });
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Por si el usuario ya estaba logueado al montar el provider
  useEffect(() => {
    if (user && !postRegSyncedRef.current) {
      postRegSyncedRef.current = true;
      completarPerfilPostRegistro(user.id).catch(() => {});
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setUser(data.user);
    // completar en login manual también
    if (data.user && !postRegSyncedRef.current) {
      postRegSyncedRef.current = true;
      completarPerfilPostRegistro(data.user.id).catch(() => {});
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    postRegSyncedRef.current = false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
