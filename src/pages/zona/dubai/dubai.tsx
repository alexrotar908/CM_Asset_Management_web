import './dubai.css';
import Select, { components } from 'react-select';
import type { OptionType } from './dubaiData';
import { useDubaiLogic } from './dubaiData';

export default function Dubai() {
  const {
    selectedCity, setSelectedCity,
    selectedTypes, setSelectedTypes,
    searchTerm, setSearchTerm,
    zonePage, setZonePage,
    propertyPage, setPropertyPage,
    cities,
    typeOptions,
    areasByCity,
    zonesData,
    paginatedProperties,
    typeCardsDubaiCity,
    typeCardsAlAin,
    typeCardsCombined,
    totalPages
  } = useDubaiLogic();

  const selectAllTypes = () => setSelectedTypes(typeOptions);
  const clearTypes = () => setSelectedTypes([]);

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
            isSelected={selectedTypes.some(t => t.value === option.value)}
          >
            {option.label}
          </components.Option>
        ))}
      </components.MenuList>
    );
  };

  return (
    <div className="dubai-container">
      <section className="herodub">
        <div className="herodub-content">
          <h1>Welcome to Dubai</h1>
          <p>Discover luxury properties in the heart of the Emirates.</p>
        </div>
      </section>

      <section className="search-section">
        <form className="search-form">
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
              onChange={setSelectedTypes}
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
            {selectedCity && areasByCity[selectedCity]?.map((area) => (
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
          {(selectedCity
            ? zonesData[selectedCity === 'Dubai City' ? 'Dubai' : 'Al Ain']
            : zonePage === 1
              ? zonesData['Dubai']
              : zonesData['Al Ain']
          ).map((zone) => (
            <a key={zone.name} href={zone.link} className="zone-card">
              <img src={zone.image} alt={zone.name} />
              <div className="zone-info">
                <h3>{zone.name}</h3>
                <button>View Properties</button>
              </div>
            </a>
          ))}
        </div>
        {!selectedCity && (
          <div className="pagination">
            <button onClick={() => setZonePage(1)} className={zonePage === 1 ? 'active' : ''}>1</button>
            <button onClick={() => setZonePage(2)} className={zonePage === 2 ? 'active' : ''}>2</button>
          </div>
        )}
      </section>

      <section className="property-types">
  <h2>Properties by Type {selectedCity || 'Dubai'}</h2>
  <p>Find the typology that suits your needs</p>
  <div className="types-container">
    {(selectedCity
      ? (selectedCity === 'Dubai City' ? typeCardsDubaiCity : typeCardsAlAin)
      : typeCardsCombined).map((group, index) => {
        const folder = selectedCity
          ? selectedCity === 'Dubai City' ? 'dubai_type' : 'alain_type'
          : zonePage === 1 ? 'dubai_type' : 'alain_type';

        return (
          <div key={index} className="type-group">
            <h3>{group.category}</h3>
            <p>{group.description}</p>
            <div className="type-grid">
              {group.types.map((type, idx) => {
                const formattedType = type.name.toLowerCase().replace(/\\s+/g, '-');
                return (
                  <a key={idx} className="type-card" href={`/tipos/${folder}/${formattedType}`}>
                    <img src={type.image} alt={type.name} />
                    <div className="type-name">{type.name}</div>
                    <span className="more-details">MORE DETAILS</span>
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}
  </div>

  {!selectedCity && (
    <div className="pagination">
      <button onClick={() => setZonePage(1)} className={zonePage === 1 ? 'active' : ''}>1</button>
      <button onClick={() => setZonePage(2)} className={zonePage === 2 ? 'active' : ''}>2</button>
    </div>
  )}
</section>

      <section className="property-selection">
        <h2>Exclusive Properties in {selectedCity || 'Dubai'}</h2>
        <div className="selection-grid">
          {paginatedProperties.map(prop => (
            <div key={prop.id} className="property-item">
              <a href={`/property/${prop.id}`}>
                <img src={prop.image} alt={prop.title} />
                <h3>{prop.title}</h3>
                <p>{prop.price}</p>
                <div className="property-details">
                  <span>{prop.bedrooms} beds</span>
                  <span>{prop.bathrooms} baths</span>
                  <span>{prop.size} m²</span>
                </div>
              </a>
            </div>
          ))}
        </div>

        <div className="pagination">
          {[...Array(totalPages)].map((_, idx) => (
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
