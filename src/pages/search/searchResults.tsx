import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Mapa from './mapa';
import type { QkMarker } from './mapa';
import RightFilters from './rightFilters';
import './search.css';

type Operation = 'Buy' | 'Rent' | 'Rented';

type PropRow = {
  id: string;
  titulo: string | null;
  precio: number | null;
  dormitorios: number | null;
  banos: number | null;
  metros_cuadrados: number | null;
  estado_propiedad: string | null;
  imagen_principal: string | null;
  zona_id: string | null;
  tipo_id: string | null;
};

type DetailRow = {
  propiedad_id: string;
  lat: number | null;
  lng: number | null;
  ref_code?: string | null;
};

type ZonaRow = {
  id: string;
  pais: string | null;
  ciudad: string | null;
  area: string | null;
};

// Version memoizada de RightFilters para evitar re-render innecesario
const MemoRightFilters = React.memo(RightFilters);

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  // ---- helpers URL ----
  const get = useCallback((k: string) => params.get(k) ?? '', [params]);
  const getNum = useCallback((k: string) => {
    const v = params.get(k);
    return v ? Number(v) : undefined;
  }, [params]);
  const getList = useCallback((k: string) => {
    const v = params.get(k);
    return v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];
  }, [params]);

  // ---- estado derivado de la URL ----
  const operation = (get('op') || 'Rent') as Operation;
  const country = get('country');
  const province = get('province');
  const area = get('area');
  const typeIds = getList('types');
  const bedroomsMin = getNum('bmin');
  const bathroomsMin = getNum('tmin');
  const areaMin = getNum('amin');
  const areaMax = getNum('amax');
  const priceMin = getNum('pmin');
  const priceMax = getNum('pmax');
  const page = Number(get('page') || '1');
  const pageSize = Number(get('ps') || '12');

  // ---- estado de datos ----
  const [loading, setLoading] = useState(false);
  const [markers, setMarkers] = useState<QkMarker[]>([]);
  const [results, setResults] = useState<
    Array<PropRow & { ciudad?: string | null; area?: string | null }>
  >([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ---- ANTI-PARPADEO / request id ----
  const reqIdRef = useRef(0);
  const paramsKey = useMemo(() => params.toString(), [params]);

  // ---- filtro por zona (ids de zonas) ----
  const fetchZonaIds = useCallback(async (): Promise<string[] | null> => {
    if (!country && !province && !area) return null;
    const q = supabase.from('zonas').select('id, pais, ciudad, area');
    if (country) q.ilike('pais', country);
    if (province) q.ilike('ciudad', province);
    if (area) q.ilike('area', area);
    const { data, error } = await q;
    if (error) throw error;
    return (data as ZonaRow[]).map(z => z.id);
  }, [country, province, area]);

  // ---- query principal: propiedades (paginadas) + count ----
  const fetchProps = useCallback(async (zonaIds: string[] | null) => {
    let q = supabase.from('propiedades').select('*', { count: 'exact' }) as any;

    if (operation) q = q.ilike('estado_propiedad', operation);
    if (zonaIds && zonaIds.length) q = q.in('zona_id', zonaIds);
    if (typeIds.length) q = q.in('tipo_id', typeIds);
    if (bedroomsMin !== undefined) q = q.gte('dormitorios', bedroomsMin);
    if (bathroomsMin !== undefined) q = q.gte('banos', bathroomsMin);
    if (areaMin !== undefined) q = q.gte('metros_cuadrados', areaMin);
    if (areaMax !== undefined) q = q.lte('metros_cuadrados', areaMax);
    if (priceMin !== undefined) q = q.gte('precio', priceMin);
    if (priceMax !== undefined) q = q.lte('precio', priceMax);

    // paginación
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    q = q.range(from, to);

    const { data, error, count } = await q;
    if (error) throw error;

    return { rows: (data || []) as PropRow[], count: count || 0 };
  }, [
    operation, typeIds, bedroomsMin, bathroomsMin, areaMin, areaMax, priceMin, priceMax,
    page, pageSize
  ]);

  // ---- detalles: lat/lng + ciudad/area legible ----
  const fetchDetails = useCallback(async (propIds: string[]) => {
    if (!propIds.length) {
      return { detailById: new Map<string, DetailRow>(), zonasById: new Map<string, ZonaRow>() };
    }

    const { data: det, error: detErr } = await supabase
      .from('property_detail')
      .select('propiedad_id, lat, lng, ref_code')
      .in('propiedad_id', propIds);
    if (detErr) throw detErr;

    const detailById = new Map<string, DetailRow>();
    (det || []).forEach((d: any) => {
      if (d?.propiedad_id) detailById.set(d.propiedad_id, d as DetailRow);
    });

    // zonas legibles
    const { data: propsZona, error: propsErr } = await supabase
      .from('propiedades')
      .select('id, zona_id')
      .in('id', propIds);
    if (propsErr) throw propsErr;

    const zonaIds = Array.from(
      new Set((propsZona || []).map((p: any) => p.zona_id).filter(Boolean))
    );

    let zonasById = new Map<string, ZonaRow>();
    if (zonaIds.length) {
      const { data: zonas, error: zonasErr } = await supabase
        .from('zonas')
        .select('id, pais, ciudad, area')
        .in('id', zonaIds);
      if (zonasErr) throw zonasErr;
      zonasById = new Map((zonas || []).map((z: any) => [z.id, z as ZonaRow]));
    }

    return { detailById, zonasById };
  }, []);

  // ---- orquestador ----
  const fetchAll = useCallback(async () => {
    const myId = ++reqIdRef.current;
    setLoading(true);
    setErrorMsg(null);
    try {
      const zonaIds = await fetchZonaIds();
      const { rows, count } = await fetchProps(zonaIds);

      const propIds = rows.map(r => r.id);
      const { detailById, zonasById } = await fetchDetails(propIds);

      const merged = rows.map(r => {
        const z = zonasById.get(r.zona_id || '');
        return {
          ...r,
          ciudad: z?.ciudad ?? null,
          area: z?.area ?? null,
        };
      });

      const markersPage: QkMarker[] = merged
        .map((r) => {
          const det = detailById.get(r.id);
          if (!det || det.lat == null || det.lng == null) return null;
          return {
            id: r.id,
            lat: det.lat,
            lng: det.lng,
            price: r.precio ?? undefined,
            title: r.titulo ?? undefined,
            city: r.ciudad ?? undefined,
            image: r.imagen_principal ?? undefined,
          } as QkMarker;
        })
        .filter(Boolean) as QkMarker[];

      if (reqIdRef.current === myId) {
        setResults(merged);
        setTotalCount(count);
        setMarkers(markersPage);
      }
    } catch (err: any) {
      console.error(err);
      if (reqIdRef.current === myId) {
        setErrorMsg('There was a problem fetching results.');
        // No vaciamos results/markers para evitar “flash”.
      }
    } finally {
      if (reqIdRef.current === myId) setLoading(false);
    }
  }, [fetchZonaIds, fetchProps, fetchDetails]);

  // ---- efecto principal (clave derivada de params) ----
  useEffect(() => {
    void fetchAll();
  }, [fetchAll, paramsKey]);

  // ---- paginación ----
  const onPage = (dir: 'prev' | 'next') => {
    const p = Number(params.get('page') || '1');
    const next = dir === 'prev' ? Math.max(1, p - 1) : p + 1;
    const cloned = new URLSearchParams(params);
    cloned.set('page', String(next));
    setParams(cloned, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize]
  );

  // ---- callback estable para RightFilters (evita recrearlo en cada render) ----
  const onApplyCb = useCallback(() => {
    const el = document.querySelector('.qk-results');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="qk-search-2col">
      {/* COLUMNA IZQUIERDA: MAPA */}
      <aside className="qk-map-col">
        <div className="qk-map-sticky">
          <Mapa
            markers={markers}
            activeId={hoveredId}
            onMarkerHover={setHoveredId}
            onMarkerClick={(id) => navigate(`/property/${id}`)}
            showFullscreenButton
            fitToMarkers
          />
        </div>
      </aside>

      {/* COLUMNA DERECHA: FILTROS + LISTA */}
      <main className="qk-right-col">
        <div className="qk-topbar">
          <div>
            <div className="qk-loc-line">
              {country && <span>{country}</span>}
              {province && <span> · {province}</span>}
              {area && <span> · {area}</span>}
            </div>
            <h2 className="qk-count">{totalCount} Results Found</h2>
          </div>
        </div>

        {/* Filtros completos */}
        <MemoRightFilters onApply={onApplyCb} />

        {errorMsg && <div className="qk-error">{errorMsg}</div>}

        {/* Lista de resultados */}
        <section className="qk-results">
          {results.map((r) => (
            <article
              key={r.id}
              className="result-card"
              onMouseEnter={() => setHoveredId(r.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="card-img">
                <img
                  src={r.imagen_principal || '/placeholder.jpg'}
                  alt={r.titulo || 'Property'}
                />
              </div>
              <div className="card-body">
                <div className="price">
                  {r.precio != null
                    ? r.precio.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
                    : '—'}
                </div>
                <div className="title">{r.titulo || 'Property'}</div>
                <div className="loc">{[r.area, r.ciudad].filter(Boolean).join(', ')}</div>
                <div className="meta">
                  <span>{r.dormitorios ?? '—'} Dorm</span>
                  <span>{r.banos ?? '—'} Baños</span>
                  <span>{r.metros_cuadrados ?? '—'} m²</span>
                </div>
                <button
                  className="qk-outline"
                  type="button"
                  onClick={() => navigate(`/property/${r.id}`)}
                >
                  Ver detalle
                </button>
              </div>
            </article>
          ))}

          {!loading && results.length === 0 && !errorMsg && (
            <div className="qk-empty">No results. Try adjusting filters.</div>
          )}
        </section>

        {/* Paginación */}
        <div className="qk-pager">
          <button disabled={loading || page <= 1} onClick={() => onPage('prev')}>‹ Prev</button>
          <span>Page {page} / {totalPages}</span>
          <button disabled={loading || page >= totalPages} onClick={() => onPage('next')}>Next ›</button>
        </div>
      </main>
    </div>
  );
}
