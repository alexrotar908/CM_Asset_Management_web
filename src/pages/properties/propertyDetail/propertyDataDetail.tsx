import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import PropertyDetails from './propertyDetail';

// ===== Tipos compartidos =====
export type Status = 'BUY' | 'RENT' | 'RENTED';

export interface PropertyRow {
  id: string;
  titulo: string;
  descripcion?: string | null;
  precio: number;
  dormitorios?: number | null;
  banos?: number | null;
  metros_cuadrados?: number | null;
  estado_propiedad?: Status | null;
  imagen_principal?: string | null;
  tipo_id?: string | null;
  zona_id?: string | null;

  // Campos que vendrán desde property_detail:
  direccion?: string | null;
  codigo_postal?: string | null;
  lat?: number | null;
  lng?: number | null;
  ref_code?: string | null;
}

export interface ZonaRow { id: string; pais?: string|null; ciudad?: string|null; area?: string|null; }
export interface TipoRow { id: string; nombre?: string|null; slug?: string|null; }
export interface ImagenRow { id: string; url: string; categoria?: string|null; propiedad_id: string; }

// ===== Helpers para normalizar URLs de imágenes =====
const isGood = (u?: string | null) =>
  !!u && typeof u === 'string' && u.trim() !== '' && u.trim().toLowerCase() !== 'null';

const toPublicUrl = (u: string) => {
  const base = (import.meta as any).env?.VITE_SUPABASE_URL?.replace(/\/+$/, '') || '';
  const clean = u.trim().replace(/^\/+/, '');

  if (/^https?:\/\//i.test(clean) || clean.startsWith('data:')) return clean;
  if (clean.startsWith('storage/v1/object/public/')) return `${base}/${clean}`;
  return `${base}/storage/v1/object/public/${clean}`;
};

const unique = (arr: string[]) => Array.from(new Set(arr));

export default function PropertyDataDetails() {
  const { id } = useParams();
  const location = useLocation() as { state?: { images?: string[] } };
  const preloadImages = (location.state?.images ?? []).filter(isGood).map(toPublicUrl);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [prop, setProp] = useState<PropertyRow | null>(null);
  const [zona, setZona] = useState<ZonaRow | null>(null);
  const [tipo, setTipo] = useState<TipoRow | null>(null);
  const [imagenes, setImagenes] = useState<ImagenRow[]>([]);
  const [similar, setSimilar] = useState<Array<PropertyRow & { imagen?: string | null }>>([]);

  // nuevo: ids de navegación
  const [prevId, setPrevId] = useState<string | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchAll() {
      try {
        setLoading(true);

        // 1) Propiedad base
        const { data: p, error: e1 } = await supabase
          .from('propiedades')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (e1) throw e1;
        if (!p) throw new Error('Propiedad no encontrada.');
        if (ignore) return;

        // 1b) Detalle (property_detail)
        const { data: det, error: eDet } = await supabase
          .from('property_detail')
          .select('direccion,codigo_postal,lat,lng,ref_code')
          .eq('propiedad_id', p.id)
          .maybeSingle();
        if (eDet) throw eDet;

        const propConDetalle: PropertyRow = { ...(p as PropertyRow), ...(det || {}) };
        setProp(propConDetalle);

        // 2) Zona + Tipo
        const [zRes, tRes] = await Promise.all([
          p.zona_id
            ? supabase.from('zonas').select('id,pais,ciudad,area').eq('id', p.zona_id).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          p.tipo_id
            ? supabase.from('tipos').select('id,nombre,slug').eq('id', p.tipo_id).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);
        if (zRes.error) throw zRes.error;
        if (tRes.error) throw tRes.error;

        if (!ignore) {
          setZona(zRes.data as ZonaRow | null);
          setTipo(tRes.data as TipoRow | null);
        }

        // 3) Imágenes (principal + adicionales)  ➜  NORMALIZADAS (+ preload desde state)
        const { data: imgs, error: eImgs } = await supabase
          .from('imagenes_propiedad')
          .select('id,url,categoria,propiedad_id')
          .eq('propiedad_id', p.id)
          .order('id', { ascending: true });
        if (eImgs) throw eImgs;

        if (!ignore) {
          const extrasDb = (imgs ?? [])
            .map(r => r?.url)
            .filter(isGood)
            .map(u => toPublicUrl(u!));

          const portada = isGood(p.imagen_principal)
            ? [toPublicUrl(p.imagen_principal!)]
            : [];

          // Prioridad: portada -> preload (state) -> extras DB
          const ordered = unique([...portada, ...preloadImages, ...extrasDb]);

          const normalized: ImagenRow[] = ordered.map((u, idx) => ({
            id: `img-${idx}`,
            url: u,
            categoria: idx === 0 ? 'principal' : 'extra',
            propiedad_id: p.id,
          }));

          setImagenes(normalized);
        }

        // 4) Similares (misma zona o mismo tipo)
        const orParts = [
          p.zona_id ? `zona_id.eq.${p.zona_id}` : '',
          p.tipo_id ? `tipo_id.eq.${p.tipo_id}` : ''
        ].filter(Boolean).join(',');

        const { data: sim, error: eSim } = await supabase
          .from('propiedades')
          .select('id,titulo,precio,metros_cuadrados,dormitorios,banos,imagen_principal,zona_id,tipo_id,estado_propiedad')
          .neq('id', p.id)
          .or(orParts)
          .limit(4);
        if (eSim) throw eSim;
        if (!ignore) setSimilar((sim ?? []) as any);

        // 5) Prev/Next dentro de la misma zona (por id)
        let prevQuery = supabase
          .from('propiedades')
          .select('id')
          .lt('id', p.id)
          .order('id', { ascending: false })
          .limit(1);

        let nextQuery = supabase
          .from('propiedades')
          .select('id')
          .gt('id', p.id)
          .order('id', { ascending: true })
          .limit(1);

        if (p.zona_id) {
          prevQuery = prevQuery.eq('zona_id', p.zona_id);
          nextQuery = nextQuery.eq('zona_id', p.zona_id);
        }

        const [{ data: prevRes, error: ePrev }, { data: nextRes, error: eNext }] = await Promise.all([prevQuery, nextQuery]);
        if (ePrev) throw ePrev;
        if (eNext) throw eNext;

        if (!ignore) {
          setPrevId(prevRes?.[0]?.id ?? null);
          setNextId(nextRes?.[0]?.id ?? null);
        }

      } catch (err: any) {
        if (!ignore) setError(err.message ?? 'Error cargando la propiedad');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchAll();
    return () => { ignore = true; };
  }, [id]);

  const priceFmt = useMemo(
    () => (n?: number | null) =>
      typeof n === 'number'
        ? n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
        : '—',
    []
  );

  if (loading) return <div className="property-detail container">Cargando...</div>;
  if (error || !prop) return <div className="property-detail container">Error: {error ?? 'No encontrado'}</div>;

  return (
    <PropertyDetails
      prop={prop}
      zona={zona}
      tipo={tipo}
      imagenes={imagenes}
      similares={similar}
      priceFmt={priceFmt}
      prevId={prevId}
      nextId={nextId}
    />
  );
}
