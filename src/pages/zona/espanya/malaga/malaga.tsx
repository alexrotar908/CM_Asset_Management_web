// src/pages/espanya/malaga/malaga.tsx
import '../espanya.css';
import './malaga.css';
import Select, { components } from 'react-select';
import { Link } from 'react-router-dom';
import { useMalagaLogic, type OptionType } from './malagaData';

export default function Malaga() {
  const {
    selectedProvince, setSelectedProvince,
    selectedTypes, setSelectedTypes,
    searchTerm, setSearchTerm,

    propertyPage, setPropertyPage, propertyTotalPages,

    areasByProvince,
    typeOptions,
    typeCardsForView,
    zoneCards,

    paginatedProperties,
    loading, error
  } = useMalagaLogic();

  if (selectedProvince !== 'Málaga') setSelectedProvince('Málaga');

  const selectAllTypes = () => setSelectedTypes(typeOptions);
  const clearTypes = () => setSelectedTypes([]);

  const formatPrice = (n: number | string) => {
    const num = typeof n === 'string' ? Number(n) : n;
    if (!Number.isFinite(num)) return String(n ?? '');
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(num);
  };

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

  if (loading) {
    return (
      <div className="espanya-container">
        <section className="heroes" style={{ backgroundImage: "url('/images_home/costa_del_sol.jpg')" }}>
          <div className="heroes-content"><h1>Cargando Costa del Sol…</h1></div>
        </section>
      </div>
    );
  }
  if (error) {
    return (
      <div className="espanya-container">
        <section className="heroes" style={{ backgroundImage: "url('/images_home/costa_del_sol.jpg')" }}>
          <div className="heroes-content"><h1>Error</h1><p>{error}</p></div>
        </section>
      </div>
    );
  }

  return (
    <div className="espanya-container">
      {/* HERO */}
      <section className="heroes" style={{ backgroundImage: "url('/images_home/costa_del_sol.jpg')" }}>
        <div className="heroes-content">
          <h1>Welcome to Costa del Sol</h1>
          <p>Discover the finest properties in Málaga and the Costa del Sol.</p>
        </div>
      </section>

      {/* BUSCADOR */}
      <section className="search-section">
        <form className="search-form" onSubmit={(e) => e.preventDefault()}>
          <select>
            <option>Buy</option><option>Rent</option><option>Rented</option>
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

          <select value="Málaga" disabled>
            <option value="Málaga">Málaga</option>
          </select>

          <select>
            <option value=''>Área</option>
            {areasByProvince['Málaga']?.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>

          <select>
            <option>Bedrooms</option>
            <option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option>
          </select>

          <select>
            <option>Max Price</option>
            <option>5.000€</option><option>10.000€</option><option>50.000€</option>
            <option>100.000€</option><option>500.000€</option><option>1.000.000€</option>
          </select>

          <button type="submit">Search</button>
        </form>
      </section>

      {/* ZONAS */}
      <section className="zones-section">
        <h2>Exclusive Properties and Unique Spaces</h2>
        <p>The best properties in Málaga</p>

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
      </section>

      {/* TIPOS */}
      <section className="property-types">
        <h2>Properties by Type Málaga</h2>
        <p>Find the typology that suits your needs</p>

        <div className="types-container">
          {typeCardsForView.map((group, index) => (
            <div key={index} className="type-group">
              <h3>{group.category}</h3>
              <p>{group.description}</p>
              <div className="type-grid">
                {group.types.map((type, idx) => (
                  <Link key={idx} className="type-card" to={`/tipos/malaga_type/${type.slug}`}>
                    <img src={type.image} alt={type.name} />
                    <div className="type-name">{type.name}</div>
                    <span className="more-details">MORE DETAILS</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROPIEDADES */}
      <section className="property-selection">
        <h2>Quality Keys Málaga</h2>
        <div className="selection-grid">
          {paginatedProperties.map(prop => (
            <div key={prop.id} className="property-item">
              <Link to={`/property/${prop.id}`}>
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

      {/* WELCOME */}
      <section className="welcome-section">
        <h2>Discover Your New Home with [Tu Empresa]</h2>
        <p>We invite you to explore our website and discover the available properties, as well as our specialized services...</p>
        <img src="/images_home/espanya_luxury.jpg" alt="Luxury Building" />
      </section>

      {/* WHY */}
      <section className="why-choose-us">
        <div className="why-item"><h3>01. Best Decision</h3><p>We help you make the best decision...</p></div>
        <div className="why-item"><h3>02. Quality Service</h3><p>Quality in service is our fundamental pillar...</p></div>
        <div className="why-item"><h3>03. Satisfaction</h3><p>Objective: the satisfaction of our customers...</p></div>
      </section>
    </div>
  );
}
