import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './propertyDetail.css';
import type { PropertyRow, ZonaRow, TipoRow, ImagenRow } from './propertyDataDetail';

// === NUEVO ===
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';

type TabKey = 'description' | 'details' | 'features' | 'address' | 'mortgage' | 'similar';

interface Props {
  prop: PropertyRow;
  zona: ZonaRow | null;
  tipo: TipoRow | null;
  imagenes: ImagenRow[];
  similares: Array<PropertyRow & { imagen?: string | null }>;
  priceFmt: (n?: number | null) => string;
  /** Estos props ya no se usan para Prev/Next; ahora se calculan por contexto **/
  prevId?: string | null;
  nextId?: string | null;
}

const toSlug = (s?: string) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function PropertyDetails({
  prop, zona, tipo, imagenes, similares, priceFmt,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('description');

  // Hipoteca (estado solo de UI)
  const [downPct, setDownPct] = useState<number | ''>(15);
  const [rate, setRate] = useState<number | ''>(3.5);
  const [years, setYears] = useState<number | ''>(12);

  // === Auth / Favoritos ===
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [favRowId, setFavRowId] = useState<string | null>(null);
  const [favLoading, setFavLoading] = useState(false);

  // === Contexto de navegación (area/tipo/fav) ===
  const location = useLocation();
  const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const ctx = (qs.get('ctx') as 'area' | 'tipo' | 'fav' | null) || null;
  const zonaIdParam = qs.get('zonaId');
  const tipoIdParam = qs.get('tipoId');

  // Prev/Next calculados por contexto
  const [navPrevId, setNavPrevId] = useState<string | null>(null);
  const [navNextId, setNavNextId] = useState<string | null>(null);

  // Calculadora hipoteca
  const monthlyFee = useMemo(() => {
    const total = prop.precio || 0;
    const down = typeof downPct === 'number' ? (total * downPct) / 100 : 0;
    const principal = total - down;
    const r = typeof rate === 'number' ? rate / 100 / 12 : 0;
    const n = typeof years === 'number' ? years * 12 : 0;
    if (r === 0 || n === 0) return n ? principal / n : 0;
    return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }, [prop.precio, downPct, rate, years]);

  // ---- Imágenes: normaliza y prepara listas ----
  const urls = (imagenes ?? [])
    .map(i => i?.url)
    .filter((u): u is string => !!u && u.trim() !== '' && u.trim().toLowerCase() !== 'null');

  const safeUrls = urls.length ? urls : ['/placeholder.jpg'];

  const bigImg = safeUrls[0];
  const thumbs = safeUrls.slice(1, 5);

  const onImgError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    const el = e.currentTarget;
    if (!el.dataset.fallback) {
      el.dataset.fallback = '1';
      el.src = '/placeholder.jpg';
    }
  };

  // —— breadcrumbs dinámicos (España vs Dubái) —— 
  const isDubai = (zona?.ciudad === 'Dubai City') || (zona?.pais === 'UAE');
  const provinceSlug = isDubai ? 'dubai' : toSlug(zona?.ciudad || 'madrid');
  const areaSlug = toSlug(zona?.area || '');
  const areaLabel = zona?.area || 'Zona';

  // -------- Lightbox / Modal ----------
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (idx: number) => {
    if (!safeUrls.length) return;
    setLightboxIndex(idx);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };
  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = '';
  };
  const prevImage = () => {
    if (!safeUrls.length) return;
    setLightboxIndex(i => (i - 1 + safeUrls.length) % safeUrls.length);
  };
  const nextImage = () => {
    if (!safeUrls.length) return;
    setLightboxIndex(i => (i + 1) % safeUrls.length);
  };

  // === obtener id interno usuarios
  useEffect(() => {
    const getUsuarioId = async () => {
      if (!user?.id) {
        setUsuarioId(null);
        setFavRowId(null);
        return;
      }
      const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('usuarios fetch error', error);
        setUsuarioId(null);
        return;
      }
      setUsuarioId(data?.id ?? null);
    };
    getUsuarioId();
  }, [user?.id]);

  // === comprobar si es favorito
  useEffect(() => {
    const checkFavorite = async () => {
      if (!usuarioId || !prop?.id) {
        setFavRowId(null);
        return;
      }
      const { data, error } = await supabase
        .from('favoritos')
        .select('id')
        .eq('usuario_id', usuarioId)
        .eq('propiedad_id', prop.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('favoritos check error', error);
      }
      setFavRowId(data?.id ?? null);
    };
    checkFavorite();
  }, [usuarioId, prop?.id]);

  // === toggle favorito
  const toggleFavorite = async () => {
    if (!user?.id) {
      alert('Debes iniciar sesión para guardar favoritos.');
      navigate('/profile');
      return;
    }
    if (!usuarioId) return;

    try {
      setFavLoading(true);

      if (!favRowId) {
        const { data, error } = await supabase
          .from('favoritos')
          .insert([{ usuario_id: usuarioId, propiedad_id: prop.id }])
          .select('id')
          .maybeSingle();

        if (error) throw error;
        setFavRowId(data?.id ?? null);
      } else {
        const { error } = await supabase
          .from('favoritos')
          .delete()
          .eq('id', favRowId);

        if (error) throw error;
        setFavRowId(null);
      }
    } catch (err) {
      console.error('toggleFavorite error', err);
      alert('No se pudo actualizar favoritos. Intenta de nuevo.');
    } finally {
      setFavLoading(false);
    }
  };

  const isFav = Boolean(favRowId);

  // === Prev/Next según contexto (orden corregido para que Next no quede deshabilitado) ===
  useEffect(() => {
    const loadSiblings = async () => {
      try {
        let ids: string[] = [];
        const currentId = String(prop.id);

        if (ctx === 'fav') {
          // 1) usuario interno
          const { data: urow, error: uerr } = await supabase
            .from('usuarios')
            .select('id')
            .eq('user_id', user?.id ?? '')
            .maybeSingle();
          if (uerr || !urow?.id) { setNavPrevId(null); setNavNextId(null); return; }

          // 2) favoritos en orden reciente (si tienes created_at, úsalo aquí)
          const { data: favs, error: ferr } = await supabase
            .from('favoritos')
            .select('propiedad_id')
            .eq('usuario_id', urow.id)
            .order('id', { ascending: false });
          if (ferr || !favs) { setNavPrevId(null); setNavNextId(null); return; }

          ids = (favs ?? []).map(f => String(f.propiedad_id));
        } else if (ctx === 'tipo') {
          const tipoId = tipoIdParam || (prop as any)?.tipo_id;
          if (!tipoId) { setNavPrevId(null); setNavNextId(null); return; }

          const { data, error } = await supabase
            .from('propiedades')
            .select('id, titulo_norm, titulo')
            .eq('tipo_id', tipoId)
            .order('titulo_norm', { ascending: true })
            .order('titulo', { ascending: true });
          if (error || !data) { setNavPrevId(null); setNavNextId(null); return; }

          ids = (data ?? []).map(r => String(r.id));
        } else {
          // default: área
          const zonaId = zonaIdParam || (prop as any)?.zona_id;
          if (!zonaId) { setNavPrevId(null); setNavNextId(null); return; }

          const { data, error } = await supabase
            .from('propiedades')
            .select('id, titulo_norm, titulo')
            .eq('zona_id', zonaId)
            .order('titulo_norm', { ascending: true })
            .order('titulo', { ascending: true });
          if (error || !data) { setNavPrevId(null); setNavNextId(null); return; }

          ids = (data ?? []).map(r => String(r.id));
        }

        const idx = ids.indexOf(currentId);
        const prev = idx > 0 ? ids[idx - 1] : null;
        const next = idx !== -1 && idx < ids.length - 1 ? ids[idx + 1] : null;

        setNavPrevId(prev);
        setNavNextId(next);
      } catch (e) {
        console.error('loadSiblings error', e);
        setNavPrevId(null);
        setNavNextId(null);
      }
    };

    loadSiblings();
  }, [ctx, zonaIdParam, tipoIdParam, prop.id, user?.id]);

  return (
    <>
      <div className="property-detail container">
        {/* Breadcrumbs */}
        <nav className="breadcrumbs">
          <Link to="/">Home</Link> <span>›</span>
          {isDubai ? (
            <>
              <Link to="/dubai">Dubai</Link> <span>›</span>
              <Link to={`/zone/dubai/${areaSlug}`}>{areaLabel}</Link> <span>›</span>
            </>
          ) : (
            <>
              <Link to="/espanya">España</Link> <span>›</span>
              <Link to={`/zone/${provinceSlug}/${areaSlug}`}>{areaLabel}</Link> <span>›</span>
            </>
          )}
          <span className="current">{prop.titulo}</span>
        </nav>

        {/* Header */}
        <header className="pd-header">
          <h1>{prop.titulo}</h1>
          <div className="pd-header-right">
            <div className={`pill pill-${(prop.estado_propiedad || 'BUY').toLowerCase()}`}>
              {prop.estado_propiedad || 'BUY'}
            </div>
            <div className="pd-price">{priceFmt(prop.precio)}</div>
            <div className="pd-actions">
              {/* === botón favoritos === */}
              <button
                title={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                onClick={toggleFavorite}
                disabled={favLoading}
                aria-pressed={isFav}
                className={`pd-fav-btn ${isFav ? 'is-fav' : ''}`}
              >
                {isFav ? '♥' : '♡'}
              </button>

              <button title="Compartir">⤴</button>
              <button title="Imprimir">🖨</button>
            </div>
          </div>
        </header>

        {/* Subtítulo dirección */}
        <p className="pd-subaddress">
          {prop.direccion && <span>{prop.direccion}, </span>}
          {zona?.area && <span>{zona.area}, </span>}
          {zona?.ciudad && <span>{zona.ciudad}, </span>}
          {zona?.pais && <span>{zona.pais}</span>}
          {prop.codigo_postal && <span>, {prop.codigo_postal}</span>}
        </p>

        {/* Galería */}
        <section className="pd-gallery">
          {bigImg && (
            <div className="pd-gallery-main">
              <img
                src={bigImg}
                alt={prop.titulo}
                onError={onImgError}
                onClick={() => openLightbox(0)}
                style={{ cursor: 'zoom-in' }}
              />
            </div>
          )}

          <div className="pd-gallery-thumbs">
            {thumbs.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`thumb-${i}`}
                onError={onImgError}
                onClick={() => openLightbox(i + 1)}
                style={{ cursor: 'zoom-in' }}
              />
            ))}

            {safeUrls.length > 5 && (
              <button
                className="pd-more"
                onClick={() => openLightbox(0)}
                title="Ver todas las imágenes"
              >
                + {safeUrls.length - 5} More
              </button>
            )}
          </div>
        </section>

        {/* Tabs */}
        <div className="pd-tabs">
          {(['description','details','features','address','mortgage','similar'] as const).map(tab => (
            <button
              key={tab}
              className={`pd-tab ${activeTab===tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'description' && 'Description'}
              {tab === 'details' && 'Details'}
              {tab === 'features' && 'Features'}
              {tab === 'address' && 'Address'}
              {tab === 'mortgage' && 'Mortgage Calculator'}
              {tab === 'similar' && 'Similar Ads'}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'description' && (
          <section className="pd-section">
            <div className="pd-quickfacts">
              <div><strong>{tipo?.nombre || '—'}</strong><span>Property type</span></div>
              <div><strong>{prop.dormitorios ?? '—'}</strong><span>Bedrooms</span></div>
              <div><strong>{prop.banos ?? '—'}</strong><span>Bathrooms</span></div>
              <div><strong>{prop.metros_cuadrados ?? '—'} m²</strong><span>m²</span></div>
              <div><strong>{prop.ref_code || `#${prop.id.slice(0,6)}`}</strong><span>Property ID</span></div>
            </div>
            <h3>Description</h3>
            <p>{prop.descripcion || '—'}</p>
          </section>
        )}

        {activeTab === 'details' && (
          <section className="pd-section">
            <h3>Details</h3>
            <div className="pd-details-card">
              <div><span>Property ID:</span><strong>{prop.ref_code || `#${prop.id.slice(0,6)}`}</strong></div>
              <div><span>Bathrooms:</span><strong>{prop.banos ?? '—'}</strong></div>
              <div><span>Price:</span><strong>{priceFmt(prop.precio)}</strong></div>
              <div><span>Property type:</span><strong>{tipo?.nombre || '—'}</strong></div>
              <div><span>Surface:</span><strong>{prop.metros_cuadrados ?? '—'} m²</strong></div>
              <div><span>Estado:</span><strong>{prop.estado_propiedad || 'BUY'}</strong></div>
              <div><span>Bedrooms:</span><strong>{prop.dormitorios ?? '—'}</strong></div>
            </div>
          </section>
        )}

        {activeTab === 'features' && (
          <section className="pd-section">
            <h3>Features</h3>
            <ul className="pd-features">
              <li>Air conditioning</li>
              <li>Heating Boiler</li>
              <li>Hot Water Boiler</li>
              <li>Lift</li>
              <li>Orientation N</li>
              <li>Security Video surveillance</li>
            </ul>
          </section>
        )}

        {activeTab === 'address' && (
          <section className="pd-section">
            <h3>Address</h3>
            <div className="pd-address-grid">
              <div><span>Address</span><strong>{prop.direccion || '—'}</strong></div>
              <div><span>City</span><strong>{zona?.ciudad || '—'}</strong></div>
              <div><span>Locality</span><strong>{zona?.area || '—'}</strong></div>
              <div><span>ZIP CODE</span><strong>{prop.codigo_postal || '—'}</strong></div>
            </div>

            {(prop.lat && prop.lng) ? (
              <div className="pd-map">
                <iframe
                  title="map"
                  width="100%"
                  height="380"
                  style={{ border: 0, borderRadius: 12 }}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${prop.lng-0.01}%2C${prop.lat-0.01}%2C${prop.lng+0.01}%2C${prop.lat+0.01}&layer=mapnik&marker=${prop.lat}%2C${prop.lng}`}
                />
              </div>
            ) : (
              <div className="pd-map placeholder">Mapa no disponible</div>
            )}
          </section>
        )}

        {activeTab === 'mortgage' && (
          <section className="pd-section">
            <h3>Mortgage Calculator</h3>
            <div className="pd-mortgage">
              <div className="pd-mortgage-big">
                <div className="pd-mortgage-ring">
                  <div className="pd-mortgage-value">
                    {monthlyFee.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    <small>Monthly</small>
                  </div>
                </div>
                <ul className="pd-mortgage-breakdown">
                  <li><span>Down payment</span><strong>{priceFmt(prop.precio * ((Number(downPct)||0)/100))}</strong></li>
                  <li><span>Loan Amount</span><strong>{priceFmt(prop.precio - prop.precio * ((Number(downPct)||0)/100))}</strong></li>
                  <li><span>Monthly Fee</span><strong>{monthlyFee.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</strong></li>
                </ul>
              </div>
              <form className="pd-mortgage-form" onSubmit={(e)=>e.preventDefault()}>
                <label>Total amount (€)
                  <input type="number" value={prop.precio} readOnly />
                </label>
                <label>Down payment (%)
                  <input type="number" value={downPct} onChange={e=>setDownPct(Number(e.target.value))} />
                </label>
                <label>Interest rate (%)
                  <input type="number" step="0.1" value={rate} onChange={e=>setRate(Number(e.target.value))} />
                </label>
                <label>Loan terms (years)
                  <input type="number" value={years} onChange={e=>setYears(Number(e.target.value))} />
                </label>
              </form>
            </div>
          </section>
        )}

        {activeTab === 'similar' && (
          <section className="pd-section">
            <h3>Similar Ads</h3>
            <div className="pd-similar-grid">
              {similares.map(s => (
                <Link key={s.id} to={`/propiedad/${s.id}${location.search}`} className="pd-similar-card">
                  <div className="img">
                    <img src={s.imagen_principal || '/placeholder.jpg'} alt={s.titulo} />
                    <div className={`pill pill-${(s.estado_propiedad || 'BUY')?.toLowerCase?.() || 'buy'}`}>
                      {s.estado_propiedad || 'BUY'}
                    </div>
                  </div>
                  <div className="body">
                    <h4>{s.titulo}</h4>
                    <div className="meta">
                      <span>🛏 {s.dormitorios ?? '—'}</span>
                      <span>🛁 {s.banos ?? '—'}</span>
                      <span>📐 {s.metros_cuadrados ?? '—'} m²</span>
                    </div>
                    <div className="price">{priceFmt(s.precio)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Prev/Next navegables (contextuales) */}
        <div className="pd-prevnext">
          {navPrevId ? (
            <Link to={`/propiedad/${navPrevId}${location.search}`}>{'‹ Prev'}</Link>
          ) : (
            <span style={{ opacity: 0.5, pointerEvents: 'none' }}>{'‹ Prev'}</span>
          )}
          {navNextId ? (
            <Link to={`/propiedad/${navNextId}${location.search}`}>{'Next ›'}</Link>
          ) : (
            <span style={{ opacity: 0.5, pointerEvents: 'none' }}>{'Next ›'}</span>
          )}
        </div>
      </div>

      {/* Footer a ancho completo */}
      <footer className="property-footer">
        <div className="footer-top">
          <div className="footer-location">
            <h4>📍 MADRID</h4>
            <p>Avda. Juan Antonio Samaranch S/N<br />28055 – Madrid</p>
            <p>📞 +34 911 644 182</p>
            <p>📧 info@qualitykeys.es</p>
          </div>
          <div className="footer-location">
            <h4>📍 MARBELLA</h4>
            <p>Calle El Califa, Urbanización Las Lolas, Edificio C, Local 6.<br />29660 Nueva Andalucía, Marbella</p>
            <p>📞 +34 951 568 381</p>
            <p>📧 marbella@qualitykeys.es</p>
          </div>
          <div className="footer-links">
            <h4>Useful links</h4>
            <ul>
              <li><a href="#">Legal Notice</a></li>
              <li><a href="#">Cookie Policy</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="logo-socials">
            <img src="/logo_white.png" alt="QualityKeys" className="footer-logo" />
            <div className="social-icons">
              <a href="#"><i className="fab fa-pinterest" /></a>
              <a href="#"><i className="fab fa-linkedin-in" /></a>
              <a href="#"><i className="fab fa-instagram" /></a>
            </div>
          </div>
          <p className="copyright">© 102web - All rights reserved</p>
        </div>
      </footer>

      {/* -------- Lightbox -------- */}
      {isLightboxOpen && (
        <div
          className="pd-lightbox"
          onClick={closeLightbox}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}
        >
          <button
            aria-label="Close"
            onClick={closeLightbox}
            style={{
              position: 'absolute', top: 12, right: 16, fontSize: 28,
              color: '#fff', background: 'transparent', border: 'none', cursor: 'pointer'
            }}
          >
            ✕
          </button>

          <div style={{ position: 'absolute', top: 12, left: 16, color: '#fff', fontSize: 14 }}>
            {lightboxIndex + 1} / {safeUrls.length}
          </div>

          <img
            src={safeUrls[lightboxIndex]}
            alt={`img-${lightboxIndex}`}
            onError={onImgError}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', userSelect: 'none' }}
          />

          {safeUrls.length > 1 && (
            <>
              <button
                aria-label="Prev"
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                style={{
                  position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 28, color: '#fff', background: 'transparent', border: 'none', cursor: 'pointer'
                }}
              >
                ❮
              </button>
              <button
                aria-label="Next"
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                style={{
                  position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 28, color: '#fff', background: 'transparent', border: 'none', cursor: 'pointer'
                }}
              >
                ❯
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
