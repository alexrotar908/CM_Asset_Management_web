import './home.css';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Select, { components } from 'react-select';
import type { MultiValue, GroupBase } from 'react-select';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

type OptionType = { value: string; label: string };
type GroupedOption = { label: string; options: OptionType[] };

export default function Home() {
  const { t, i18n } = useTranslation('home');
  const currentLang: 'es' | 'en' = i18n.language?.startsWith('es') ? 'es' : 'en';

  // Helpers para nombres de columnas por idioma
  const fPais   = `pais_${currentLang}`;
  const fCiudad = `ciudad_${currentLang}`;
  const fArea   = `area_${currentLang}`;
  const fTipo   = `nombre_${currentLang}`;

  // ===== Estado de selección =====
  const [operation, setOperation] = useState<'Buy' | 'Rent' | 'Rented'>('Rent');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>(''); // ciudad
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<MultiValue<OptionType>>([]);

  const [bedroomsMin, setBedroomsMin] = useState<string>(''); 
  const [maxPrice, setMaxPrice] = useState<string>('');       

  const navigate = useNavigate();

  // ===== Opciones que vienen de DB =====
  const [countries, setCountries] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [typeGroups, setTypeGroups] = useState<GroupedOption[]>([]);
  const [loadingTypes, setLoadingTypes] = useState<boolean>(false);

  // Si cambia el idioma, reseteamos selección de zona (evita mezclas es/en)
  useEffect(() => {
    setSelectedCountry('');
    setSelectedProvince('');
    setSelectedArea('');
  }, [currentLang]);

  // ===== Helpers =====
  const dedupe = (arr: (string | null | undefined)[]) =>
    Array.from(
      new Set(
        arr
          .map((s) => (s ?? '').trim())
          .filter((s): s is string => Boolean(s))
      )
    ).sort((a, b) => a.localeCompare(b));

  const pick = (obj: any, key: string, fallbackKeys: string[] = []) => {
    if (obj?.[key]) return String(obj[key]).trim();
    for (const k of fallbackKeys) if (obj?.[k]) return String(obj[k]).trim();
    return '';
  };

  // =================== TIPOS AGRUPADOS ===================
  const loadTypeGroups = useCallback(async () => {
    setLoadingTypes(true);

    // Zonas con columnas bilingües
    const [{ data: zonasData, error: zonasErr }, { data: tiposData, error: tiposErr }] =
      await Promise.all([
        supabase.from('zonas').select(`${fPais}, ${fCiudad}`),
        // Tipos: traemos es/en + original por si faltan (fallback)
        supabase
          .from('tipos')
          .select(`id, ${fTipo}, nombre_es, nombre_en, nombre`)
          .order(fTipo as any, { ascending: true }) // orden por idioma
      ]);

    if (zonasErr || tiposErr || !zonasData || !tiposData) {
      setTypeGroups([]);
      setLoadingTypes(false);
      return;
    }

    // Grupo visible "PAIS, CIUDAD" en idioma activo
    const cityGroups = Array.from(
      new Map(
        zonasData
          .map((z: any) => {
            const pais   = pick(z, fPais);
            const ciudad = pick(z, fCiudad);
            if (!pais || !ciudad) return null;
            return [`${pais}, ${ciudad}`, { pais, ciudad }];
          })
          .filter(Boolean) as [string, { pais: string; ciudad: string }][]
      ).keys()
    ).sort((a, b) => a.localeCompare(b));

    // Opciones de tipos con etiqueta en idioma (fallback: ES → EN → original)
    const allTypeOptions: OptionType[] = (tiposData ?? []).map((t: any) => {
      const label =
        pick(t, fTipo) ||
        pick(t, 'nombre_es') ||
        pick(t, 'nombre_en') ||
        pick(t, 'nombre');
      return { value: String(t.id), label };
    });

    const groups: GroupedOption[] = cityGroups.map((label) => ({
      label,
      options: allTypeOptions,
    }));

    setTypeGroups(groups);
    setLoadingTypes(false);
  }, [fPais, fCiudad, fTipo, currentLang]);

  useEffect(() => {
    loadTypeGroups();
  }, [loadTypeGroups]);

  // =================== PAISES/PROVINCIAS/AREAS ===================
  // Paises
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('zonas').select(fPais);
      if (!error && data) setCountries(dedupe(data.map((z: any) => pick(z, fPais))));
    })();
  }, [fPais, currentLang]);

  // Provincias por país
  useEffect(() => {
    if (!selectedCountry) {
      setProvinces([]);
      setSelectedProvince('');
      setAreas([]);
      setSelectedArea('');
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('zonas')
        .select(fCiudad)
        .ilike(fPais, selectedCountry.trim());
      if (!error && data) setProvinces(dedupe(data.map((z: any) => pick(z, fCiudad))));
      setSelectedProvince('');
      setAreas([]);
      setSelectedArea('');
    })();
  }, [selectedCountry, fPais, fCiudad, currentLang]);

  // Áreas por país + provincia
  useEffect(() => {
    if (!selectedCountry || !selectedProvince) {
      setAreas([]);
      setSelectedArea('');
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('zonas')
        .select(fArea)
        .ilike(fPais, selectedCountry.trim())
        .ilike(fCiudad, selectedProvince.trim());

      if (!error && data) setAreas(dedupe(data.map((z: any) => pick(z, fArea))));
      setSelectedArea('');
    })();
  }, [selectedCountry, selectedProvince, fPais, fCiudad, fArea, currentLang]);

  // =================== Custom components para el multiselect de Tipos ===================
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
    const handleClear = () => setSelectedTypes([]);

    return (
      <components.MenuList {...props}>
        <div className="custom-menu-buttons">
          <button type="button" onClick={handleSelectAll}>
            {t('search.types.selectAll')}
          </button>
          <button type="button" onClick={handleClear}>
            {t('search.types.clear')}
          </button>
        </div>
        {props.children}
      </components.MenuList>
    );
  };

  const bedroomOptions = useMemo(() => t('search.bedroomOptions', { returnObjects: true }) as string[], [t]);
  const priceOptions = useMemo(() => t('search.priceOptions', { returnObjects: true }) as string[], [t]);

  // ====== Submit → /search con querystring ======
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const qs = new URLSearchParams();
    qs.set('page', '1');

    if (operation) qs.set('op', operation);
    if (selectedTypes.length) qs.set('types', selectedTypes.map(t => t.value).join(','));
    if (selectedCountry) qs.set('country', selectedCountry);
    if (selectedProvince) qs.set('province', selectedProvince);
    if (selectedArea) qs.set('area', selectedArea);

    const locText = [selectedArea, selectedProvince, selectedCountry].filter(Boolean).join(', ');
    if (locText) qs.set('loc', locText);

    if (bedroomsMin) {
      const bmin = bedroomsMin.replace('+', '');
      qs.set('bmin', bmin);
    }
    if (maxPrice) {
      const pmax = parseInt(maxPrice.replace(/\D/g, ''), 10);
      if (Number.isFinite(pmax)) qs.set('pmax', String(pmax));
    }

    navigate(`/search?${qs.toString()}`);
  };

  // ============ WHY ITEMS (fix TS) ============
  type WhyItem = { title: string; text: string };
  const whyItems = t('sections.why.items', { returnObjects: true }) as WhyItem[];

  return (
    <div className="home-container">
      <section className="hero">
        <div className="hero-content">
          <h1>{t('hero.title')}</h1>
          <p>{t('hero.subtitle')}</p>
        </div>
      </section>

      {/* ===== BUSCADOR ===== */}
      <section className="search-section">
        <form className="search-form" onSubmit={onSubmit}>
          {/* Operación */}
          <select value={operation} onChange={(e) => setOperation(e.target.value as any)}>
            <option value="Buy">{t('search.operation.buy')}</option>
            <option value="Rent">{t('search.operation.rent')}</option>
            <option value="Rented">{t('search.operation.rented')}</option>
          </select>

          {/* === TIPO (AGRUPADO) === */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <Select<OptionType, true, GroupBase<OptionType>>
              options={typeGroups as unknown as GroupBase<OptionType>[]}
              isMulti
              placeholder={loadingTypes ? t('search.types.loading') : t('search.types.placeholder')}
              value={selectedTypes}
              onChange={setSelectedTypes}
              className="type-select"
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
              isDisabled={loadingTypes || (typeGroups?.length ?? 0) === 0}
              noOptionsMessage={() =>
                loadingTypes ? t('search.types.loading') : t('search.types.noOptions')
              }
            />
          </div>

          {/* País */}
          <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
            <option value="">{t('search.country')}</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Provincia/Ciudad */}
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            disabled={!selectedCountry}
          >
            <option value="">{t('search.province')}</option>
            {provinces.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Área */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            disabled={!selectedCountry || !selectedProvince}
          >
            <option value="">{t('search.area')}</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Dormitorios */}
          <select value={bedroomsMin} onChange={(e) => setBedroomsMin(e.target.value)}>
            <option value="">{t('search.bedrooms')}</option>
            {bedroomOptions.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Precio Máximo */}
          <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
            <option value="">{t('search.maxPrice')}</option>
            {priceOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <button type="submit">{t('search.searchBtn')}</button>
        </form>
      </section>

      {/* ===== resto de Home ===== */}
      <section className="properties-section">
        <h2>{t('sections.exclusive.title')}</h2>
        <p>{t('sections.exclusive.subtitle')}</p>
        <div className="properties-grid">
          <a href="/espanya" className="property-card">
            <img src="/images_zonas/espanya.png" alt="España" />
            <div className="property-info">
              <h3>{t('sections.exclusive.cards.spain.title')}</h3>
              <button>{t('sections.exclusive.cards.spain.cta')}</button>
            </div>
          </a>
          <a href="/dubai" className="property-card">
            <img src="/images_zonas/dubai.png" alt="Dubái" />
            <div className="property-info">
              <h3>{t('sections.exclusive.cards.dubai.title')}</h3>
              <button>{t('sections.exclusive.cards.dubai.cta')}</button>
            </div>
          </a>
          <a href="/romania" className="property-card">
            <img src="/images_zonas/rumania.png" alt="Rumanía" />
            <div className="property-info">
              <h3>{t('sections.exclusive.cards.romania.title')}</h3>
              <button>{t('sections.exclusive.cards.romania.cta')}</button>
            </div>
          </a>
        </div>
      </section>

      <section className="welcome-section">
        <h2>{t('sections.welcome.title')}</h2>
        <p>{t('sections.welcome.text')}</p>
        <img src="/logo.png" alt="Luxury Building" />
      </section>

      <section className="why-choose-us">
        {(Array.isArray(whyItems) ? whyItems : []).map((item, idx) => (
          <div key={idx} className="why-item">
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
