// src/pages/ciudad/madrid_type/villa/villa.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import './villa_dubai.css';
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
  province: string;
  area: string;
  typeSlug?: string;
  featured?: boolean;
  status: Status;
}

export default function VillaDubai() {
  const [items, setItems] = useState<Property[]>([]);
  const [sortOption, setSortOption] = useState<string>('default');
  const [currentPage, setCurrentPage] = useState<number>(1);
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

        const { data, error } = await supabase
          .from('propiedades')
          .select(`
            id, titulo, precio, dormitorios, banos, metros_cuadrados,
            imagen_principal, destacada, zona_id, tipo_id, estado_propiedad,
            zonas:zona_id!inner ( ciudad, area ),
            tipos:tipo_id!inner ( slug, categoria ),
            imagenes_propiedad ( id, url, categoria )
          `)
          .eq('tipos.slug', 'villa')
          .eq('zonas.ciudad', 'Dubai City');

        if (error) throw error;

        const mapped: Property[] = (data ?? []).map((p: any) => {
          const zona = Array.isArray(p.zonas) ? p.zonas[0] : p.zonas;
          const tipo = Array.isArray(p.tipos) ? p.tipos[0] : p.tipos;
          const imgs = Array.isArray(p.imagenes_propiedad) ? p.imagenes_propiedad : [];

          const gallery = imgs.map((i: any) => i?.url).filter(Boolean) as string[];
          const ordered = [
            p.imagen_principal || '',
            ...gallery.filter((u: string) => u && u !== p.imagen_principal),
          ].filter(Boolean);
          const images = Array.from(new Set(ordered));

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
            province: zona?.ciudad ?? 'Dubai City',
            area: zona?.area ?? '',
            typeSlug: tipo?.slug ?? undefined,
            featured: !!p.destacada,
            status,
          } as Property;
        });

        const stable = [...mapped].sort((a, b) => a.title.localeCompare(b.title));

        if (!mounted) return;
        setItems(stable);

        const idxs: Record<string, number> = {};
        stable.forEach(p => { idxs[p.id] = 0; });
        setImageIndexes(idxs);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Error al cargar villas');
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
  const onWheel = (id: string, e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.deltaY > 0) nextImage(id);
    else prevImage(id);
  };
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (id: string, e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 30) (dx < 0 ? nextImage : prevImage)(id);
    touchStartX.current = null;
  };

  if (loading) {
    return (
      <div className="villa-page">
        <div className="villa-content"><h2>Cargando villas en Dubai…</h2></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="villa-page">
        <div className="villa-content"><h2>Error: {error}</h2></div>
      </div>
    );
  }

  return (
    <div className="villa-page">
      <div className="villa-content">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-separator">{'>'}</span>
          <span className="breadcrumb-current">Villa</span>
        </div>

        <div className="villa-header">
          <h1>Villa</h1>
          <div className="villa-subheader">
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

        <div className="villa-grid">
          {paginated.map((prop) => {
            const currentIdx = imageIndexes[prop.id] || 0;

            const handlePrev = (e: React.MouseEvent) => {
              e.preventDefault(); e.stopPropagation();
              prevImage(prop.id);
            };
            const handleNext = (e: React.MouseEvent) => {
              e.preventDefault(); e.stopPropagation();
              nextImage(prop.id);
            };
            const handleDot = (i: number) => (e: React.MouseEvent) => {
              e.preventDefault(); e.stopPropagation();
              setImageIndexes(prev => ({ ...prev, [prop.id]: i }));
            };

            return (
              <Link
                key={prop.id}
                to={`/propiedad/${prop.id}`}
                state={{ images: prop.images }}
                className="villa-card"
              >
                <div
                  className="image-container"
                  onWheel={(e) => onWheel(prop.id, e)}
                  onTouchStart={onTouchStart}
                  onTouchEnd={(e) => onTouchEnd(prop.id, e)}
                >
                  {prop.images.length > 0 && (
                    <img src={prop.images[currentIdx]} alt={prop.title} />
                  )}
                  {prop.images.length > 1 && (
                    <>
                      <button className="carousel-button left" onClick={handlePrev}>❮</button>
                      <button className="carousel-button right" onClick={handleNext}>❯</button>
                      <div className="dots">
                        {prop.images.map((_, i) => (
                          <span
                            key={i}
                            className={`dot ${i === currentIdx ? 'active' : ''}`}
                            onClick={handleDot(i)}
                          />
                        ))}
                      </div>
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
                    <span>📏 {prop.size} m²</span>
                  </div>
                </div>
              </Link>
            );
          })}
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

      <footer className="villa-footer">
        {/* ... (igual que tenías) */}
      </footer>
    </div>
  );
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}
