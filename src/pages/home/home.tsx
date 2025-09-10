import './home.css';
import { useEffect, useMemo, useState, useCallback } from 'react';
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
  const [typeSearchTerm, setTypeSearchTerm] = useState<string>('');

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

  // =================== TIPOS AGRUPADOS (INDEPENDIENTE DE FILTROS) ===================
  const loadTypeGroups = useCallback(async () => {
    setLoadingTypes(true);

    // Traemos todas las ciudades (zonas) y todos los tipos (sin depender de propiedades)
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

    // Grupos únicos por (pais, ciudad)
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

    // Opciones globales (todos los tipos)
    const allTypeOptions: OptionType[] = tiposData.map((t: any) => ({
      value: String(t.id),
      label: (t.nombre ?? '').trim(),
    }));

    // Construimos grupos con TODOS los tipos debajo
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

  // =================== Custom Menu para el multiselect de Tipos (agrupado) ===================
  const CustomMenuList = (props: any) => {
    // Filtramos por texto, pero respetando grupos y dejando solo los que tengan opciones
    const groups = (props.options as GroupBase<OptionType>[])
      .map((grp: any) => {
        const filteredOpts = (grp.options as OptionType[]).filter((opt) =>
          opt.label.toLowerCase().includes(typeSearchTerm.toLowerCase())
        );
        return { ...grp, options: filteredOpts };
      })
      .filter((grp: any) => grp.options && grp.options.length > 0);

    const handleSelectAll = () => {
      const flat = groups.flatMap((g: any) => g.options) as OptionType[];
      setSelectedTypes(flat);
    };
    const handleClear = () => setSelectedTypes([]);

    return (
      <components.MenuList {...props}>
        <div className="custom-menu-search">
          <input
            type="text"
            placeholder="Buscar tipo..."
            value={typeSearchTerm}
            onChange={(e) => setTypeSearchTerm(e.target.value)}
            className="custom-menu-input"
          />
        </div>
        <div className="custom-menu-buttons">
          <button type="button" onClick={handleSelectAll}>Seleccionar todo</button>
          <button type="button" onClick={handleClear}>Quitar selección</button>
        </div>

        {groups.map((grp: any) => (
          <div key={grp.label}>
            <components.GroupHeading {...props}>{grp.label}</components.GroupHeading>
            {grp.options.map((option: OptionType) => (
              <components.Option
                key={`${grp.label}-${option.value}`}
                {...props}
                data={option}
                isSelected={(selectedTypes as OptionType[]).some((t) => t.value === option.value)}
              >
                {option.label}
              </components.Option>
            ))}
          </div>
        ))}
      </components.MenuList>
    );
  };

  // (opcional) valores estáticos por ahora
  const bedroomOptions = useMemo(() => ['1', '2', '3', '4', '5+'], []);
  const priceOptions = useMemo(
    () => ['5.000€', '10.000€', '50.000€', '100.000€', '500.000€', '1.000.000€'],
    []
  );

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
        <form className="search-form" onSubmit={(e) => e.preventDefault()}>
          {/* Operación */}
          <select value={operation} onChange={(e) => setOperation(e.target.value as any)}>
            <option value="Buy">Buy</option>
            <option value="Rent">Rent</option>
            <option value="Rented">Rented</option>
          </select>

          {/* === TIPO (ANTES QUE PAÍS, SIEMPRE VISIBLE Y AGRUPADO) === */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <Select<OptionType, true, GroupBase<OptionType>>
              options={typeGroups as unknown as GroupBase<OptionType>[]}
              isMulti
              placeholder={loadingTypes ? 'Loading types...' : 'Tipo'}
              value={selectedTypes}
              onChange={setSelectedTypes}
              className="type-select"
              components={{ MenuList: CustomMenuList }}
              isSearchable={false}
              filterOption={null}
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
          <select defaultValue="">
            <option value="" disabled>
              Bedrooms
            </option>
            {bedroomOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Precio Máximo */}
          <select defaultValue="">
            <option value="" disabled>
              Max Price
            </option>
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
