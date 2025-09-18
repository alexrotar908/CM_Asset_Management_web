import './romania.css';
import Select, { components, type GroupBase } from 'react-select';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import type { OptionType } from './romaniaData';
import { useRomaniaLogic } from './romaniaData';

type CityKey = 'Bucharest' | 'Cluj Napoca';
type ZoneCard = { name: string; slug: string; image: string; link: string };
type TypeCard = { name: string; slug: string; image: string };
type TypeGroup = { category: string; description: string; types: TypeCard[] };
type GroupedOption = { label: string; options: OptionType[] };

export default function Romania() {
  const {
    // filtros (alineados con Home/Search)
    operation, setOperation,
    selectedCity, setSelectedCity,
    selectedArea, setSelectedArea,
    selectedTypes, setSelectedTypes,
    bedroomsMin, setBedroomsMin,
    maxPrice, setMaxPrice,
    searchTerm, setSearchTerm,

    // paginaciones independientes
    zonePage, setZonePage, zoneTotalPages,
    typePage, setTypePage, typeTotalPages,
    propertyPage, setPropertyPage,

    // data
    cities,
    typeOptions,       // (no lo usamos directo para el menú, pero sigue útil)
    areasByCity,

    // zonas y tipos ya paginados
    paginatedZones,
    typeCardsForView,

    // props
    paginatedProperties,
    totalPages,

    // helper /search
    getSearchHref,
  } = useRomaniaLogic();

  const navigate = useNavigate();

  /* ===== TIPOS AGRUPADOS (como en España) ===== */
  const [typeGroupsRO, setTypeGroupsRO] = useState<GroupedOption[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingTypes(true);
      try {
        const [{ data: zonas }, { data: tipos }] = await Promise.all([
          supabase
            .from('zonas')
            .select('pais, ciudad')
            .in('ciudad', ['Bucharest', 'Cluj Napoca']),
          supabase.from('tipos').select('nombre, slug').order('nombre', { ascending: true }),
        ]);
        if (!alive) return;

        // Etiquetas únicas por ciudad (mostramos "Romania, Bucharest" / "Romania, Cluj Napoca")
        const cityLabels = Array.from(
          new Map(
            (zonas || [])
              .map((z: any) => {
                const pais = (z?.pais ?? 'Romania').trim();
                const ciudad = (z?.ciudad ?? '').trim();
                if (!ciudad) return null;
                return [`${pais}, ${ciudad}`, true];
              })
              .filter(Boolean) as [string, true][]
          ).keys()
        ).sort((a, b) => a.localeCompare(b));

        // Importante: value = slug (coincide con romaniaData)
        const allTypeOptions: OptionType[] = (tipos || [])
          .filter((t: any) => !!t?.slug)
          .map((t: any) => ({
            value: String(t.slug),
            label: (t.nombre ?? '').trim(),
          }));

        const groups: GroupedOption[] = cityLabels.map((label) => ({
          label,
          options: allTypeOptions,
        }));

        setTypeGroupsRO(groups);
      } finally {
        if (alive) setLoadingTypes(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* ====== UI del selector (idéntico al de España) ====== */
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
      (typeGroupsRO || []).forEach((g) => g.options.forEach((o) => map.set(o.value, o)));
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

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    navigate(getSearchHref());
  };

  // ----- Util -----
  const isCityKey = (c: string): c is CityKey => c === 'Bucharest' || c === 'Cluj Napoca';

  // Carpeta de Tipos (coherente con paginación)
  const typeFolder =
    isCityKey(selectedCity)
      ? (selectedCity === 'Bucharest' ? 'bucharest_type' : 'cluj_type')
      : (typePage === 1 ? 'bucharest_type' : 'cluj_type');

  return (
    <div className="romania-container">
      <section className="herorom">
        <div className="herorom-content">
          <h1>Welcome to Romania</h1>
          <p>Explore the charm of Bucharest and Cluj-Napoca with exclusive properties.</p>
        </div>
      </section>

      <section className="search-section">
        <form className="search-form" onSubmit={onSubmit}>
          {/* Operación */}
          <select value={operation} onChange={(e) => setOperation(e.target.value as any)}>
            <option value="">All</option>
            <option value="Buy">Buy</option>
            <option value="Rent">Rent</option>
            <option value="Rented">Rented</option>
          </select>

          {/* Tipo (agrupado por ciudad, como en España) */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <Select<OptionType, true, GroupBase<OptionType>>
              options={typeGroupsRO as unknown as GroupBase<OptionType>[]}
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
                MultiValue: () => null,
              }}
              isSearchable={false}
              filterOption={null}
              closeMenuOnSelect={false}
              hideSelectedOptions={false}
              isDisabled={loadingTypes || (typeGroupsRO?.length ?? 0) === 0}
              noOptionsMessage={() => (loadingTypes ? 'Loading...' : 'No hay tipos disponibles')}
            />
          </div>

          {/* Ciudad / Área */}
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
            <option value=''>Ciudad</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            disabled={!selectedCity}
          >
            <option value=''>Área</option>
            {isCityKey(selectedCity) && areasByCity[selectedCity]?.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>

          {/* Bedrooms / Max Price */}
          <select value={bedroomsMin} onChange={(e) => setBedroomsMin(e.target.value)}>
            <option value="">Bedrooms</option>
            <option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option>
          </select>

          <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
            <option value="">Max Price</option>
            <option>50.000€</option><option>100.000€</option>
            <option>500.000€</option><option>1.000.000€</option>
          </select>

          <button type="submit">Search</button>
        </form>
      </section>

      {/* ================= ZONAS ================= */}
      <section className="zones-section">
        <h2>Exclusive Properties and Unique Spaces</h2>
        <p>The best properties in {isCityKey(selectedCity) ? selectedCity : 'Romania'}</p>

        <div className="zones-grid">
          {paginatedZones.map((zone: ZoneCard) => (
            <Link key={zone.slug ?? zone.name} to={zone.link} className="zone-card">
              <img src={zone.image} alt={zone.name} />
              <div className="zone-info">
                <h3>{zone.name}</h3>
                <button>View Properties</button>
              </div>
            </Link>
          ))}
        </div>

        {(!isCityKey(selectedCity) && zoneTotalPages > 1) && (
          <div className="pagination">
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

      {/* ================= TYPES ================= */}
      <section className="property-types">
        <h2>Properties by Type {isCityKey(selectedCity) ? selectedCity : 'Romania'}</h2>
        <p>Find the typology that suits your needs</p>

        <div className="types-container">
          {typeCardsForView.map((group: TypeGroup, index: number) => (
            <div key={index} className="type-group">
              <h3>{group.category}</h3>
              <p>{group.description}</p>
              <div className="type-grid">
                {group.types.map((type: TypeCard, idx: number) => (
                  <Link
                    key={idx}
                    className="type-card"
                    to={`/tipos/${typeFolder}/${type.slug}`}
                  >
                    <img src={type.image} alt={type.name} />
                    <div className="type-name">{type.name}</div>
                    <span className="more-details">MORE DETAILS</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {(!isCityKey(selectedCity) && typeTotalPages > 1) && (
          <div className="pagination">
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

      {/* ================= PROPIEDADES ================= */}
      <section className="property-selection">
        <h2>Exclusive Properties in {isCityKey(selectedCity) ? selectedCity : 'Romania'}</h2>

        <div className="selection-grid">
          {paginatedProperties.map((prop) => (
            <div key={prop.id} className="property-item">
              <Link to={`/propiedad/${prop.id}`}>
                <img src={prop.image} alt={prop.title} />
                <h3>{prop.title}</h3>
                <p>{prop.price}</p>
                <div className="property-details">
                  <span>{prop.bedrooms} beds</span>
                  <span>{prop.bathrooms} baths</span>
                  <span>{prop.size} m²</span>
                </div>
              </Link>
            </div>
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
        <h2>Discover Your New Home in Romania</h2>
        <p>We invite you to explore our curated selection of properties across Romania.</p>
        <img src="/images_home/romania_luxury.jpg" alt="Luxury Romania" />
      </section>

      <section className="why-choose-us">
        <div className="why-item">
          <h3>01. Best Decision</h3>
          <p>We help you make the best decisions in the Romanian market.</p>
        </div>
        <div className="why-item">
          <h3>02. Quality Service</h3>
          <p>Our service in Romania is characterized by professionalism and dedication.</p>
        </div>
        <div className="why-item">
          <h3>03. Satisfaction</h3>
          <p>We ensure customer satisfaction with each transaction.</p>
        </div>
      </section>
    </div>
  );
}
