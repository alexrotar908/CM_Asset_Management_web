import './romania.css';
import Select, { components, type GroupBase } from 'react-select';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import type { OptionType } from './romaniaData';
import { useRomaniaLogic } from './romaniaData';
import { useTranslation } from 'react-i18next';

// Namespace local (igual que en España/Dubái)
import esNs from './i18n/es.json';
import enNs from './i18n/en.json';

type CityKey = 'Bucharest' | 'Cluj Napoca';
type ZoneCard = { name: string; slug: string; image: string; link: string };
type TypeCard = { name: string; slug: string; image: string };
type TypeGroup = { category: string; description: string; types: TypeCard[] };
type GroupedOption = { label: string; options: OptionType[] };

export default function Romania() {
  // Registrar el namespace local
  const { i18n, t } = useTranslation('romania');
  if (!i18n.hasResourceBundle('es', 'romania')) i18n.addResourceBundle('es', 'romania', esNs, true, true);
  if (!i18n.hasResourceBundle('en', 'romania')) i18n.addResourceBundle('en', 'romania', enNs, true, true);

  // Idioma actual (evita union con false)
  const currentLang = (() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
    const l = (stored ?? '').toLowerCase();
    return l.startsWith('en') ? 'en' : 'es';
  })();
  if (i18n.language !== currentLang) i18n.changeLanguage(currentLang);

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

        // Etiquetas únicas por ciudad
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

        // value = slug (coincide con romaniaData)
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
    return () => { alive = false; };
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
          <span className="rs-count">
            {count} {t('search.types.countSuffix')}
          </span>
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
          <button type="button" onClick={handleSelectAll}>{t('search.types.selectAll')}</button>
          <button type="button" onClick={handleClear}>{t('search.types.clear')}</button>
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

  const placeLabel = isCityKey(selectedCity) ? selectedCity : 'Romania';

  return (
    <div className="romania-container">
      <section className="herorom">
        <div className="herorom-content">
          <h1>{t('hero.title')}</h1>
          <p>{t('hero.subtitle')}</p>
        </div>
      </section>

      <section className="search-section">
        <form className="search-form" onSubmit={onSubmit}>
          {/* Operación */}
          <select value={operation} onChange={(e) => setOperation(e.target.value as any)}>
            <option value="">{t('search.all')}</option>
            <option value="Buy">{t('search.operation.buy')}</option>
            <option value="Rent">{t('search.operation.rent')}</option>
            <option value="Rented">{t('search.operation.rented')}</option>
          </select>

          {/* Tipo (agrupado por ciudad) */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <Select<OptionType, true, GroupBase<OptionType>>
              options={typeGroupsRO as unknown as GroupBase<OptionType>[]}
              isMulti
              placeholder={loadingTypes ? t('search.types.loading') : t('search.types.placeholder')}
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
              noOptionsMessage={() => (loadingTypes ? t('search.types.loading') : t('search.types.noOptions'))}
            />
          </div>

          {/* Ciudad / Área */}
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
            <option value="">{t('search.city')}</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            disabled={!selectedCity}
          >
            <option value="">{t('search.area')}</option>
            {isCityKey(selectedCity) && areasByCity[selectedCity]?.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>

          {/* Bedrooms / Max Price */}
          <select value={bedroomsMin} onChange={(e) => setBedroomsMin(e.target.value)}>
            <option value="">{t('search.bedrooms')}</option>
            <option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option>
          </select>

          <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
            <option value="">{t('search.maxPrice')}</option>
            <option>50.000€</option><option>100.000€</option>
            <option>500.000€</option><option>1.000.000€</option>
          </select>

          <button type="submit">{t('search.searchBtn')}</button>
        </form>
      </section>

      {/* ================= ZONAS ================= */}
      <section className="zones-section">
        <h2>{t('zones.title')}</h2>
        <p>{t('zones.subtitleIn', { place: placeLabel })}</p>

        <div className="zones-grid">
          {paginatedZones.map((zone: ZoneCard) => (
            <Link key={zone.slug ?? zone.name} to={zone.link} className="zone-card">
              <img src={zone.image} alt={zone.name} />
              <div className="zone-info">
                <h3>{zone.name}</h3>
                <button>{t('zones.cta')}</button>
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
        <h2>{t('typesSection.titleIn', { place: placeLabel })}</h2>
        <p>{t('typesSection.subtitle')}</p>

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
                    <span className="more-details">{t('typesSection.more')}</span>
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
        <h2>{t('selection.titleIn', { place: placeLabel })}</h2>

        <div className="selection-grid">
          {paginatedProperties.map((prop) => (
            <div key={prop.id} className="property-item">
              <Link to={`/propiedad/${prop.id}`}>
                <img src={prop.image} alt={prop.title} />
                <h3>{prop.title}</h3>
                <p>{prop.price}</p>
                <div className="property-details">
                  <span>{prop.bedrooms} {t('selection.beds')}</span>
                  <span>{prop.bathrooms} {t('selection.baths')}</span>
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
        <h2>{t('welcome.title')}</h2>
        <p>{t('welcome.text')}</p>
        <img src="/images_home/romania_luxury.jpg" alt="Luxury Romania" />
      </section>

      <section className="why-choose-us">
        <div className="why-item">
          <h3>{t('why.best.title')}</h3>
          <p>{t('why.best.text')}</p>
        </div>
        <div className="why-item">
          <h3>{t('why.quality.title')}</h3>
          <p>{t('why.quality.text')}</p>
        </div>
        <div className="why-item">
          <h3>{t('why.satisfaction.title')}</h3>
          <p>{t('why.satisfaction.text')}</p>
        </div>
      </section>
    </div>
  );
}
