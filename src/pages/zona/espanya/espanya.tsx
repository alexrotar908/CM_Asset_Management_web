// src/pages/zona/espanya/espanya.tsx
import './espanya.css';
import Select, { components, type GroupBase } from 'react-select';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useEspanyaLogic } from './espanyaData';
import type { OptionType } from './espanyaData';

type GroupedOption = { label: string; options: OptionType[] };

export default function Espanya() {
  const {
    // filtros (alineados con espanyaData)
    operation, setOperation,
    selectedProvince, setSelectedProvince,
    selectedArea, setSelectedArea,
    selectedTypes, setSelectedTypes,
    bedroomsMin, setBedroomsMin,
    maxPrice, setMaxPrice,

    // paginaciones independientes
    zonePage, setZonePage, zoneTotalPages,
    typePage, setTypePage, typeTotalPages,
    propertyPage, setPropertyPage, propertyTotalPages,

    // data
    provincesByCountry,
    areasByProvince,

    // tarjetas y props listadas
    typeCardsForView,
    zoneCards,
    paginatedProperties,

    // status
    loading, error,

    // navegación a /search
    getSearchHref,
  } = useEspanyaLogic();

  // ============== TIPOS AGRUPADOS (como en Home, pero SOLO España) ==============
  const [typeGroupsES, setTypeGroupsES] = useState<GroupedOption[]>([]);
  const [loadingTypes, setLoadingTypes] = useState<boolean>(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingTypes(true);
      try {
        const [{ data: zonas }, { data: tipos }] = await Promise.all([
          supabase.from('zonas').select('pais, ciudad').eq('pais', 'España'),
          supabase.from('tipos').select('id, nombre').order('nombre', { ascending: true }),
        ]);
        if (!alive) return;

        // Grupos únicos por ciudad dentro de España
        const cityLabels = Array.from(
          new Map(
            (zonas || [])
              .map((z: any) => {
                const pais = (z?.pais ?? '').trim();
                const ciudad = (z?.ciudad ?? '').trim();
                if (!pais || !ciudad) return null;
                return [`${pais}, ${ciudad}`, true];
              })
              .filter(Boolean) as [string, true][]
          ).keys()
        ).sort((a, b) => a.localeCompare(b));

        // IMPORTANTE: value = id (compatibilidad con espanyaData y /search)
        const allTypeOptions: OptionType[] = (tipos || []).map((t: any) => ({
          value: String(t.id),
          label: (t.nombre ?? '').trim(),
        }));

        const groups: GroupedOption[] = cityLabels.map((label) => ({
          label,
          options: allTypeOptions,
        }));

        setTypeGroupsES(groups);
      } finally {
        if (alive) setLoadingTypes(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // ======= Custom UI del selector (idéntico a Home) =======
  const CustomOption = (props: any) => (
    <components.Option {...props}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{props.label}</span>
        {props.isSelected && <span aria-hidden="true">✓</span>}
      </div>
    </components.Option>
  );

  const CustomValueContainer = (props: any) => {
    const count = props.getValue().length;
    return (
      <components.ValueContainer {...props}>
        {count === 0 ? (
          <span className="rs-placeholder">{props.selectProps.placeholder}</span>
        ) : (
          <span className="rs-count">{count} selected types</span>
        )}
      </components.ValueContainer>
    );
  };

  const CustomMenuList = (props: any) => {
    const handleSelectAll = () => {
      const map = new Map<string, OptionType>();
      (typeGroupsES || []).forEach((g) => g.options.forEach((o) => map.set(o.value, o)));
      setSelectedTypes(Array.from(map.values()));
    };
    const handleClear = () => setSelectedTypes([]);

    return (
      <components.MenuList {...props}>
        <div className="custom-menu-buttons">
          <button type="button" onClick={handleSelectAll}>Seleccionar todo</button>
          <button type="button" onClick={handleClear}>Quitar selección</button>
        </div>
        {props.children}
      </components.MenuList>
    );
  };

  // helpers
  const formatPrice = (n: number | string) => {
    const num = typeof n === 'string' ? Number(n) : n;
    if (!Number.isFinite(num)) return String(n ?? '');
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(num);
  };

  // Provincias (la clave viene como "España" desde espanyaData)
  const provincesES =
    provincesByCountry['España'] ||
    provincesByCountry['Spain'] ||
    [];

  // loading/error
  if (loading) {
    return (
      <div className="espanya-container">
        <section className="heroes"><div className="heroes-content"><h1>Cargando España…</h1></div></section>
      </div>
    );
  }
  if (error) {
    return (
      <div className="espanya-container">
        <section className="heroes"><div className="heroes-content"><h1>Error</h1><p>{error}</p></div></section>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirige a /search con todos los filtros armados por espanyaData
    window.location.assign(getSearchHref());
  };

  return (
    <div className="espanya-container">
      <section className="heroes">
        <div className="heroes-content">
          <h1>Welcome to Spain</h1>
          <p>Discover the finest properties in Madrid and Málaga. We connect you with exclusive homes and investment opportunities tailored to your lifestyle and goals.</p>
        </div>
      </section>

      {/* ===== Buscador (idéntico a Home en UX) ===== */}
      <section className="search-section">
        <form className="search-form" onSubmit={onSubmit}>
          {/* Operación */}
          <select value={operation} onChange={(e) => setOperation(e.target.value as any)}>
            <option value="">All</option>
            <option value="Buy">Buy</option>
            <option value="Rent">Rent</option>
            <option value="Rented">Rented</option>
          </select>

          {/* TYPE (agrupado por ciudades de España) */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <Select<OptionType, true, GroupBase<OptionType>>
              options={typeGroupsES as unknown as GroupBase<OptionType>[]}
              isMulti
              placeholder={loadingTypes ? 'Loading types...' : 'Tipo'}
              value={selectedTypes as any}
              onChange={setSelectedTypes as any}
              className="type-select"
              classNamePrefix="rs"
              components={{
                MenuList: CustomMenuList,
                ValueContainer: CustomValueContainer,
                Option: CustomOption,
                MultiValue: () => null, // oculta chips
              }}
              isSearchable={false}
              filterOption={null}
              closeMenuOnSelect={false}
              hideSelectedOptions={false}
              isDisabled={loadingTypes || (typeGroupsES?.length ?? 0) === 0}
              noOptionsMessage={() => (loadingTypes ? 'Loading...' : 'No hay tipos disponibles')}
            />
          </div>

          {/* Provincia / Área (de Supabase) */}
          <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)}>
            <option value=''>Select Province</option>
            {provincesES.map((province) => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>

          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            disabled={!selectedProvince}
          >
            <option value=''>Select Area</option>
            {selectedProvince && (areasByProvince[selectedProvince] || []).map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>

          {/* Dormitorios min / Max Price (irán en la URL del Search) */}
          <select value={bedroomsMin} onChange={(e) => setBedroomsMin(e.target.value)}>
            <option value="">Bedrooms</option>
            <option value="1">1</option><option value="2">2</option>
            <option value="3">3</option><option value="4">4</option>
            <option value="5+">5+</option>
          </select>

          <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
            <option value="">Max Price</option>
            <option>5.000€</option>
            <option>10.000€</option>
            <option>50.000€</option>
            <option>100.000€</option>
            <option>500.000€</option>
            <option>1.000.000€</option>
          </select>

          <button type="submit">Search</button>
        </form>
      </section>

      {/* REGIONES */}
      <section className="regions-section">
        <h2>Discover Spain’s Top Destinations</h2>
        <p>Explore our curated selection of properties in Madrid and the Costa del Sol — two of Spain’s most vibrant real estate markets.</p>

        <div className="regions-grid">
          <Link to="/espanya/madrid" className="region-card">
            <img src="/images_home/cibeles2.jpg" alt="Madrid" />
            <div className="region-overlay">
              <h3>Madrid</h3>
              <button>View Properties</button>
            </div>
          </Link>

          <Link to="/espanya/malaga" className="region-card">
            <img src="/images_home/costa_del_sol.jpg" alt="Costa del Sol" />
            <div className="region-overlay">
              <h3>Costa del Sol</h3>
              <button>View Properties</button>
            </div>
          </Link>
        </div>
      </section>

      {/* ZONAS (paginación independiente) */}
      <section className="zones-section">
        <h2>Exclusive Properties and Unique Spaces</h2>
        <p>The best properties in {selectedProvince || 'Spain'}</p>

        <div className="zones-grid">
          {zoneCards.map((zone) => (
            <Link key={zone.slug} to={zone.link} className="zone-card">
              <img src={zone.image} alt={zone.name} />
              <div className="zone-info">
                <h3>{zone.name}</h3>
                <button>View Properties</button>
              </div>
            </Link>
          ))}
        </div>

        {!selectedProvince && zoneTotalPages > 1 && (
          <div className="zones-pagination">
            {Array.from({ length: zoneTotalPages }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setZonePage(i + 1)}
                className={zonePage === i + 1 ? 'active' : ''}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* TYPES (paginación independiente) */}
      <section className="property-types">
        <h2>Properties by Type {selectedProvince || 'Spain'}</h2>
        <p>Find the typology that suits your needs</p>

        <div className="types-container">
          {typeCardsForView.map((group, index) => {
            const provinceFolder = selectedProvince
              ? (selectedProvince === 'Madrid' ? 'madrid_type' : 'malaga_type')
              : (typePage === 1 ? 'madrid_type' : 'malaga_type');

            return (
              <div key={index} className="type-group">
                <h3>{group.category}</h3>
                <p>{group.description}</p>
                <div className="type-grid">
                  {group.types.map((type, idx) => (
                    <Link
                      key={idx}
                      className="type-card"
                      to={`/tipos/${provinceFolder}/${type.slug}`}
                    >
                      <img src={type.image} alt={type.name} />
                      <div className="type-name">{type.name}</div>
                      <span className="more-details">MORE DETAILS</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {!selectedProvince && typeTotalPages > 1 && (
          <div className="types-pagination">
            {Array.from({ length: typeTotalPages }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setTypePage(i + 1)}
                className={typePage === i + 1 ? 'active' : ''}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* PROPIEDADES */}
      <section className="property-selection">
        <h2>Quality Keys {selectedProvince ? selectedProvince : 'Selection'}</h2>
        <div className="selection-grid">
          {paginatedProperties.map(prop => (
            <div key={prop.id} className="property-item">
              <Link to={`/propiedad/${encodeURIComponent(prop.id)}`}>
                <img src={prop.image} alt={prop.title} />
                <h3>{prop.title}</h3>
                <p>{formatPrice(prop.price)}</p>
                <div className="property-details">
                  <span>{prop.bedrooms} beds</span>
                  <span>{prop.bathrooms} baths</span>
                  <span>{prop.size} m²</span>
                </div>
              </Link>
            </div>
          ))}
        </div>

        <div className="properties-pagination">
          {Array.from({ length: propertyTotalPages }).map((_, idx) => (
            <button
              key={idx + 1}
              className={propertyPage === idx + 1 ? 'active' : ''}
              onClick={() => setPropertyPage(idx + 1)}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </section>

      <section className="welcome-section espanya-welcome">
        <h2>Find Your Home in Spain</h2>
        <p>
          From timeless neighborhoods in <strong>Madrid</strong> to the sun-kissed shores of the
          <strong> Costa del Sol</strong>, explore hand-picked homes tailored to your lifestyle.
        </p>

        <div className="welcome-collage-card">
          <div className="welcome-collage">
            <img loading="lazy" src="/images_espanya/centro_madrid.jpg" alt="Gran Vía, Madrid" />
            <img loading="lazy" src="/images_espanya/salamanca.jpg" alt="Barrio de Salamanca, Madrid" />
            <img loading="lazy" src="/images_espanya/chamberi.jpg" alt="Parque del Retiro, Madrid" />
            <img loading="lazy" src="/images_espanya/malagueta.jpg" alt="Playa en la Costa del Sol" />
            <img loading="lazy" src="/images_espanya/malaga_centro.jpg" alt="Centro histórico de Málaga" />
            <img loading="lazy" src="/images_espanya/malaga_puerto.jpeg" alt="Puerto de Málaga" />
          </div>
        </div>
      </section>

      <section className="why-choose-us">
        <div className="why-item">
          <h3>01. Best Decision</h3>
          <p>We help you make the best decision...</p>
        </div>
        <div className="why-item">
          <h3>02. Quality Service</h3>
          <p>Quality in service is our fundamental pillar...</p>
        </div>
        <div className="why-item">
          <h3>03. Satisfaction</h3>
          <p>Objective: the satisfaction of our customers...</p>
        </div>
      </section>
    </div>
  );
}
