import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Select, { components, type GroupBase } from 'react-select';
import type { MultiValue } from 'react-select';
import { supabase } from '../../lib/supabaseClient';
import './filters.css';

type OptionType = { value: string; label: string };
type GroupedOption = { label: string; options: OptionType[] };
type Operation = 'Buy' | 'Rent' | 'Rented';

const PRICE_MIN = 200;
const PRICE_MAX = 15_000_000;

/** Mapeo de features (clave URL) -> etiqueta mostrada */
const FEATURES: Array<{ key: string; label: string }> = [
  { key: 'air_conditioning', label: 'Air conditioning' },
  { key: 'alarm', label: 'Alarm' },
  { key: 'balcony', label: 'Balcony' },
  { key: 'basement', label: 'Basement' },
  { key: 'central_heating', label: 'Central heating' },
  { key: 'close_to_sea_beach', label: 'Close to sea / beach' },
  { key: 'domotic_system', label: 'Domotic system' },
  { key: 'electric_heating', label: 'Electric heating' },
  { key: 'fitted_kitchen', label: 'Fitted Kitchen' },
  { key: 'front_line_beach', label: 'Front line beach' },
  { key: 'garage', label: 'Garage' },
  { key: 'garden', label: 'Garden' },
  { key: 'gym', label: 'Gym' },
  { key: 'heating', label: 'Heating' },
  { key: 'lift', label: 'Lift' },
  { key: 'marina_view', label: 'Marina view' },
  { key: 'mountain_view', label: 'Mountain view' },
  { key: 'nearby_transport', label: 'Nearby transport' },
  { key: 'office', label: 'Office' },
  { key: 'padel_court', label: 'Padel court' },
  { key: 'pool', label: 'Pool' },
  { key: 'sea_view', label: 'Sea view' },
  { key: 'security', label: 'Security' },
  { key: 'storage_room', label: 'Storage room' },
  { key: 'terrace', label: 'Terrace' },
  { key: 'tennis_court', label: 'Tennis Court' },
  { key: 'urbanisation', label: 'Urbanisation' },
];

type LocSug = { pais: string; ciudad: string; area: string | null; display: string; };

export default function RightFilters({ onApply }: { onApply?: () => void }) {
  const [params, setParams] = useSearchParams();

  // ===== Location (+ autocomplete) =====
  const [locationText, setLocationText] = useState<string>(params.get('loc') || '');
  const [locOpen, setLocOpen] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [locSugs, setLocSugs] = useState<LocSug[]>([]);
  const locWrapRef = useRef<HTMLDivElement | null>(null);

  const applyLocation = useCallback((text: string) => {
    const next = new URLSearchParams(params);
    const v = text.trim();
    if (v) next.set('loc', v); else next.delete('loc');
    next.set('page', '1');
    setParams(next, { replace: true });
  }, [params, setParams]);

  // Cerrar sugerencias al click fuera
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!locWrapRef.current) return;
      if (!locWrapRef.current.contains(e.target as Node)) setLocOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // Buscar sugerencias (zonas) con debounce
  useEffect(() => {
    const q = locationText.trim();
    if (q.length < 2) { setLocSugs([]); return; }

    let cancelled = false;
    const t = setTimeout(async () => {
      setLocLoading(true);
      try {
        const { data, error } = await supabase
          .from('zonas')
          .select('pais, ciudad, area')
          .or(`pais.ilike.%${q}%,ciudad.ilike.%${q}%,area.ilike.%${q}%`)
          .limit(20);
        if (error) throw error;

        const uniq = new Map<string, LocSug>();
        (data || []).forEach((z: any) => {
          const key = `${(z.pais||'').trim()}|${(z.ciudad||'').trim()}|${(z.area||'').trim()}`;
          const display = [z.area, z.ciudad, z.pais].filter(Boolean).join(', ');
          if (!uniq.has(key)) uniq.set(key, { pais: z.pais ?? '', ciudad: z.ciudad ?? '', area: z.area ?? null, display });
        });
        if (!cancelled) setLocSugs(Array.from(uniq.values()));
      } finally {
        if (!cancelled) setLocLoading(false);
      }
    }, 250);

    return () => { cancelled = true; clearTimeout(t); };
  }, [locationText]);

  const chooseLoc = (s: LocSug) => {
    setLocOpen(false);
    setLocationText(s.display);
    // Rellenar selects y URL
    setSelectedCountry(s.pais || '');
    setSelectedProvince(s.ciudad || '');
    setSelectedArea(s.area || '');
    const next = new URLSearchParams(params);
    if (s.pais) next.set('country', s.pais); else next.delete('country');
    if (s.ciudad) next.set('province', s.ciudad); else next.delete('province');
    if (s.area) next.set('area', s.area!); else next.delete('area');
    if (s.display) next.set('loc', s.display); else next.delete('loc');
    next.set('page', '1');
    setParams(next, { replace: true });
    onApply?.();
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const next = new URLSearchParams(params);
        next.set('lat', latitude.toFixed(6));
        next.set('lng', longitude.toFixed(6));
        if (!next.get('use_radius')) next.set('use_radius', 'on');
        if (!next.get('rad')) next.set('rad', '20');
        next.set('page', '1');
        setParams(next, { replace: true });
        // 👇 Importante: NO rellenamos el input con "My location".
        // Dejamos el campo vacío para que se vea el placeholder "Location".
      },
      undefined,
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ===== Estado visible =====
  const [operation, setOperation] = useState<string>(params.get('op') || '');

  // -------- Radius --------
  const initialRadius = (() => {
    const fromUrl = Number(params.get('rad'));
    return Number.isFinite(fromUrl) && fromUrl >= 0 ? fromUrl : 20;
  })();
  const [radiusKm, setRadiusKm] = useState<number>(initialRadius);

  const onRadiusChange = (v: number) => {
    setRadiusKm(v);
    const next = new URLSearchParams(params);
    next.set('use_radius', 'on');
    next.set('rad', String(v));
    next.set('page', '1');
    setParams(next, { replace: true });
  };

  // -------- Zona --------
  const [countries, setCountries] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState(params.get('country') || '');
  const [selectedProvince, setSelectedProvince] = useState(params.get('province') || '');
  const [selectedArea, setSelectedArea] = useState(params.get('area') || '');

  // -------- Tipos --------
  const [typeGroups, setTypeGroups] = useState<GroupedOption[]>([]);
  const [loadingTypes, setLoadingTypes] = useState<boolean>(false);
  const [selectedTypes, setSelectedTypes] = useState<MultiValue<OptionType>>(() => {
    const ids = (params.get('types') || '').split(',').filter(Boolean);
    return ids.map((id) => ({ value: id, label: id }));
  });
  const typesFetchedOnce = useRef(false);

  // -------- Otros filtros --------
  const bedroomsRef = useRef<HTMLSelectElement | null>(null);
  const bathroomsRef = useRef<HTMLSelectElement | null>(null);
  const areaMinRef = useRef<HTMLInputElement | null>(null);
  const areaMaxRef = useRef<HTMLInputElement | null>(null);
  const propertyIdRef = useRef<HTMLInputElement | null>(null);
  const priceMinRef = useRef<HTMLInputElement | null>(null);
  const priceMaxRef = useRef<HTMLInputElement | null>(null);

  // -------- Price dual slider (UNA barra) --------
  const [pmin, setPmin] = useState<number>(Math.max(PRICE_MIN, Number(params.get('pmin') || PRICE_MIN)));
  const [pmax, setPmax] = useState<number>(Math.min(PRICE_MAX, Number(params.get('pmax') || PRICE_MAX)));

  useEffect(() => {
    if (priceMinRef.current) priceMinRef.current.value = String(pmin);
    if (priceMaxRef.current) priceMaxRef.current.value = String(pmax);
  }, [pmin, pmax]);

  const clampPmin = (v: number) => Math.min(Math.max(PRICE_MIN, v), pmax);
  const clampPmax = (v: number) => Math.max(Math.min(PRICE_MAX, v), pmin);

  const onPminChange = (v: number) => setPmin(clampPmin(v));
  const onPmaxChange = (v: number) => setPmax(clampPmax(v));

  // ===== cargar tipos (una vez) =====
  useEffect(() => {
    if (typesFetchedOnce.current) return;
    typesFetchedOnce.current = true;

    (async () => {
      setLoadingTypes(true);
      try {
        const [{ data: zonasData }, { data: tiposData }] = await Promise.all([
          supabase.from('zonas').select('pais, ciudad'),
          supabase.from('tipos').select('id, nombre').order('nombre', { ascending: true }),
        ]);

        if (!zonasData || !tiposData) {
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

        if (selectedTypes.length) {
          const map = new Map(allTypeOptions.map((o) => [o.value, o.label]));
          setSelectedTypes((prev) =>
            prev.map((p) => ({ value: p.value, label: map.get(p.value) || p.value }))
          );
        }
      } finally {
        setLoadingTypes(false);
      }
    })();
  }, [selectedTypes.length]);

  // ===== países / ciudades / áreas =====
  const dedupe = useCallback(
    (arr: (string | null | undefined)[]) =>
      Array.from(new Set(arr.map((s) => (s ?? '').trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    []
  );

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('zonas').select('pais');
      if (data) setCountries(dedupe(data.map((z: any) => z.pais)));
    })();
  }, [dedupe]);

  useEffect(() => {
    if (!selectedCountry) {
      setProvinces([]); setSelectedProvince(''); setAreas([]); setSelectedArea('');
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('zonas').select('ciudad').ilike('pais', selectedCountry.trim());
      if (data) setProvinces(dedupe(data.map((z: any) => z.ciudad)));
      setSelectedProvince(''); setAreas([]); setSelectedArea('');
    })();
  }, [selectedCountry, dedupe]);

  useEffect(() => {
    if (!selectedCountry || !selectedProvince) { setAreas([]); setSelectedArea(''); return; }
    (async () => {
      const { data } = await supabase
        .from('zonas').select('area')
        .ilike('pais', selectedCountry.trim())
        .ilike('ciudad', selectedProvince.trim());
      if (data) setAreas(dedupe(data.map((z: any) => z.area)));
      setSelectedArea('');
    })();
  }, [selectedCountry, selectedProvince, dedupe]);

  // ===== Select Type: UI (igual que en Home) =====
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
      (typeGroups || []).forEach((g) => g.options.forEach((o) => map.set(o.value, o)));
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

  const typeOptionsMemo = useMemo(
    () => typeGroups as unknown as GroupBase<OptionType>[],
    [typeGroups]
  );

  // ====== Features (estado y carga inicial desde URL) ======
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(() => {
    const raw = params.get('feat') || '';
    const arr = raw.split(',').map(s => s.trim()).filter(Boolean);
    return new Set(arr);
  });

  const toggleFeature = (key: string) => {
    setSelectedFeatures(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // ===== Apply → URL =====
  const applyFilters = () => {
    const next = new URLSearchParams(params);
    if (selectedCountry) next.set('country', selectedCountry); else next.delete('country');
    if (selectedProvince) next.set('province', selectedProvince); else next.delete('province');
    if (selectedArea) next.set('area', selectedArea); else next.delete('area');

    if (operation) next.set('op', operation);
    else next.delete('op');

    if (selectedTypes.length) next.set('types', selectedTypes.map((t) => t.value).join(','));
    else next.delete('types');

    const bmin = bedroomsRef.current?.value;
    const tmin = bathroomsRef.current?.value;
    const amin = areaMinRef.current?.value?.trim();
    const amax = areaMaxRef.current?.value?.trim();
    const pid  = propertyIdRef.current?.value?.trim();

    next.set('pmin', String(pmin));
    next.set('pmax', String(pmax));

    if (bmin) next.set('bmin', bmin); else next.delete('bmin');
    if (tmin) next.set('tmin', tmin); else next.delete('tmin');
    if (amin) next.set('amin', amin); else next.delete('amin');
    if (amax) next.set('amax', amax); else next.delete('amax');
    if (pid)  next.set('ref',  pid); else next.delete('ref');

    if (locationText.trim()) next.set('loc', locationText.trim()); else next.delete('loc');

    // features → feat=pool,garage,sea_view
    if (selectedFeatures.size > 0) next.set('feat', Array.from(selectedFeatures).join(','));
    else next.delete('feat');

    next.set('page', '1');
    setParams(next, { replace: true });
    onApply?.();
  };

  const bedroomOptions = useMemo(() => ['1', '2', '3', '4', '5+'], []);
  const bathroomOptions = useMemo(() => ['1', '2', '3', '4', '5+'], []);

  // ===== % barra activa del dual slider (una barra) =====
  const barStyle = useMemo(() => {
    const pct = (v: number) => ((v - PRICE_MIN) * 100) / (PRICE_MAX - PRICE_MIN);
    const minPct = Math.max(0, Math.min(100, pct(pmin)));
    const maxPct = Math.max(0, Math.min(100, pct(pmax)));
    return { ['--min' as any]: `${minPct}%`, ['--max' as any]: `${maxPct}%` } as React.CSSProperties;
  }, [pmin, pmax]);

  return (
    <section className="qk-filters">
      {/* Location + Autocomplete */}
      <div className="qk-filters-row" ref={locWrapRef}>
        <div className="qk-loc-wrap" style={{ flex: 1, minWidth: 240 }}>
          <input
            placeholder="Location"
            value={locationText}
            onChange={(e) => { setLocationText(e.target.value); setLocOpen(true); }}
            onFocus={() => { if ((locationText || '').length >= 2) setLocOpen(true); }}
            onBlur={(e) => applyLocation(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyLocation(locationText); }}
          />
          {locOpen && (locLoading || locSugs.length > 0) && (
            <div className="qk-loc-suggest">
              {locLoading && <div className="qk-loc-item muted">Searching…</div>}
              {!locLoading && locSugs.map((s, i) => (
                <button type="button" key={`${s.pais}-${s.ciudad}-${s.area}-${i}`}
                  className="qk-loc-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => chooseLoc(s)}
                >
                  {s.display}
                </button>
              ))}
              {!locLoading && locSugs.length === 0 && (
                <div className="qk-loc-item muted">No matches</div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          title="Use my location"
          style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }}
          onClick={useMyLocation}
        >
          ⌖
        </button>
      </div>

      {/* Radius */}
      <div className="qk-filters-row" style={{ alignItems: 'center' }}>
        <label style={{ fontWeight: 600, marginRight: 8 }}>Radius {radiusKm} km</label>
        <input
          className="qk-range"
          type="range"
          min={0}
          max={100}
          value={radiusKm}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          style={{ flex: 1 }}
        />
      </div>

      {/* Country / City / Operation / Type */}
      <div className="qk-filters-row">
        <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
          <option value="">All countries</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={selectedProvince}
          onChange={(e) => setSelectedProvince(e.target.value)}
          disabled={!selectedCountry}
        >
          <option value="">{selectedCountry ? 'All cities' : 'All cities'}</option>
          {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <select value={operation} onChange={(e) => setOperation(e.target.value)}>
          <option value="">All</option>
          <option value="Buy">Buy</option>
          <option value="Rent">Rent</option>
          <option value="Rented">Rented</option>
        </select>

        <div style={{ minWidth: 260, flex: 1 }}>
          <Select<OptionType, true, GroupBase<OptionType>>
            instanceId="type-select"
            className="type-select"
            classNamePrefix="rs"
            options={typeOptionsMemo}
            isMulti
            placeholder={loadingTypes ? 'Loading types…' : 'Type'}
            value={selectedTypes}
            onChange={setSelectedTypes}
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
            isDisabled={loadingTypes || (typeOptionsMemo?.length ?? 0) === 0}
            noOptionsMessage={() => (loadingTypes ? 'Loading…' : 'No hay tipos disponibles')}
            menuShouldScrollIntoView={false}
          />
        </div>
      </div>

      {/* Area, Bedrooms, Bathrooms */}
      <div className="qk-filters-row">
        <select ref={bedroomsRef} defaultValue="">
          <option value="">Bedrooms</option>
          {['1','2','3','4','5+'].map((b) => (
            <option key={b} value={b.replace('+','')}>{b}</option>
          ))}
        </select>

        <select ref={bathroomsRef} defaultValue="">
          <option value="">Bathrooms</option>
          {['1','2','3','4','5+'].map((b) => (
            <option key={b} value={b.replace('+','')}>{b}</option>
          ))}
        </select>

        <input ref={areaMinRef} type="number" placeholder="Min. area" />
        <input ref={areaMaxRef} type="number" placeholder="Max. area" />
      </div>

      {/* Area (zona) y Property ID */}
      <div className="qk-filters-row">
        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          disabled={!selectedCountry || !selectedProvince}
        >
          <option value="">{selectedProvince ? 'All areas' : 'All areas'}</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <input ref={propertyIdRef} placeholder="Property ID" />
      </div>

      {/* Price range: dual slider + inputs */}
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ fontSize: 14 }}>
          Price range Of {pmin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          {' '}For{' '}
          {pmax.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
        </div>

        <div className="qk-price-dual" style={barStyle}>
          <input
            className="qk-range min"
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={100}
            value={pmin}
            onChange={(e) => onPminChange(Number(e.target.value))}
            aria-label="Min price"
          />
          <input
            className="qk-range max"
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={100}
            value={pmax}
            onChange={(e) => onPmaxChange(Number(e.target.value))}
            aria-label="Max price"
          />
        </div>

        <div className="qk-filters-row">
          <input
            ref={priceMinRef}
            type="number"
            placeholder="Min price"
            defaultValue={params.get('pmin') || ''}
            onBlur={(e) => setPmin(clampPmin(Number(e.target.value || PRICE_MIN)))}
          />
          <input
            ref={priceMaxRef}
            type="number"
            placeholder="Max price"
            defaultValue={params.get('pmax') || ''}
            onBlur={(e) => setPmax(clampPmax(Number(e.target.value || PRICE_MAX)))}
          />
        </div>
      </div>

      {/* Other features (flecha) */}
      <details className="qk-features">
        <summary>Other features</summary>
        <div className="qk-features-grid">
          {FEATURES.map((f) => (
            <label key={f.key} className="qk-check">
              <input
                type="checkbox"
                checked={selectedFeatures.has(f.key)}
                onChange={() => toggleFeature(f.key)}
              /> {f.label}
            </label>
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
