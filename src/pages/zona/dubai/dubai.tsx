// src/pages/zona/dubai/dubai.tsx
import './dubai.css';
import Select, { components, type GroupBase } from 'react-select';
import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useDubaiLogic } from './dubaiData';
import type { OptionType } from './dubaiData';

type GroupedOption = { label: string; options: OptionType[] };

type CardProp = {
  prop: {
    id: string;
    title: string;
    price: string;
    image: string;
    bedrooms: number;
    bathrooms: number;
    size: number;
  };
  images: string[];
};

function PropertyCard({ prop, images }: CardProp) {
  const imgs = images.length ? images : [prop.image];
  const [idx, setIdx] = useState(0);

  const prev: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx((i) => (i - 1 + imgs.length) % imgs.length);
  };
  const next: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx((i) => (i + 1) % imgs.length);
  };
  const jump = (i: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx(i);
  };

  return (
    <div className="property-item">
      <Link to={`/propiedad/${encodeURIComponent(prop.id)}`} state={{ images }} className="carousel-card">
        <div className="carousel-wrap">
          <img src={imgs[idx]} alt={prop.title} />
          {imgs.length > 1 && (
            <>
              <button className="carousel-nav left" onClick={prev} aria-label="Previous">‹</button>
              <button className="carousel-nav right" onClick={next} aria-label="Next">›</button>
              <div className="carousel-dots">
                {imgs.map((_, i) => (
                  <span
                    key={i}
                    className={`dot ${i === idx ? 'active' : ''}`}
                    onClick={jump(i)}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <h3>{prop.title}</h3>
        <p>{prop.price}</p>
        <div className="property-details">
          <span>{prop.bedrooms} beds</span>
          <span>{prop.bathrooms} baths</span>
          <span>{prop.size} m²</span>
        </div>
      </Link>
    </div>
  );
}

export default function Dubai() {
  const {
    // filtros alineados con /search
    operation, setOperation,
    selectedArea, setSelectedArea,
    selectedTypes, setSelectedTypes,
    bedroomsMin, setBedroomsMin,
    maxPrice, setMaxPrice,
    searchTerm, setSearchTerm,

    // paginación
    propertyPage, setPropertyPage,
    totalPages,

    // datos
    typeOptions,
    areasByCity,
    zonesData,

    // propiedades
    paginatedProperties,
    imagesByProperty,

    // tarjetas
    typeCardsDubaiCity,

    // navegación
    getSearchHref,
  } = useDubaiLogic();

  const navigate = useNavigate();

  /* ===== TYPE: mismo UI que Home/Espanya (agrupado) ===== */
  const typeGroups: GroupedOption[] = useMemo(
    () => [{ label: 'UAE, Dubai City', options: typeOptions }],
    [typeOptions]
  );

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
      typeGroups.forEach((g) => g.options.forEach((o) => map.set(o.value, o)));
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

  /* ===== Submit → /search con los filtros del hook ===== */
  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    navigate(getSearchHref());
  };

  const zonesToShow = zonesData.Dubai ?? [];
  const areas = areasByCity['Dubai City'] ?? [];

  return (
    <div className="dubai-container">
      <section className="herodub">
        <div className="herodub-content">
          <h1>Welcome to Dubai</h1>
          <p>Discover luxury properties in the heart of the Emirates.</p>
        </div>
      </section>

      {/* ===== Buscador (clonado del de Home/Espanya) ===== */}
      <section className="search-section">
        <form className="search-form" onSubmit={onSubmit}>
          {/* Operación */}
          <select value={operation} onChange={(e) => setOperation(e.target.value as any)}>
            <option value="">All</option>
            <option value="Buy">Buy</option>
            <option value="Rent">Rent</option>
            <option value="Rented">Rented</option>
          </select>

          {/* TYPE (agrupado) */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <Select<OptionType, true, GroupBase<OptionType>>
              options={typeGroups as unknown as GroupBase<OptionType>[]}
              isMulti
              placeholder="Tipo"
              value={selectedTypes as any}
              onChange={setSelectedTypes as any}
              className="type-select"
              classNamePrefix="rs"
              components={{
                MenuList: CustomMenuList,
                ValueContainer: CustomValueContainer,
                Option: CustomOption,
                MultiValue: () => null,
              }}
              isSearchable={false}
              filterOption={null}
              closeMenuOnSelect={false}
              hideSelectedOptions={false}
              noOptionsMessage={() => 'No hay tipos disponibles'}
            />
          </div>

          {/* Ciudad fija (Dubai City) como en Espanya el “country/province” */}
          <select value="Dubai City" disabled>
            <option>Dubai City</option>
          </select>

          {/* Área */}
          <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} disabled={areas.length === 0}>
            <option value="">Select Area</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Bedrooms (mínimo) */}
          <select value={bedroomsMin} onChange={(e) => setBedroomsMin(e.target.value)}>
            <option value="">Bedrooms</option>
            <option value="1">1</option><option value="2">2</option>
            <option value="3">3</option><option value="4">4</option>
            <option value="5+">5+</option>
          </select>

          {/* Max Price */}
          <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
            <option value="">Max Price</option>
            <option>500.000€</option>
            <option>1.000.000€</option>
            <option>5.000.000€</option>
            <option>10.000.000€</option>
          </select>

          <button type="submit">Search</button>
        </form>
      </section>

      {/* ZONAS */}
      <section className="zones-section">
        <h2>Exclusive Properties and Unique Spaces</h2>
        <p>The best properties in Dubai</p>

        <div className="zones-grid">
          {zonesToShow.map((zone) => (
            <Link key={zone.slug ?? zone.name} to={zone.link} className="zone-card">
              <img src={zone.image} alt={zone.name} />
              <div className="zone-info">
                <h3>{zone.name}</h3>
                <button>View Properties</button>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TYPES */}
      <section className="property-types">
        <h2>Properties by Type Dubai</h2>
        <p>Find the typology that suits your needs</p>

        <div className="types-container">
          {typeCardsDubaiCity.map((group, index) => {
            const folder = 'dubai_type';
            return (
              <div key={index} className="type-group">
                <h3>{group.category}</h3>
                <p>{group.description}</p>
                <div className="type-grid">
                  {group.types.map((type: any, idx: number) => {
                    const slug = type.slug || String(type.name).toLowerCase().replace(/\s+/g, '-');
                    return (
                      <Link key={idx} className="type-card" to={`/tipos/${folder}/${slug}`}>
                        <img src={type.image} alt={type.name} />
                        <div className="type-name">{type.name}</div>
                        <span className="more-details">MORE DETAILS</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* LISTADO PROPIEDADES */}
      <section className="property-selection">
        <h2>Exclusive Properties in Selection Dubai</h2>

        <div className="selection-grid">
          {paginatedProperties.map((prop) => (
            <PropertyCard
              key={prop.id}
              prop={prop}
              images={imagesByProperty[prop.id] ?? [prop.image]}
            />
          ))}
        </div>

        <div className="pagination">
          {Array.from({ length: totalPages }).map((_, idx) => (
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

      <section className="welcome-section">
        <h2>Find Your Dream Property in Dubai</h2>
        <p>We invite you to explore our selection of luxurious residences and investments in the UAE.</p>
        <img src="/images_home/dubai_luxury.jpg" alt="Luxury Dubai" />
      </section>

      <section className="why-choose-us">
        <div className="why-item">
          <h3>01. Best Decision</h3>
          <p>We help you make the best investment decisions in Dubai.</p>
        </div>
        <div className="why-item">
          <h3>02. Quality Service</h3>
          <p>We guarantee premium service for our distinguished clients.</p>
        </div>
        <div className="why-item">
          <h3>03. Satisfaction</h3>
          <p>Our goal is the complete satisfaction of every client.</p>
        </div>
      </section>
    </div>
  );
}
