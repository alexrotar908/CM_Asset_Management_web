// src/pages/zona/dubai/dubai.tsx
import './dubai.css';
import Select, { components, type GroupBase } from 'react-select';
import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useDubaiLogic } from './dubaiData';
import type { OptionType } from './dubaiData';

import { useTranslation } from 'react-i18next';
// IMPORTA LOS JSON LOCALES DEL NAMESPACE (igual que en espanya)
import esNs from './i18n/es.json';
import enNs from './i18n/en.json';

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
  const { t } = useTranslation('dubai');
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
          <span>{prop.bedrooms} {t('selection.beds')}</span>
          <span>{prop.bathrooms} {t('selection.baths')}</span>
          <span>{prop.size} m²</span>
        </div>
      </Link>
    </div>
  );
}

export default function Dubai() {
  const { t, i18n } = useTranslation('dubai');

  // Cargar el namespace local si aún no está registrado (igual patrón que espanya)
  if (!i18n.hasResourceBundle('es', 'dubai')) {
    i18n.addResourceBundle('es', 'dubai', esNs, true, true);
  }
  if (!i18n.hasResourceBundle('en', 'dubai')) {
    i18n.addResourceBundle('en', 'dubai', enNs, true, true);
  }

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
    () => [{ label: t('search.types.groupLabel'), options: typeOptions }],
    [t, typeOptions]
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
      typeGroups.forEach((g) => g.options.forEach((o) => map.set(o.value, o)));
      setSelectedTypes(Array.from(map.values()));
    };
    const handleClear = () => setSelectedTypes([] as any);

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

  /* ===== Submit → /search con los filtros del hook ===== */
  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    navigate(getSearchHref());
  };

  const zonesToShow = zonesData.Dubai ?? [];
  const areas =
    areasByCity[t('search.city')] ?? // si en ES el key es "Dubái", intentamos ese
    areasByCity['Dubai City'] ?? []; // fallback

  return (
    <div className="dubai-container">
      <section className="herodub">
        <div className="herodub-content">
          <h1>{t('hero.title')}</h1>
          <p>{t('hero.subtitle')}</p>
        </div>
      </section>

      {/* ===== Buscador ===== */}
      <section className="search-section">
        <form className="search-form" onSubmit={onSubmit}>
          {/* Operación */}
          <select value={operation} onChange={(e) => setOperation(e.target.value as any)}>
            <option value="">{t('search.all')}</option>
            <option value="Buy">{t('search.operation.buy')}</option>
            <option value="Rent">{t('search.operation.rent')}</option>
            <option value="Rented">{t('search.operation.rented')}</option>
          </select>

          {/* TYPE (agrupado) */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <Select<OptionType, true, GroupBase<OptionType>>
              options={typeGroups as unknown as GroupBase<OptionType>[]}
              isMulti
              placeholder={t('search.types.placeholder')}
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
              noOptionsMessage={() => t('search.types.noOptions')}
            />
          </div>

          {/* Ciudad fija (Dubai City) */}
          <select value={t('search.city')} disabled>
            <option>{t('search.city')}</option>
          </select>

          {/* Área */}
          <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} disabled={areas.length === 0}>
            <option value="">{t('search.area')}</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Bedrooms (mínimo) */}
          <select value={bedroomsMin} onChange={(e) => setBedroomsMin(e.target.value)}>
            <option value="">{t('search.bedrooms')}</option>
            <option value="1">1</option><option value="2">2</option>
            <option value="3">3</option><option value="4">4</option>
            <option value="5+">5+</option>
          </select>

          {/* Max Price */}
          <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
            <option value="">{t('search.maxPrice')}</option>
            <option>500.000€</option>
            <option>1.000.000€</option>
            <option>5.000.000€</option>
            <option>10.000.000€</option>
          </select>

          <button type="submit">{t('search.searchBtn')}</button>
        </form>
      </section>

      {/* ZONAS */}
      <section className="zones-section">
        <h2>{t('zones.title')}</h2>
        <p>{t('zones.subtitle')}</p>

        <div className="zones-grid">
          {zonesToShow.map((zone) => (
            <Link key={zone.slug ?? zone.name} to={zone.link} className="zone-card">
              <img src={zone.image} alt={zone.name} />
              <div className="zone-info">
                <h3>{zone.name}</h3>
                <button>{t('zones.cta')}</button>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TYPES */}
      <section className="property-types">
        <h2>{t('typesSection.title')}</h2>
        <p>{t('typesSection.subtitle')}</p>

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
                        <span className="more-details">{t('typesSection.more')}</span>
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
        <h2>{t('selection.title')}</h2>

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
        <h2>{t('welcome.title')}</h2>
        <p>{t('welcome.text')}</p>
        <img src="/images_home/dubai_luxury.jpg" alt="Luxury Dubai" />
      </section>

      <section className="why-choose-us">
        {/** Tres items controlados por i18n, igual que espanya */}
        {(t('why.items', { returnObjects: true }) as Array<{ title: string; text: string }>).map((item, i) => (
          <div key={i} className="why-item">
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
