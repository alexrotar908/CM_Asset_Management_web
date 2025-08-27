// src/pages/tipo/madrid_type/warehouse/warehouse.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import './warehouse.css';
import { Link } from 'react-router-dom';
import { supabase } from '../../../../lib/supabaseClient';

type Status = 'BUY' | 'RENT' | 'RENTED';

interface Property {
  id: string;
  title: string;
  price: number;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  size: number;
  garage?: number;
  province: string;
  area: string;
  typeSlug?: string;
  featured?: boolean;
  status: Status;
}

export default function Warehouse() {
  const [items, setItems] = useState<Property[]>([]);
  const [sortOption, setSortOption] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const propertiesPerPage = 6;
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 🔎 Propiedades tipo warehouse en Madrid
        const { data, error } = await supabase
          .from('propiedades')
          .select(`
            id, titulo, precio, dormitorios, banos, metros_cuadrados,
            imagen_principal, destacada, zona_id, tipo_id, estado_propiedad
            zonas:zona_id!inner ( ciudad, area ),
            tipos:tipo_id!inner ( slug, categoria ),
            imagenes_propiedad ( id, url )
          `)
          .eq('tipos.slug', 'warehouse')
          .eq('zonas.ciudad', 'Madrid');

        if (error) throw error;

        const mapped: Property[] = (data ?? []).map((p: any) => {
          const zona = Array.isArray(p.zonas) ? p.zonas[0] : p.zonas;
          const tipo = Array.isArray(p.tipos) ? p.tipos[0] : p.tipos;
          const imgs = Array.isArray(p.imagenes_propiedad) ? p.imagenes_propiedad : [];

          const gallery = imgs.map((i: any) => i?.url).filter(Boolean);
          const ordered = [
            p.imagen_principal || '',
            ...gallery.filter((u: string) => u && u !== p.imagen_principal),
          ].filter(Boolean);
          const images = Array.from(new Set(ordered));

           // Normalizamos estado_propiedad -> Status
          const raw = (p.estado_propiedad ?? 'BUY').toString();
          const statusLower = raw.toLowerCase();
          const status: Status =
            statusLower === 'rent' ? 'RENT' :
            statusLower === 'rented' ? 'RENTED' :
            'BUY';

          return {
            id: String(p.id),
            title: String(p.titulo ?? ''),
            price: Number(p.precio ?? 0),
            images,
            bedrooms: Number(p.dormitorios ?? 0),
            bathrooms: Number(p.banos ?? 0),
            size: Number(p.metros_cuadrados ?? 0),
            garage: Number(p.garage ?? 0),
            province: zona?.ciudad ?? 'Madrid',
            area: zona?.area ?? '',
            typeSlug: tipo?.slug ?? undefined,
            featured: !!p.destacada,
            status,
          };
        });

        if (!mounted) return;
        setItems(mapped);

        const idxs: Record<string, number> = {};
        mapped.forEach(p => (idxs[p.id] = 0));
        setImageIndexes(idxs);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Error al cargar Warehouses (Madrid)');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const sorted = useMemo(() => {
    switch (sortOption) {
      case 'lowToHigh':
        return [...items].sort((a, b) => a.price - b.price);
      case 'highToLow':
        return [...items].sort((a, b) => b.price - a.price);
      case 'titleAsc':
        return [...items].sort((a, b) => a.title.localeCompare(b.title));
      default:
        return items;
    }
  }, [items, sortOption]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / propertiesPerPage));
  const paginated = sorted.slice((currentPage - 1) * propertiesPerPage, currentPage * propertiesPerPage);

  // Carrusel
  const prevImage = (id: string) => {
    const len = items.find(p => p.id === id)?.images.length ?? 0;
    if (!len) return;
    setImageIndexes(prev => ({ ...prev, [id]: (prev[id] - 1 + len) % len }));
  };
  const nextImage = (id: string) => {
    const len = items.find(p => p.id === id)?.images.length ?? 0;
    if (!len) return;
    setImageIndexes(prev => ({ ...prev, [id]: (prev[id] + 1) % len }));
  };

  if (loading) {
    return <div className="warehouse-page"><h2>Cargando Warehouses (Madrid)…</h2></div>;
  }
  if (error) {
    return <div className="warehouse-page"><h2>Error: {error}</h2></div>;
  }

  return (
    <div className="warehouse-page">
      <div className="warehouse-content">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-separator">{'>'}</span>
          <span className="breadcrumb-current">Warehouse</span>
        </div>

        <div className="warehouse-header">
          <h1>Warehouses</h1>
          <div className="warehouse-subheader">
            <span>{items.length} Propiedades</span>
            <div className="sort-container">
              <label>Sort by: </label>
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                <option value="default">Default Order</option>
                <option value="lowToHigh">Price - Low to High</option>
                <option value="highToLow">Price - High to Low</option>
                <option value="titleAsc">Title - ASC</option>
              </select>
            </div>
          </div>
        </div>

        <div className="warehouse-grid">
          {paginated.map((prop) => (
            <div key={prop.id} className="warehouse-card">
              <div className="image-container">
                {prop.images.length > 0 && (
                  <img src={prop.images[imageIndexes[prop.id] || 0]} alt={prop.title} />
                )}
                {prop.images.length > 1 && (
                  <>
                    <button className="carousel-button left" onClick={() => prevImage(prop.id)}>❮</button>
                    <button className="carousel-button right" onClick={() => nextImage(prop.id)}>❯</button>
                  </>
                )}
                <span className={`status-label ${prop.status.toLowerCase()}`}>
                  {prop.status}
                </span>
              </div>
              <div className="info-container">
                <h3>{prop.title}</h3>
                <p className="price">{formatPrice(prop.price)}</p>
                <div className="icons">
                  <span>🛏 {prop.bedrooms}</span>
                  <span>🛁 {prop.bathrooms}</span>
                  <span>🚗 {prop.garage ?? 0}</span>
                  <span>📏 {prop.size} m²</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pagination">
          {Array.from({ length: totalPages }, (_, idx) => (
            <button
              key={idx + 1}
              className={currentPage === idx + 1 ? 'active' : ''}
              onClick={() => setCurrentPage(idx + 1)}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <footer className="warehouse-footer">
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
  </div>
);
}
