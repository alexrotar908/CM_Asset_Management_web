// src/pages/zona/dubai/dubaiData.tsx
import { useEffect, useMemo, useState } from 'react';
import type { MultiValue } from 'react-select';
import { supabase } from '../../../lib/supabaseClient';

/* ---------------------- Tipos de datos (UI) ---------------------- */
export interface OptionType {
  value: string; // slug
  label: string; // visible
}

export interface Property {
  id: string;      // UUID en BD
  title: string;
  price: string;   // formateado para UI (p.ej. "1.000.000 €")
  image: string;   // portada (primera de imagesByProperty o imagen_principal)
  bedrooms: number;
  bathrooms: number;
  size: number;
  city: string;    // "Dubai City"
}

/* ------------------------ Tipos de BD (mínimos) ------------------------ */
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
  tipo?: string | null;
  tipo_id?: string | null;
  zona_id: string | null;
};
type ImgRow = { propiedad_id: string; url: string; categoria: string | null };

/* ------------------------------ Hook ------------------------------ */
export const useDubaiLogic = () => {
  /* Estado de filtros */
  const [selectedCity, setSelectedCity] = useState<string>(''); // opcional, solo existe Dubai City
  const [selectedTypes, setSelectedTypes] = useState<MultiValue<OptionType>>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  /* Estado de paginación (propiedades) */
  const [propertyPage, setPropertyPage] = useState<number>(1);
  const propertiesPerPage = 3;

  /* Datos para selects/zonas/props */
  const [typeOptions, setTypeOptions] = useState<OptionType[]>([
    { value: 'apartamento-de-lujo', label: 'Apartamento de Lujo' },
    { value: 'villa',               label: 'Villa' },
    { value: 'atico',               label: 'Ático' },
    { value: 'penthouse',           label: 'Penthouse' },
  ]);

  const [areasByCity, setAreasByCity] = useState<Record<string, string[]>>({
    'Dubai City': [],
  });

  // Solo una clave: "Dubai"
  const [zonesData, setZonesData] = useState<
    Record<'Dubai', { name: string; slug: string; image: string; link: string }[]>
  >({ Dubai: [] });

  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [imagesByProperty, setImagesByProperty] = useState<Record<string, string[]>>({});

  /* Selector de ciudad: solo Dubái */
  const cities = ['Dubai City'] as const;

  /* ---------------------- Carga de TIPOS ---------------------- */
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('tipos')
        .select('nombre, slug')
        .order('nombre', { ascending: true });
      if (!error && data) {
        const opts = (data as TipoRow[])
          .filter(t => !!t.slug)
          .map(t => ({ value: String(t.slug), label: t.nombre }));
        if (opts.length) setTypeOptions(opts);
      }
    })();
  }, []);

  /* -------- Carga de ZONAS (solo Dubai City) + PROPIEDADES + IMÁGENES -------- */
  useEffect(() => {
    (async () => {
      // 1) Zonas de Dubai City
      const { data, error } = await supabase
        .from('zonas')
        .select('id, pais, ciudad, area')
        .eq('ciudad', 'Dubai City')
        .eq('pais', 'UAE')
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

      // Áreas de Dubai City
      const nextAreas: Record<string, string[]> = { 'Dubai City': [] };
      for (const z of rows) nextAreas['Dubai City'].push(z.area);
      setAreasByCity(nextAreas);

      // Cards de zonas (clave "Dubai")
      const dubaiCards = rows.map(z => ({
        name: z.area,
        slug: toSlug(z.area),
        image: areaImage[z.area] ?? '/images_dubai/dubai_fallback.jpg',
        link: `/zone/dubai/${toSlug(z.area)}`,
      }));
      setZonesData({ Dubai: dubaiCards });

      // 2) Propiedades de esas zonas
      const zoneIds = rows.map(r => r.id);
      if (!zoneIds.length) return;

      const { data: props, error: perr } = await supabase
        .from('propiedades')
        .select('id, titulo, precio, dormitorios, banos, metros_cuadrados, imagen_principal, zona_id')
        .in('zona_id', zoneIds)
        .order('destacada', { ascending: false })
        .order('precio', { ascending: false });

      if (perr || !props) return;

      // 3) Imágenes de esas propiedades
      const propIds = (props as PropRow[]).map(p => p.id);
      const { data: imgs } = await supabase
        .from('imagenes_propiedad')
        .select('propiedad_id, url, categoria')
        .in('propiedad_id', propIds);

      // Orden para carrusel
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

      // sort con prioridad por categoria
      for (const k of Object.keys(group)) {
        group[k].sort((a, b) => {
          const A = JSON.parse(a) as { url: string; categoria: string };
          const B = JSON.parse(b) as { url: string; categoria: string };
          const d = idx(A.categoria) - idx(B.categoria);
          return d !== 0 ? d : A.url.localeCompare(B.url);
        });
        // Devuelve solo las urls
        group[k] = group[k].map(s => (JSON.parse(s) as { url: string }).url);
      }

      const fmt = (n: number | null) =>
        typeof n === 'number'
          ? n.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' €'
          : '—';

      // Compose propiedades usando la primera imagen como portada
      const mapped: Property[] = (props as PropRow[]).map(p => {
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
          city: 'Dubai City',
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
    return selectedCity ? allProperties.filter(p => p.city === selectedCity) : allProperties;
  }, [allProperties, selectedCity]);

  const paginatedProperties = useMemo(() => {
    const start = (propertyPage - 1) * propertiesPerPage;
    return filteredProperties.slice(start, start + propertiesPerPage);
  }, [filteredProperties, propertyPage]);

  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / propertiesPerPage));

  return {
    // estado
    selectedCity, setSelectedCity,
    selectedTypes, setSelectedTypes,
    searchTerm, setSearchTerm,

    // paginación propiedades
    propertyPage, setPropertyPage,

    // datos (desde BD)
    cities: [...cities],
    typeOptions,
    areasByCity,
    zonesData,

    // propiedades (desde BD)
    allProperties,
    paginatedProperties,
    totalPages,

    // imágenes para carrusel
    imagesByProperty,

    // tarjetas estáticas (solo Dubai)
    typeCardsDubaiCity,
  };
};
