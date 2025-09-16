import './home.css';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Select, { components } from 'react-select';
import type { MultiValue, GroupBase } from 'react-select';
import { supabase } from '../../lib/supabaseClient';

type OptionType = { value: string; label: string };
type GroupedOption = { label: string; options: OptionType[] };

export default function Home() {
  // ===== Estado de selección =====
  const [operation, setOperation] = useState<'Buy' | 'Rent' | 'Rented'>('Rent');

  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>(''); // ciudad
  const [selectedArea, setSelectedArea] = useState<string>('');

  const [selectedTypes, setSelectedTypes] = useState<MultiValue<OptionType>>([]);

  // Estado para Bedrooms (mínimo) y Max Price (ambos selects ya existían)
  const [bedroomsMin, setBedroomsMin] = useState<string>(''); // '1'...'5+'
  const [maxPrice, setMaxPrice] = useState<string>('');       // p.ej. '100.000€'

  const navigate = useNavigate();

  // ===== Opciones que vienen de DB =====
  const [countries, setCountries] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [typeGroups, setTypeGroups] = useState<GroupedOption[]>([]);
  const [loadingTypes, setLoadingTypes] = useState<boolean>(false);

  // ===== Helpers =====
  const dedupe = (arr: (string | null | undefined)[]) =>
    Array.from(
      new Set(
        arr
          .map((s) => (s ?? '').trim())
          .filter((s): s is string => Boolean(s))
      )
    ).sort((a, b) => a.localeCompare(b));

  // =================== TIPOS AGRUPADOS ===================
  const loadTypeGroups = useCallback(async () => {
    setLoadingTypes(true);

    const [{ data: zonasData, error: zonasErr }, { data: tiposData, error: tiposErr }] =
      await Promise.all([
        supabase.from('zonas').select('pais, ciudad'),
        supabase.from('tipos').select('id, nombre').order('nombre', { ascending: true }),
      ]);

    if (zonasErr || tiposErr || !zonasData || !tiposData) {
      setTypeGroups([]);
      setLoadingTypes(false);
      return;
    }

    const cityGroups = Array.from(
      new Map(
        zonasData
          .map((z: any) => {
            const pais = (z?.pais ?? '').trim();
            const ciudad = (z?.ciudad ?? '').trim();
            if (!pais || !ciudad) return null;
            return [`${pais}, ${ciudad}`, { pais, ciudad }];
          })
          .filter(Boolean) as [string, { pais: string; ciudad: string }][]
      ).keys()
    ).sort((a, b) => a.localeCompare(b));

    const allTypeOptions: OptionType[] = (tiposData ?? []).map((t: any) => ({
      value: String(t.id),
      label: (t.nombre ?? '').trim(),
    }));

    const groups: GroupedOption[] = cityGroups.map((label) => ({
      label,
      options: allTypeOptions,
    }));

    setTypeGroups(groups);
    setLoadingTypes(false);
  }, []);

  useEffect(() => {
    loadTypeGroups();
  }, [loadTypeGroups]);

  // =================== PAISES/PROVINCIAS/AREAS ===================
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('zonas').select('pais');
      if (!error && data) setCountries(dedupe(data.map((z: any) => z.pais)));
    })();
  }, []);

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
        .select('ciudad')
        .ilike('pais', selectedCountry.trim());
      if (!error && data) setProvinces(dedupe(data.map((z: any) => z.ciudad)));
      setSelectedProvince('');
      setAreas([]);
      setSelectedArea('');
    })();
  }, [selectedCountry]);

  useEffect(() => {
    if (!selectedCountry || !selectedProvince) {
      setAreas([]);
      setSelectedArea('');
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('zonas')
        .select('area')
        .ilike('pais', selectedCountry.trim())
        .ilike('ciudad', selectedProvince.trim());

      if (!error && data) setAreas(dedupe(data.map((z: any) => z.area)));
      setSelectedArea('');
    })();
  }, [selectedCountry, selectedProvince]);

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

  const bedroomOptions = useMemo(() => ['1', '2', '3', '4', '5+'], []);
  const priceOptions = useMemo(
    () => ['5.000€', '10.000€', '50.000€', '100.000€', '500.000€', '1.000.000€'],
    []
  );

  // ====== Submit → /search con querystring compatible con Search/RightFilters ======
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const qs = new URLSearchParams();
    qs.set('page', '1');

    // Operación (para que aparezca seleccionada en RightFilters)
    if (operation) qs.set('op', operation);

    // Tipos (ids, separados por coma)
    if (selectedTypes.length) {
      qs.set('types', selectedTypes.map(t => t.value).join(','));
    }

    // Zona
    if (selectedCountry) qs.set('country', selectedCountry);
    if (selectedProvince) qs.set('province', selectedProvince);
    if (selectedArea) qs.set('area', selectedArea);

    // Texto de location (solo para mostrar en el input de Search)
    const locText = [selectedArea, selectedProvince, selectedCountry].filter(Boolean).join(', ');
    if (locText) qs.set('loc', locText);

    // Bedrooms min
    if (bedroomsMin) {
      const bmin = bedroomsMin.replace('+', '');
      qs.set('bmin', bmin);
    }

    // Max price → número (sin puntos/€)
    if (maxPrice) {
      const pmax = parseInt(maxPrice.replace(/\D/g, ''), 10);
      if (Number.isFinite(pmax)) qs.set('pmax', String(pmax));
    }

    navigate(`/search?${qs.toString()}`);
  };

  return (
    <div className="home-container">
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to CM Asset Management</h1>
          <p>
            We have the ability to interpret our clients' needs, ensuring that their operations are
            always a success.
          </p>
        </div>
      </section>

      {/* ===== BUSCADOR ===== */}
      <section className="search-section">
        <form className="search-form" onSubmit={onSubmit}>
          {/* Operación */}
          <select value={operation} onChange={(e) => setOperation(e.target.value as any)}>
            <option value="Buy">Buy</option>
            <option value="Rent">Rent</option>
            <option value="Rented">Rented</option>
          </select>

          {/* === TIPO (AGRUPADO) === */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <Select<OptionType, true, GroupBase<OptionType>>
              options={typeGroups as unknown as GroupBase<OptionType>[]}
              isMulti
              placeholder={loadingTypes ? 'Loading types...' : 'Tipo'}
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
              noOptionsMessage={() => (loadingTypes ? 'Loading...' : 'No hay tipos disponibles')}
            />
          </div>

          {/* País */}
          <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
            <option value="">Select Country</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Provincia/Ciudad */}
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            disabled={!selectedCountry}
          >
            <option value="">Select Province</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Área */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            disabled={!selectedCountry || !selectedProvince}
          >
            <option value="">Select Area</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {/* Dormitorios */}
          <select value={bedroomsMin} onChange={(e) => setBedroomsMin(e.target.value)}>
            <option value="">Bedrooms</option>
            {bedroomOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Precio Máximo */}
          <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
            <option value="">Max Price</option>
            {priceOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <button type="submit">Search</button>
        </form>
      </section>

      {/* ===== resto de Home ===== */}
      <section className="properties-section">
        <h2>Exclusive Properties and Unique Spaces</h2>
        <p>The best properties in Spain, Dubái and Rumanía</p>
        <div className="properties-grid">
          <a href="/espanya" className="property-card">
            <img src="/images_zonas/espanya.png" alt="España" />
            <div className="property-info">
              <h3>Spain</h3>
              <button>View Properties</button>
            </div>
          </a>
          <a href="/dubai" className="property-card">
            <img src="/images_zonas/dubai.png" alt="Dubái" />
            <div className="property-info">
              <h3>Dubái</h3>
              <button>View Properties</button>
            </div>
          </a>
          <a href="/romania" className="property-card">
            <img src="/images_zonas/rumania.png" alt="Rumanía" />
            <div className="property-info">
              <h3>Rumanía</h3>
              <button>View Properties</button>
            </div>
          </a>
        </div>
      </section>

      <section className="welcome-section">
        <h2>Discover Your New Home with CM Asset Management</h2>
        <p>
          We invite you to explore our website and discover the available properties, as well as our
          specialized services...
        </p>
        <img src="/logo.png" alt="Luxury Building" />
      </section>

      <section className="why-choose-us">
        <div className="why-item">
          <h3>01. Best Decision</h3>
          <p>We help you make the best decision...</p>
        </div>
        <div className="why-item">
          <h3>02. Quality Service</h3>
          <p>Quality in service is our fundamental pillar...</p>
        </div>
        <div className="why-item">
          <h3>03. Satisfaction</h3>
          <p>Objective: the satisfaction of our customers...</p>
        </div>
      </section>
    </div>
  );
}
