// src/pages/zona/espanya/espanya.tsx
import './espanya.css';
import Select, { components, type GroupBase } from 'react-select';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useEspanyaLogic } from './espanyaData';
import type { OptionType } from './espanyaData';
import { useTranslation } from 'react-i18next';

// IMPORTA LOS JSON LOCALES DEL NAMESPACE
import esNs from './i18n/es.json';
import enNs from './i18n/en.json';

type GroupedOption = { label: string; options: OptionType[] };

export default function Espanya() {
  // ---- i18n: asegura que el namespace esté registrado ----
  const { t, i18n } = useTranslation('espanya');
  useEffect(() => {
    if (!i18n.hasResourceBundle('es', 'espanya')) {
      i18n.addResourceBundle('es', 'espanya', esNs, true, true);
    }
    if (!i18n.hasResourceBundle('en', 'espanya')) {
      i18n.addResourceBundle('en', 'espanya', enNs, true, true);
    }
  }, [i18n]);
  const lang: 'es' | 'en' = i18n.language?.startsWith('es') ? 'es' : 'en';

  // columnas dinámicas por idioma
  const fPais = `pais_${lang}`;
  const fCiudad = `ciudad_${lang}`;
  const fTipo = `nombre_${lang}`;
  const COUNTRY = lang === 'es' ? 'España' : 'Spain';

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
          supabase.from('zonas').select(`${fPais}, ${fCiudad}`).eq(fPais, COUNTRY),
          supabase.from('tipos').select(`id, ${fTipo}, nombre_es, nombre_en, nombre`).order(fTipo as any, { ascending: true }),
        ]);
        if (!alive) return;

        const cityLabels = Array.from(
          new Map(
            (zonas || [])
              .map((z: any) => {
                const pais = String(z?.[fPais] ?? '').trim();
                const ciudad = String(z?.[fCiudad] ?? '').trim();
                if (!pais || !ciudad) return null;
                return [`${pais}, ${ciudad}`, true];
              })
              .filter(Boolean) as [string, true][]
          ).keys()
        ).sort((a, b) => a.localeCompare(b));

        const labelOf = (t: any) =>
          String(t?.[fTipo] ?? t?.nombre_es ?? t?.nombre_en ?? t?.nombre ?? '').trim();

        const allTypeOptions: OptionType[] = (tipos || []).map((t: any) => ({
          value: String(t.id),
          label: labelOf(t),
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
  }, [fPais, fCiudad, fTipo, COUNTRY, lang]);

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
          <span className="rs-count">{count} {t('search.types.countSuffix')}</span>
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
          <button type="button" onClick={handleSelectAll}>{t('search.types.selectAll')}</button>
          <button type="button" onClick={handleClear}>{t('search.types.clear')}</button>
        </div>
        {props.children}
      </components.MenuList>
    );
  };

  // helpers
  const formatPrice = (n: number | string) => {
    const num = typeof n === 'string' ? Number(n) : n;
    if (!Number.isFinite(num)) return String(n ?? '');
    return new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(num);
  };

  // Provincias (la clave viene como país según idioma desde espanyaData)
  const provincesES = provincesByCountry[COUNTRY] || [];

  // loading/error
  if (loading) {
    return (
      <div className="espanya-container">
        <section className="heroes"><div className="heroes-content"><h1>{t('hero.title')}</h1></div></section>
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
    window.location.assign(getSearchHref());
  };

  const place = selectedProvince || COUNTRY;

  return (
    <div className="espanya-container">
      <section className="heroes">
        <div className="heroes-content">
          <h1>{t('hero.title')}</h1>
          <p>{t('hero.subtitle')}</p>
        </div>
      </section>

      {/* ===== Buscador ===== */}
      <section className="search-section">
        <form className="search-form" onSubmit={onSubmit}>
          <select value={operation} onChange={(e) => setOperation(e.target.value as any)}>
            <option value="">{t('search.all')}</option>
            <option value="Buy">{t('search.operation.buy')}</option>
            <option value="Rent">{t('search.operation.rent')}</option>
            <option value="Rented">{t('search.operation.rented')}</option>
          </select>

          <div style={{ flex: 1, minWidth: 260 }}>
            <Select<OptionType, true, GroupBase<OptionType>>
              options={typeGroupsES as unknown as GroupBase<OptionType>[]}
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
              isDisabled={loadingTypes || (typeGroupsES?.length ?? 0) === 0}
              noOptionsMessage={() => (loadingTypes ? t('search.types.loading') : t('search.types.noOptions'))}
            />
          </div>

          <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)}>
            <option value=''>{t('search.province')}</option>
            {provincesES.map((province) => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>

          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            disabled={!selectedProvince}
          >
            <option value=''>{t('search.area')}</option>
            {selectedProvince && (areasByProvince[selectedProvince] || []).map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>

          <select value={bedroomsMin} onChange={(e) => setBedroomsMin(e.target.value)}>
            <option value="">{t('search.bedrooms')}</option>
            <option value="1">1</option><option value="2">2</option>
            <option value="3">3</option><option value="4">4</option>
            <option value="5+">5+</option>
          </select>

          <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
            <option value="">{t('search.maxPrice')}</option>
            <option>5.000€</option>
            <option>10.000€</option>
            <option>50.000€</option>
            <option>100.000€</option>
            <option>500.000€</option>
            <option>1.000.000€</option>
          </select>

          <button type="submit">{t('search.searchBtn')}</button>
        </form>
      </section>

      {/* REGIONES */}
      <section className="regions-section">
        <h2>{t('regions.title')}</h2>
        <p>{t('regions.subtitle')}</p>

        <div className="regions-grid">
          <Link to="/espanya/madrid" className="region-card">
            <img src="/images_home/cibeles2.jpg" alt="Madrid" />
            <div className="region-overlay">
              <h3>{t('regions.madrid.title')}</h3>
              <button>{t('regions.madrid.cta')}</button>
            </div>
          </Link>

          <Link to="/espanya/malaga" className="region-card">
            <img src="/images_home/costa_del_sol.jpg" alt="Costa del Sol" />
            <div className="region-overlay">
              <h3>{t('regions.costa.title')}</h3>
              <button>{t('regions.costa.cta')}</button>
            </div>
          </Link>
        </div>
      </section>

      {/* ZONAS */}
      <section className="zones-section">
        <h2>{t('zones.title')}</h2>
        <p>{t('zones.subtitleIn', { place })}</p>

        <div className="zones-grid">
          {zoneCards.map((zone) => (
            <Link key={zone.slug} to={zone.link} className="zone-card">
              <img src={zone.image} alt={zone.name} />
              <div className="zone-info">
                <h3>{zone.name}</h3>
                <button>{t('zones.cta')}</button>
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

      {/* TYPES */}
      <section className="property-types">
        <h2>{t('typesSection.titleIn', { place })}</h2>
        <p>{t('typesSection.subtitle')}</p>

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
                      <span className="more-details">{t('typesSection.more')}</span>
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
        <h2>{selectedProvince ? t('selection.titleIn', { place: selectedProvince }) : t('selection.titleDefault')}</h2>
        <div className="selection-grid">
          {paginatedProperties.map(prop => (
            <div key={prop.id} className="property-item">
              <Link to={`/propiedad/${encodeURIComponent(prop.id)}`}>
                <img src={prop.image} alt={prop.title} />
                <h3>{prop.title}</h3>
                <p>{formatPrice(prop.price)}</p>
                <div className="property-details">
                  <span>{prop.bedrooms} {t('selection.beds')}</span>
                  <span>{prop.bathrooms} {t('selection.baths')}</span>
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
        <h2>{t('welcome.title')}</h2>
        <p dangerouslySetInnerHTML={{ __html: t('welcome.text') }} />
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

      {/* WHY-CHOOSE-US traducido */}
      <section className="why-choose-us">
        <div className="why-item">
          <h3>{t('why.one.title')}</h3>
          <p>{t('why.one.text')}</p>
        </div>
        <div className="why-item">
          <h3>{t('why.two.title')}</h3>
          <p>{t('why.two.text')}</p>
        </div>
        <div className="why-item">
          <h3>{t('why.three.title')}</h3>
          <p>{t('why.three.text')}</p>
        </div>
      </section>
    </div>
  );
}
