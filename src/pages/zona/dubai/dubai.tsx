import './dubai.css';
import Select, { components } from 'react-select';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { OptionType } from './dubaiData';
import { useDubaiLogic } from './dubaiData';

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
      {/* Ruta unificada con España */}
      <Link
        to={`/propiedad/${prop.id}`}
        state={{ images }}
        className="carousel-card"
      >
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
    selectedCity, setSelectedCity,
    selectedTypes, setSelectedTypes,
    searchTerm, setSearchTerm,
    propertyPage, setPropertyPage,
    cities,
    typeOptions,
    areasByCity,
    zonesData,
    paginatedProperties,
    typeCardsDubaiCity,
    totalPages,
    imagesByProperty,
  } = useDubaiLogic();

  const selectAllTypes = () => setSelectedTypes(typeOptions);
  const clearTypes = () => setSelectedTypes([]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
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
            isSelected={selectedTypes.some((t: OptionType) => t.value === option.value)}
          >
            {option.label}
          </components.Option>
        ))}
      </components.MenuList>
    );
  };

  const zonesToShow = zonesData.Dubai ?? [];

  return (
    <div className="dubai-container">
      <section className="herodub">
        <div className="herodub-content">
          <h1>Welcome to Dubai</h1>
          <p>Discover luxury properties in the heart of the Emirates.</p>
        </div>
      </section>

      <section className="search-section">
        <form className="search-form" onSubmit={onSubmit}>
          <select>
            <option>Buy</option>
            <option>Rent</option>
          </select>

          <div style={{ flex: 1 }}>
            <Select
              options={typeOptions}
              isMulti
              placeholder="Tipo"
              value={selectedTypes}
              onChange={setSelectedTypes as any}
              className="type-select"
              components={{ MenuList: CustomMenuList }}
              isSearchable={false}
              filterOption={null}
            />
          </div>

          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
            <option value=''>Ciudad</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select disabled={!selectedCity}>
            <option value=''>Área</option>
            {selectedCity && areasByCity['Dubai City']?.map((area) => (
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
            <option>500K€</option>
            <option>1M€</option>
            <option>5M€</option>
            <option>10M€</option>
          </select>

          <button type="submit">Search</button>
        </form>
      </section>

      <section className="zones-section">
        <h2>Exclusive Properties and Unique Spaces</h2>
        <p>The best properties in {selectedCity || 'Dubai'}</p>

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

      <section className="property-selection">
        <h2>Exclusive Properties in Selection {selectedCity || 'Dubai'}</h2>

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
