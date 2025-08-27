import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './propertyDetail.css';
import type { PropertyRow, ZonaRow, TipoRow, ImagenRow } from './propertyDataDetail';

type TabKey = 'description' | 'details' | 'features' | 'address' | 'mortgage' | 'similar';

interface Props {
  prop: PropertyRow;
  zona: ZonaRow | null;
  tipo: TipoRow | null;
  imagenes: ImagenRow[];
  similares: Array<PropertyRow & { imagen?: string | null }>;
  priceFmt: (n?: number | null) => string;
  /** IDs para navegación anterior/siguiente */
  prevId?: string | null;
  nextId?: string | null;
}

export default function PropertyDetails({
  prop, zona, tipo, imagenes, similares, priceFmt, prevId, nextId
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('description');

  // Hipoteca (estado solo de UI)
  const [downPct, setDownPct] = useState<number | ''>(15);
  const [rate, setRate] = useState<number | ''>(3.5);
  const [years, setYears] = useState<number | ''>(12);

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

  // handler para imágenes rotas
  const onImgError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    const el = e.currentTarget;
    if (!el.dataset.fallback) {
      el.dataset.fallback = '1';
      el.src = '/placeholder.jpg';
    }
  };

  // —— slugs para el breadcrumb (/zone/:province/:slug)
  const provinceSlug = (zona?.ciudad || 'Madrid').toLowerCase();
  const areaSlug = (zona?.area || '').toLowerCase();
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

  // Navegación con teclado
  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLightboxOpen, safeUrls.length]);

  return (
    <>
      <div className="property-detail container">
        {/* Breadcrumbs */}
        <nav className="breadcrumbs">
          <Link to="/">Home</Link> <span>›</span>
          <Link to="/espanya">España</Link> <span>›</span>
          <Link to={`/zone/${provinceSlug}/${areaSlug}`}>{areaLabel}</Link> <span>›</span>
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
              <button title="Favorito">♡</button>
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
                onClick={() => openLightbox(i + 1)}  // índice real dentro de safeUrls
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
                <Link key={s.id} to={`/propiedad/${s.id}`} className="pd-similar-card">
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

        {/* Prev/Next navegables */}
        <div className="pd-prevnext">
          {prevId ? (
            <Link to={`/propiedad/${prevId}`}>{'‹ Prev'}</Link>
          ) : (
            <span style={{ opacity: 0.5, pointerEvents: 'none' }}>{'‹ Prev'}</span>
          )}
          {nextId ? (
            <Link to={`/propiedad/${nextId}`}>{'Next ›'}</Link>
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

      {/* -------- Lightbox Markup -------- */}
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
