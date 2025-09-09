import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './favoritos.css';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

// ===== Tipos finales usados en el render =====
type Zona = {
  ciudad: string | null;
  area: string | null;
};

type Propiedad = {
  id: string;
  titulo: string;
  precio: number | null;
  imagen_principal: string | null;
  zonas?: Zona | null; // objeto o null
};

type FavoritoRow = {
  id: string;
  propiedad_id: string;
  propiedades?: Propiedad | null; // objeto o null
};

export default function Favoritos() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [favoritos, setFavoritos] = useState<FavoritoRow[]>([]);

  const isLogged = Boolean(user?.id);

 const goToDetail = (propId: string) => {
  navigate(`/propiedad/${propId}?ctx=fav`);
};

  useEffect(() => {
    const fetchFavoritos = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setErrorMsg(null);

      try {
        // 1) Obtener el id interno de tu tabla usuarios a partir de auth.user.id
        const { data: usuarioRows, error: usuarioErr } = await supabase
          .from('usuarios')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (usuarioErr) throw usuarioErr;

        if (!usuarioRows?.id) {
          setFavoritos([]);
          setLoading(false);
          return;
        }

        const usuarioId = usuarioRows.id as string;

        // 2) Traer favoritos (solo ids)
        const { data: favRows, error: favErr } = await supabase
          .from('favoritos')
          .select('id, propiedad_id')
          .eq('usuario_id', usuarioId)
          .order('id', { ascending: false });

        if (favErr) throw favErr;

        if (!favRows || favRows.length === 0) {
          setFavoritos([]);
          setLoading(false);
          return;
        }

        const propIds = favRows.map((f) => f.propiedad_id).filter(Boolean);

        // 3) Traer propiedades asociadas (+ zona)
        const { data: propsRows, error: propsErr } = await supabase
          .from('propiedades')
          .select(`
            id,
            titulo,
            precio,
            imagen_principal,
            zonas:zona_id (
              ciudad,
              area
            )
          `)
          .in('id', propIds);

        if (propsErr) throw propsErr;

        // 4) Indexar props por id y construir FavoritoRow[]
        const propsById = new Map<string, any>(
          (propsRows ?? []).map((p: any) => [p.id, p])
        );

        const normalized: FavoritoRow[] = favRows.map((fr: any) => {
          const p = propsById.get(fr.propiedad_id);
          return {
            id: fr.id,
            propiedad_id: fr.propiedad_id,
            propiedades: p
              ? {
                  id: p.id,
                  titulo: p.titulo,
                  precio: p.precio,
                  imagen_principal: p.imagen_principal,
                  zonas: p.zonas
                    ? { ciudad: p.zonas.ciudad ?? null, area: p.zonas.area ?? null }
                    : null,
                }
              : null,
          };
        });

        setFavoritos(normalized);
      } catch (err) {
        console.error(err);
        setErrorMsg('No se pudieron cargar tus favoritos. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchFavoritos();
  }, [user?.id]);

  const handleRemove = async (favId: string) => {
    if (!isLogged) return;
    try {
      const { error } = await supabase.from('favoritos').delete().eq('id', favId);
      if (error) throw error;
      setFavoritos((prev) => prev.filter((f) => f.id !== favId));
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudo eliminar de favoritos.');
    }
  };

  const content = useMemo(() => {
    if (!isLogged) {
      return (
        <div className="fav-empty">
          <p>Debes iniciar sesión para ver tus favoritos.</p>
        </div>
      );
    }
    if (loading) {
      return (
        <div className="fav-loading">
          <div className="spinner" />
          <p>Cargando tus favoritos...</p>
        </div>
      );
    }
    if (errorMsg) {
      return (
        <div className="fav-error">
          <p>{errorMsg}</p>
        </div>
      );
    }
    if (!favoritos.length) {
      return (
        <div className="fav-empty">
          <p>Aún no has guardado propiedades como favoritas.</p>
        </div>
      );
    }

    return (
      <div className="fav-grid">
        {favoritos.map((fav) => {
          const prop = fav.propiedades;
          if (!prop) return null;

          const ciudad = prop.zonas?.ciudad ?? '';
          const area = prop.zonas?.area ?? '';
          const ubicacion = [ciudad, area].filter(Boolean).join(' · ');

          return (
            <article key={fav.id} className="fav-card">
              <div className="fav-image" onClick={() => goToDetail(prop.id)}>
                <img
                  src={prop.imagen_principal || '/no-image.jpg'}
                  alt={prop.titulo}
                  loading="lazy"
                />
              </div>

              <div className="fav-body">
                <h3 className="fav-title" title={prop.titulo}>
                  {prop.titulo}
                </h3>

                <div className="fav-meta">
                  {ubicacion ? (
                    <span className="fav-location">{ubicacion}</span>
                  ) : (
                    <span>&nbsp;</span>
                  )}
                  {typeof prop.precio === 'number' && (
                    <span className="fav-price">
                      {prop.precio.toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  )}
                </div>

                <div className="fav-actions">
                  <button className="fav-btn detail" onClick={() => goToDetail(prop.id)}>
                    Ver detalle
                  </button>
                  <button className="fav-btn remove" onClick={() => handleRemove(fav.id)}>
                    Quitar
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  }, [isLogged, loading, errorMsg, favoritos]);

  return (
    <section className="favoritos-page">
      <div className="favoritos-container">
        <header className="fav-header">
          <h1>Mis Favoritos</h1>
          <p>Revisa y gestiona tus propiedades guardadas.</p>
        </header>
        {content}
      </div>
    </section>
  );
}
