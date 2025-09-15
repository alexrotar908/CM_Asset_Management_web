import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Select, { components } from 'react-select';
import type { GroupBase } from 'react-select';
import type { MultiValue } from 'react-select';
import { supabase } from '../../lib/supabaseClient';
import './filters.css';

type OptionType = { value: string; label: string };
type GroupedOption = { label: string; options: OptionType[] };
type Operation = 'Buy' | 'Rent' | 'Rented';

export default function RightFilters({ onApply }: { onApply?: () => void }) {
  const [params, setParams] = useSearchParams();

  // Estado local visible
  const [operation, setOperation] = useState<Operation>((params.get('op') as Operation) || 'Rent');

  // Zona (country / city / area)
  const [countries, setCountries] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState(params.get('country') || '');
  const [selectedProvince, setSelectedProvince] = useState(params.get('province') || '');
  const [selectedArea, setSelectedArea] = useState(params.get('area') || '');

  // Tipos (react-select agrupado)
  const [typeGroups, setTypeGroups] = useState<GroupedOption[]>([]);
  const [loadingTypes, setLoadingTypes] = useState<boolean>(false);
  const [selectedTypes, setSelectedTypes] = useState<MultiValue<OptionType>>(() => {
    const ids = (params.get('types') || '').split(',').filter(Boolean);
    return ids.map(id => ({ value: id, label: id }));
  });
  const typesFetchedOnce = useRef(false);

  // Otros filtros (refs para aplicar al pulsar Search)
  const bedroomsRef = useRef<HTMLSelectElement | null>(null);
  const bathroomsRef = useRef<HTMLSelectElement | null>(null);
  const areaMinRef = useRef<HTMLInputElement | null>(null);
  const areaMaxRef = useRef<HTMLInputElement | null>(null);
  const propertyIdRef = useRef<HTMLInputElement | null>(null);
  const priceMinRef = useRef<HTMLInputElement | null>(null);
  const priceMaxRef = useRef<HTMLInputElement | null>(null);

  // helpers
  const dedupe = useCallback((arr: (string | null | undefined)[]) =>
    Array.from(new Set(arr.map(s => (s ?? '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)), []);

  // ====== cargar tipos (una sola vez; referencias estables) ======
  useEffect(() => {
    if (typesFetchedOnce.current) return;
    typesFetchedOnce.current = true;

    (async () => {
      setLoadingTypes(true);
      try {
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
          options: allTypeOptions, // mismas referencias → sin re-montar
        }));

        setTypeGroups(groups);

        // Mapear ids existentes a labels reales
        if (selectedTypes.length) {
          const map = new Map(allTypeOptions.map(o => [o.value, o.label]));
          setSelectedTypes(prev => prev.map(p => ({ value: p.value, label: map.get(p.value) || p.value })));
        }
      } finally {
        setLoadingTypes(false);
      }
    })();
  }, [selectedTypes.length]);

  // ====== países / ciudades / áreas ======
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('zonas').select('pais');
      if (!error && data) setCountries(dedupe(data.map((z: any) => z.pais)));
    })();
  }, [dedupe]);

  useEffect(() => {
    if (!selectedCountry) {
      setProvinces([]); setSelectedProvince(''); setAreas([]); setSelectedArea('');
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('zonas').select('ciudad').ilike('pais', selectedCountry.trim());
      if (!error && data) setProvinces(dedupe(data.map((z: any) => z.ciudad)));
      setSelectedProvince(''); setAreas([]); setSelectedArea('');
    })();
  }, [selectedCountry, dedupe]);

  useEffect(() => {
    if (!selectedCountry || !selectedProvince) {
      setAreas([]); setSelectedArea(''); return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('zonas').select('area')
        .ilike('pais', selectedCountry.trim())
        .ilike('ciudad', selectedProvince.trim());
      if (!error && data) setAreas(dedupe(data.map((z: any) => z.area)));
      setSelectedArea('');
    })();
  }, [selectedCountry, selectedProvince, dedupe]);

  // ====== Select de Tipo: UI ======
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
        <div className="custom-menu-buttons" style={{ display: 'flex', gap: 8, padding: '6px 8px' }}>
          <button type="button" onClick={handleSelectAll}>Seleccionar todo</button>
          <button type="button" onClick={handleClear}>Quitar selección</button>
        </div>
        {props.children}
      </components.MenuList>
    );
  };

  // ====== Apply → sincroniza a URL (clonando) ======
  const applyFilters = () => {
    const next = new URLSearchParams(params); // CLON

    // zona / operación
    if (selectedCountry) next.set('country', selectedCountry); else next.delete('country');
    if (selectedProvince) next.set('province', selectedProvince); else next.delete('province');
    if (selectedArea) next.set('area', selectedArea); else next.delete('area');
    next.set('op', operation);

    // tipos
    if (selectedTypes.length) {
      next.set('types', selectedTypes.map(t => t.value).join(','));
    } else {
      next.delete('types');
    }

    // otros
    const bmin = bedroomsRef.current?.value;
    const tmin = bathroomsRef.current?.value;
    const amin = areaMinRef.current?.value?.trim();
    const amax = areaMaxRef.current?.value?.trim();
    const pid = propertyIdRef.current?.value?.trim();
    const pmin = priceMinRef.current?.value?.trim();
    const pmax = priceMaxRef.current?.value?.trim();

    if (bmin) next.set('bmin', bmin); else next.delete('bmin');
    if (tmin) next.set('tmin', tmin); else next.delete('tmin');
    if (amin) next.set('amin', amin); else next.delete('amin');
    if (amax) next.set('amax', amax); else next.delete('amax');
    if (pid) next.set('ref', pid); else next.delete('ref');
    if (pmin) next.set('pmin', pmin); else next.delete('pmin');
    if (pmax) next.set('pmax', pmax); else next.delete('pmax');

    next.set('page', '1');

    setParams(next, { replace: true });
    onApply?.();
  };

  // Options estáticas
  const bedroomOptions = useMemo(() => ['1', '2', '3', '4', '5+'], []);
  const bathroomOptions = useMemo(() => ['1', '2', '3', '4', '5+'], []);

  return (
    <section className="qk-filters">
      {/* Location */}
      <div className="qk-filters-row">
        <input disabled placeholder="Location" style={{ flex: 1, minWidth: 240 }} />
        <button type="button" disabled title="Geolocate" style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }}>
          ⌖
        </button>
      </div>

      {/* Radius (visual) */}
      <div className="qk-filters-row" style={{ alignItems: 'center' }}>
        <label style={{ fontWeight: 600, marginRight: 8 }}>Radius 20 km</label>
        <input type="range" min={0} max={100} defaultValue={20} style={{ flex: 1 }} />
      </div>

      {/* Country / City / Operation / Type */}
      <div className="qk-filters-row">
        {/* Country */}
        <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
          <option value="">All countries</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* City */}
        <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} disabled={!selectedCountry}>
          <option value="">{selectedCountry ? 'All cities' : 'All cities'}</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {/* Operation */}
        <select value={operation} onChange={(e) => setOperation(e.target.value as Operation)}>
          <option value="Buy">Buy</option>
          <option value="Rent">Rent</option>
          <option value="Rented">Rented</option>
        </select>

        {/* Type (react-select agrupado) */}
        <div style={{ minWidth: 260, flex: 1 }}>
          <Select<OptionType, true, GroupBase<OptionType>>
            options={typeGroups as unknown as GroupBase<OptionType>[]}
            isMulti
            placeholder={loadingTypes ? 'Loading types…' : 'Type'}
            value={selectedTypes}
            onChange={setSelectedTypes}
            className="type-select"
            components={{
              MenuList: CustomMenuList,
              ValueContainer: CustomValueContainer,
              Option: CustomOption,
              MultiValue: () => null, // oculta chips
            }}
            isSearchable={false}
            filterOption={null}
            closeMenuOnSelect={false}
            hideSelectedOptions={false}
            isDisabled={loadingTypes || (typeGroups?.length ?? 0) === 0}
            noOptionsMessage={() => (loadingTypes ? 'Loading…' : 'No hay tipos disponibles')}
          />
        </div>
      </div>

      {/* Area, Bedrooms, Bathrooms */}
      <div className="qk-filters-row">
        <select ref={bedroomsRef} defaultValue="">
          <option value="">Bedrooms</option>
          {bedroomOptions.map(b => <option key={b} value={b.replace('+','')}>{b}</option>)}
        </select>

        <select ref={bathroomsRef} defaultValue="">
          <option value="">Bathrooms</option>
          {bathroomOptions.map(b => <option key={b} value={b.replace('+','')}>{b}</option>)}
        </select>

        <input ref={areaMinRef} type="number" placeholder="Min. area" />
        <input ref={areaMaxRef} type="number" placeholder="Max. area" />
      </div>

      {/* Area (zona) y Property ID */}
      <div className="qk-filters-row">
        <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} disabled={!selectedCountry || !selectedProvince}>
          <option value="">{selectedProvince ? 'All areas' : 'All areas'}</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <input ref={propertyIdRef} placeholder="Property ID" />
      </div>

      {/* Price range (visual + min/max inputs) */}
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ fontSize: 14 }}>
          Price range Of 200€ For 15.000.000€
        </div>
        <input type="range" min={0} max={100} defaultValue={50} />
        <div className="qk-filters-row">
          <input ref={priceMinRef} type="number" placeholder="Min price" defaultValue={params.get('pmin') || ''} />
          <input ref={priceMaxRef} type="number" placeholder="Max price" defaultValue={params.get('pmax') || ''} />
        </div>
      </div>

      {/* Other features (visual) */}
      <details className="qk-features">
        <summary>Other features</summary>
        <div className="qk-features-grid">
          {[
            'Air conditioning','Alarm','Balcony','Basement','Central heating','Close to sea / beach',
            'Domotic system','Electric heating','Fitted Kitchen','Front line beach','Garage','Garden',
            'Gym','Heating','Lift','Marina view','Mountain view','Nearby transport','Office',
            'Padel court','Pool','Sea view','Security','Storage room','Terrace','Tennis Court','Urbanisation'
          ].map(f => (
            <label key={f}><input type="checkbox" disabled /> {f}</label>
          ))}
        </div>
      </details>

      {/* Acciones */}
      <div className="qk-filters-row">
        <button className="qk-search-btn" type="button" onClick={applyFilters}>Search</button>
        <button className="qk-save-btn" type="button">Save search</button>
      </div>
    </section>
  );
}
