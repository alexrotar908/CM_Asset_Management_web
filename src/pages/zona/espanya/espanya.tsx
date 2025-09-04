import './espanya.css';
import Select, { components } from 'react-select';
import { Link } from 'react-router-dom';
import { useEspanyaLogic } from './espanyaData';
import type { OptionType } from './espanyaData';

export default function Espanya() {
  const {
    // filtros
    selectedProvince, setSelectedProvince,
    selectedTypes, setSelectedTypes,
    searchTerm, setSearchTerm,

    // paginaciones independientes
    zonePage, setZonePage, zoneTotalPages,
    typePage, setTypePage, typeTotalPages,
    propertyPage, setPropertyPage, propertyTotalPages,

    // data
    provincesByCountry,
    areasByProvince,
    typeOptions,
    typeCardsForView,
    zoneCards,

    // derivados
    paginatedProperties,

    // status
    loading, error
  } = useEspanyaLogic();

  const selectAllTypes = () => setSelectedTypes(typeOptions);
  const clearTypes = () => setSelectedTypes([]);

  const formatPrice = (n: number | string) => {
    const num = typeof n === 'string' ? Number(n) : n;
    if (!Number.isFinite(num)) return String(n ?? '');
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(num);
  };

  // ----- Custom Menu for react-select -----
  const CustomMenuList = (props: any) => {
    const filteredOptions = props.options.filter((option: OptionType) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (
      <components.MenuList {...props}>
        <div className="custom-menu-search">
          <input
            type="text"
            placeholder="Buscar tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="custom-menu-input"
          />
          <div className="custom-menu-buttons">
            <button type="button" onClick={selectAllTypes}>Seleccionar todo</button>
            <button type="button" onClick={clearTypes}>Quitar selección</button>
          </div>
        </div>
        {filteredOptions.map((option: OptionType) => (
          <components.Option
            key={option.value}
            {...props}
            data={option}
            isSelected={(selectedTypes as OptionType[]).some((t) => t.value === option.value)}
          >
            {option.label}
          </components.Option>
        ))}
      </components.MenuList>
    );
  };

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

  return (
    <div className="espanya-container">
      <section className="heroes">
        <div className="heroes-content">
          <h1>Welcome to Spain</h1>
          <p>Discover the finest properties in Madrid and Málaga. We connect you with exclusive homes and investment opportunities tailored to your lifestyle and goals.</p>
        </div>
      </section>

      <section className="search-section">
        <form className="search-form" onSubmit={(e) => e.preventDefault()}>
          <select>
            <option>Buy</option>
            <option>Rent</option>
            <option>Rented</option>
          </select>

          <div style={{ flex: 1 }}>
            <Select
              options={typeOptions}
              isMulti
              placeholder="Tipo"
              value={selectedTypes as any}
              onChange={setSelectedTypes as any}
              className="type-select"
              components={{ MenuList: CustomMenuList }}
              isSearchable={false}
              filterOption={null}
            />
          </div>

          <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)}>
            <option value=''>Provincia</option>
            {provincesByCountry['Spain']?.map((province) => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>

          <select disabled={!selectedProvince}>
            <option value=''>Área</option>
            {selectedProvince && areasByProvince[selectedProvince]?.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>

          <select>
            <option>Bedrooms</option>
            <option>1</option>
            <option>2</option>
            <option>3</option>
            <option>4</option>
            <option>5+</option>
          </select>

          <select>
            <option>Max Price</option>
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

      {/* REGIONES (2 tarjetas estilo Home) */}
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


      {/* ZONAS - paginación independiente */}
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

      {/* TYPES - paginación independiente NUEVA */}
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

      {/* PROPIEDADES - paginación independiente */}
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
      {/* Madrid */}
      <img loading="lazy" src="/images_espanya/centro_madrid.jpg" alt="Gran Vía, Madrid" />
      <img loading="lazy" src="/images_espanya/salamanca.jpg" alt="Barrio de Salamanca, Madrid" />
      <img loading="lazy" src="/images_espanya/chamberi.jpg" alt="Parque del Retiro, Madrid" />

      {/* Costa del Sol / Málaga */}
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
