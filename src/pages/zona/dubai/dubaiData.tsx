// src/pages/zona/dubai/dubaiData.tsx
import { useEffect, useMemo, useState } from 'react';
import type { MultiValue } from 'react-select';
import { supabase } from '../../../lib/supabaseClient';

/* ---------------------- Tipos de datos (UI) ---------------------- */
export interface OptionType {
  value: string; // ID del tipo (compat con /search)
  label: string; // visible
}

export interface Property {
  id: string;
  title: string;
  price: string;   // formateado
  image: string;   // portada
  bedrooms: number;
  bathrooms: number;
  size: number;
  city: string;    // "Dubai City"
  area?: string;
  typeId?: string | null;
  typeSlug?: string | null;
}

/* ------------------------ Tipos de BD (mínimos) ------------------------ */
type TipoJoin = { id: string; slug: string | null };
type ZonaJoin = { area: string };

type TipoRow = { id: string; nombre: string; slug: string | null };
type ZonaRow = { id: string; pais: string | null; ciudad: string; area: string };
type PropRow = {
  id: string;
  titulo: string;
  descripcion?: string | null;
  precio: number | null;
  dormitorios: number | null;
  banos: number | null;
  metros_cuadrados: number | null;
  imagen_principal: string | null;
  tipo_id?: string | null;
  zona_id: string | null;
  // 👇 Supabase puede devolver objeto o array según la relación
  zonas?: ZonaJoin | ZonaJoin[] | null;
  tipos?: TipoJoin | TipoJoin[] | null;
};
type ImgRow = { propiedad_id: string; url: string; categoria: string | null };

/* Utils para joins 1:1 que a veces vienen como array */
const firstOf = <T,>(v: T | T[] | null | undefined): T | undefined =>
  Array.isArray(v) ? v[0] : v ?? undefined;

/* Constantes */
const COUNTRY_UAE = 'UAE';
const DUBAI_CITY = 'Dubai City';

/* ------------------------------ Hook ------------------------------ */
export const useDubaiLogic = () => {
  /* ===== Filtros compatibles con Home/Search ===== */
  const [operation, setOperation] = useState<'Buy' | 'Rent' | 'Rented' | ''>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<MultiValue<OptionType>>([]);
  const [bedroomsMin, setBedroomsMin] = useState<string>(''); // '1'...'5+'
  const [maxPrice, setMaxPrice] = useState<string>('');        // '1.000.000€'
  const [searchTerm, setSearchTerm] = useState<string>('');

  /* ===== Paginación (propiedades) ===== */
  const [propertyPage, setPropertyPage] = useState<number>(1);
  const propertiesPerPage = 3;

  /* ===== Datos ===== */
  const [typeOptions, setTypeOptions] = useState<OptionType[]>([]);
  const [areasByCity, setAreasByCity] = useState<Record<string, string[]>>({
    [DUBAI_CITY]: [],
  });

  const [zonesData, setZonesData] = useState<
    Record<'Dubai', { name: string; slug: string; image: string; link: string }[]>
  >({ Dubai: [] });

  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [imagesByProperty, setImagesByProperty] = useState<Record<string, string[]>>({});

  const cities = [DUBAI_CITY] as const;

  /* ---------------------- Carga de TIPOS (IDs) ---------------------- */
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('tipos')
        .select('id, nombre, slug')
        .order('nombre', { ascending: true });
      if (!error && data) {
        const opts = (data as TipoRow[]).map(t => ({
          value: String(t.id),
          label: (t.nombre ?? '').trim(),
        }));
        if (opts.length) setTypeOptions(opts);
      }
    })();
  }, []);

  /* -------- Carga de ZONAS (Dubai City) + PROPIEDADES + IMÁGENES -------- */
  useEffect(() => {
    (async () => {
      // 1) Zonas (áreas) de Dubai City
      const { data, error } = await supabase
        .from('zonas')
        .select('id, pais, ciudad, area')
        .eq('ciudad', DUBAI_CITY)
        .eq('pais', COUNTRY_UAE)
        .order('area', { ascending: true });

      if (error || !data) return;
      const rows = data as ZonaRow[];

      const areaImage: Record<string, string> = {
        'Downtown Dubai': '/images_dubai/downtown.jpg',
        'Dubai Marina'  : '/images_dubai/marina.jpg',
        'Palm Jumeirah' : '/images_dubai/palm.jpg',
        'Business Bay'  : '/images_dubai/business_bay.jpg',
      };

      const toSlug = (s: string) =>
        s.normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

      // Áreas para el select
      const nextAreas: Record<string, string[]> = { [DUBAI_CITY]: [] };
      for (const z of rows) nextAreas[DUBAI_CITY].push(z.area);
      setAreasByCity(nextAreas);

      // Cards de zonas
      const dubaiCards = rows.map(z => ({
        name: z.area,
        slug: toSlug(z.area),
        image: areaImage[z.area] ?? '/images_dubai/dubai_fallback.jpg',
        link: `/zone/dubai/${toSlug(z.area)}`,
      }));
      setZonesData({ Dubai: dubaiCards });

      // 2) Propiedades de esas zonas (joins a zona + tipos)
      const zoneIds = rows.map(r => r.id);
      if (!zoneIds.length) return;

      const { data: props, error: perr } = await supabase
        .from('propiedades')
        .select(`
          id,
          titulo,
          precio,
          dormitorios,
          banos,
          metros_cuadrados,
          imagen_principal,
          zona_id,
          tipo_id,
          zonas:zona_id ( area ),
          tipos:tipo_id ( id, slug )
        `)
        .in('zona_id', zoneIds)
        .order('destacada', { ascending: false })
        .order('precio', { ascending: false });

      if (perr || !props) return;

      // 3) Imágenes de esas propiedades
      const propIds = (props as any[]).map((p: any) => p.id);
      const { data: imgs } = await supabase
        .from('imagenes_propiedad')
        .select('propiedad_id, url, categoria')
        .in('propiedad_id', propIds);

      // Orden de categorías para portada
      const order = [
        'portadas', 'entradas',
        'salones', 'comedores', 'cocinas',
        'dormitorios', 'banyos', 'guarda_ropas',
        'pasillos', 'zonas_comunes',
        'exteriores', 'terrazas', 'vistas',
        'lujos'
      ];
      const idx = (c?: string | null) => {
        const k = (c ?? '').toLowerCase();
        const i = order.indexOf(k);
        return i === -1 ? 999 : i;
        };

      const group: Record<string, string[]> = {};
      (imgs as ImgRow[] | null)?.forEach(({ propiedad_id, url, categoria }) => {
        if (!group[propiedad_id]) group[propiedad_id] = [];
        group[propiedad_id].push(JSON.stringify({ url, categoria: categoria ?? '' }));
      });

      for (const k of Object.keys(group)) {
        group[k].sort((a, b) => {
          const A = JSON.parse(a) as { url: string; categoria: string };
          const B = JSON.parse(b) as { url: string; categoria: string };
          const d = idx(A.categoria) - idx(B.categoria);
          return d !== 0 ? d : A.url.localeCompare(B.url);
        });
        group[k] = group[k].map(s => (JSON.parse(s) as { url: string }).url);
      }

      const fmt = (n: number | null) =>
        typeof n === 'number'
          ? n.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' €'
          : '—';

      // Map a nuestro modelo de UI (uniendo objeto/array de joins)
      const mapped: Property[] = (props as unknown as PropRow[]).map((p) => {
        const zona = firstOf(p.zonas);
        const tipo = firstOf(p.tipos);
        const imgsProp = group[p.id] ?? [];
        const cover = imgsProp[0] ?? p.imagen_principal ?? '/images_dubai/dubai_fallback.jpg';

        return {
          id: p.id,
          title: p.titulo,
          price: fmt(p.precio),
          image: cover,
          bedrooms: p.dormitorios ?? 0,
          bathrooms: p.banos ?? 0,
          size: p.metros_cuadrados ?? 0,
          city: DUBAI_CITY,
          area: zona?.area ?? '',
          typeId: p.tipo_id ?? tipo?.id ?? null,
          typeSlug: tipo?.slug ?? null,
        };
      });

      setImagesByProperty(group);
      setAllProperties(mapped);
    })();
  }, []);

  /* ---------------------- Cards "Types" (solo Dubai) ---------------------- */
  const typeCardsDubaiCity = [
    {
      category: 'Luxury Residences',
      description: 'Penthouse, apartments, and beachfront views in Dubai.',
      types: [
        { name: 'Penthouse',             slug: 'penthouse',             image: '/images_type/type_dubai/dubai_penthouse.jpg' },
        { name: 'Apartamento de Lujo',   slug: 'apartamento-de-lujo',   image: '/images_type/type_dubai/lux_apartment.jpg' },
        { name: 'Ático',                 slug: 'atico',                 image: '/images_type/type_dubai/dubai_attic.jpg' }
      ]
    },
    {
      category: 'Family & Lifestyle',
      description: 'Popular family-friendly options and serviced living in Dubai.',
      types: [
        { name: 'Villa',             slug: 'villa',             image: '/images_type/type_dubai/villa_dubai.jpg' },
        { name: 'Townhouse',         slug: 'townhouse',         image: '/images_type/type_dubai/townhouse.jpg' },
        { name: 'Hotel Apartment',   slug: 'hotel-apartment',   image: '/images_type/type_dubai/hotel_dubai.jpg' },
      ]
    }
  ];

  /* ---------------------- Propiedades: filtro + paginación ---------------------- */
  const filteredProperties = useMemo(() => {
    const typeIdSet = new Set((selectedTypes as OptionType[]).map(t => t.value));
    return allProperties
      .filter(p => (selectedArea ? (p.area ?? '') === selectedArea : true))
      .filter(p => (typeIdSet.size ? (p.typeId ? typeIdSet.has(String(p.typeId)) : false) : true))
      .filter(p =>
        searchTerm
          ? (p.title + ' ' + (p.area ?? '')).toLowerCase().includes(searchTerm.toLowerCase())
          : true
      );
  }, [allProperties, selectedArea, selectedTypes, searchTerm]);

  const paginatedProperties = useMemo(() => {
    const start = (propertyPage - 1) * propertiesPerPage;
    return filteredProperties.slice(start, start + propertiesPerPage);
  }, [filteredProperties, propertyPage]);

  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / propertiesPerPage));

  /* ---------------------- URL /search compatible ---------------------- */
  const getSearchHref = () => {
    const qs = new URLSearchParams();
    qs.set('page', '1');

    if (operation) qs.set('op', operation);

    if (selectedTypes.length) {
      qs.set('types', (selectedTypes as OptionType[]).map(t => t.value).join(','));
    }

    qs.set('country', COUNTRY_UAE);
    qs.set('province', DUBAI_CITY);
    if (selectedArea) qs.set('area', selectedArea);

    const locText = [selectedArea, DUBAI_CITY, COUNTRY_UAE].filter(Boolean).join(', ');
    if (locText) qs.set('loc', locText);

    if (bedroomsMin) {
      const bmin = bedroomsMin.replace('+', '');
      qs.set('bmin', bmin);
    }

    if (maxPrice) {
      const pmax = parseInt(maxPrice.replace(/\D/g, ''), 10);
      if (Number.isFinite(pmax)) qs.set('pmax', String(pmax));
    }

    return `/search?${qs.toString()}`;
  };

  return {
    // filtros
    operation, setOperation,
    selectedArea, setSelectedArea,
    selectedTypes, setSelectedTypes,
    bedroomsMin, setBedroomsMin,
    maxPrice, setMaxPrice,
    searchTerm, setSearchTerm,

    // paginación
    propertyPage, setPropertyPage,
    propertiesPerPage,
    totalPages,

    // datos
    cities: [...cities],
    typeOptions,
    areasByCity,
    zonesData,

    // props e imágenes
    allProperties,
    paginatedProperties,
    imagesByProperty,

    // cards
    typeCardsDubaiCity,

    // navegación a /search
    getSearchHref,
  };
};
