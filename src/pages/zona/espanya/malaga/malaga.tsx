// src/pages/espanya/malaga/malaga.tsx
import '../espanya.css';
import './malaga.css';
import Select, { components } from 'react-select';
import { Link } from 'react-router-dom';
import { useMalagaLogic, type OptionType } from './malagaData';
import { useTranslation } from 'react-i18next';

// carga namespace local
import esNs from './i18n/es.json';
import enNs from './i18n/en.json';

export default function Malaga() {
  const { t, i18n } = useTranslation('malaga');
  if (!i18n.hasResourceBundle('es', 'malaga')) i18n.addResourceBundle('es', 'malaga', esNs, true, true);
  if (!i18n.hasResourceBundle('en', 'malaga')) i18n.addResourceBundle('en', 'malaga', enNs, true, true);
  const lang: 'es' | 'en' = i18n.language?.startsWith('es') ? 'es' : 'en';

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

  if (selectedProvince !== (lang === 'es' ? 'Málaga' : 'Malaga')) {
    setSelectedProvince(lang === 'es' ? 'Málaga' : 'Malaga');
  }

  const selectAllTypes = () => setSelectedTypes(typeOptions);
  const clearTypes = () => setSelectedTypes([]);

  const formatPrice = (n: number | string) => {
    const num = typeof n === 'string' ? Number(n) : n;
    if (!Number.isFinite(num)) return String(n ?? '');
    return new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(num);
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
            placeholder={t('search.types.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="custom-menu-input"
          />
          <div className="custom-menu-buttons">
            <button type="button" onClick={selectAllTypes}>{t('search.types.selectAll')}</button>
            <button type="button" onClick={clearTypes}>{t('search.types.clear')}</button>
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
          <div className="heroes-content"><h1>{t('hero.title')}</h1></div>
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
          <h1>{t('hero.title')}</h1>
          <p>{t('hero.subtitle')}</p>
        </div>
      </section>

      {/* BUSCADOR */}
      <section className="search-section">
        <form className="search-form" onSubmit={(e) => e.preventDefault()}>
          <select>
            <option>{t('search.operation.buy')}</option>
            <option>{t('search.operation.rent')}</option>
            <option>{t('search.operation.rented')}</option>
          </select>

          <div style={{ flex: 1 }}>
            <Select
              options={typeOptions}
              isMulti
              placeholder={t('search.types.placeholder')}
              value={selectedTypes as any}
              onChange={setSelectedTypes as any}
              className="type-select"
              components={{ MenuList: CustomMenuList }}
              isSearchable={false}
              filterOption={null}
            />
          </div>

          <select value={lang === 'es' ? 'Málaga' : 'Malaga'} disabled>
            <option value={lang === 'es' ? 'Málaga' : 'Malaga'}>{t('search.province')}</option>
          </select>

          <select>
            <option value=''>{t('search.area')}</option>
            {areasByProvince[lang === 'es' ? 'Málaga' : 'Malaga']?.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>

          <select>
            <option>{t('search.bedrooms')}</option>
            <option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option>
          </select>

          <select>
            <option>{t('search.maxPrice')}</option>
            <option>5.000€</option><option>10.000€</option><option>50.000€</option>
            <option>100.000€</option><option>500.000€</option><option>1.000.000€</option>
          </select>

          <button type="submit">{t('search.searchBtn')}</button>
        </form>
      </section>

      {/* ZONAS */}
      <section className="zones-section">
        <h2>{t('zones.title')}</h2>
        <p>{t('zones.subtitle')}</p>

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
      </section>

      {/* TIPOS */}
      <section className="property-types">
        <h2>{t('typesSection.title')}</h2>
        <p>{t('typesSection.subtitle')}</p>

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
                    <span className="more-details">{t('typesSection.more')}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROPIEDADES */}
      <section className="property-selection">
        <h2>{t('selection.title')}</h2>
        <div className="selection-grid">
          {paginatedProperties.map(prop => (
            <div key={prop.id} className="property-item">
              <Link to={`/property/${prop.id}`}>
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

      {/* WELCOME */}
      <section className="welcome-section">
        <h2>{t('welcome.title')}</h2>
        <p>{t('welcome.text')}</p>
        <img src="/images_home/espanya_luxury.jpg" alt="Luxury Building" />
      </section>

      {/* WHY */}
      <section className="why-choose-us">
        <div className="why-item"><h3>{t('why.one.title')}</h3><p>{t('why.one.text')}</p></div>
        <div className="why-item"><h3>{t('why.two.title')}</h3><p>{t('why.two.text')}</p></div>
        <div className="why-item"><h3>{t('why.three.title')}</h3><p>{t('why.three.text')}</p></div>
      </section>
    </div>
  );
}
