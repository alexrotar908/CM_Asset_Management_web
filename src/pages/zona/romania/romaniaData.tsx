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
  city: string;    // "Bucharest" | "Cluj Napoca"
}

/* ------------------------ Tipos de BD (mínimos) ------------------------ */
type TipoRow = { id: string; nombre: string; slug: string | null };
type ZonaRow = { id: string; ciudad: string; area: string; pais?: string | null };
type PropRow = {
  id: string;
  titulo: string;
  descripcion?: string | null;
  precio: number | null;
  dormitorios: number | null;
  banos: number | null;
  metros_cuadrados: number | null;
  imagen_principal: string | null;
  zona_id: string | null;
  tipo_id?: string | null;
};
type ImgRow = { propiedad_id: string; url: string; categoria: string | null };

/* ------------------------------ Hook ------------------------------ */
export const useRomaniaLogic = () => {
  /* Estado de filtros */
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<MultiValue<OptionType>>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  /* Estado de paginación (propiedades) */
  const [propertyPage, setPropertyPage] = useState<number>(1);
  const propertiesPerPage = 3;

  /* 🔹 Estado de paginación independiente (ZONAS y TIPOS) */
  const [zonePage, setZonePage] = useState<number>(1);
  const zonesPerPage = 4;

  const [typePage, setTypePage] = useState<number>(1);
  const typeCategoriesPerPage = 2; // n.º de bloques/categorías por página

  /* Datos para selects/zonas/props */
  const [typeOptions, setTypeOptions] = useState<OptionType[]>([
    { value: 'apartamento', label: 'Apartamento' },
    { value: 'casa', label: 'Casa' },
    { value: 'penthouse', label: 'Penthouse' },
    { value: 'atico', label: 'Ático' },
  ]);

  const [areasByCity, setAreasByCity] = useState<Record<string, string[]>>({
    Bucharest: [],
    'Cluj Napoca': [],
  });

  const [zonesData, setZonesData] = useState<
    Record<'Bucharest' | 'Cluj Napoca', { name: string; slug: string; image: string; link: string }[]>
  >({ Bucharest: [], 'Cluj Napoca': [] });

  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [imagesByProperty, setImagesByProperty] = useState<Record<string, string[]>>({});

  /* Ciudades en el selector (orden fijo) */
  const cities = ['Bucharest', 'Cluj Napoca'] as const;

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

  /* -------- Carga de ZONAS (Bucharest/Cluj) + PROPIEDADES + IMÁGENES -------- */
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('zonas')
        .select('id, ciudad, area, pais')
        .in('ciudad', ['Bucharest', 'Cluj Napoca'])
        .order('ciudad', { ascending: true })
        .order('area', { ascending: true });

      if (error || !data) return;
      const rows = data as ZonaRow[];

      const areaImage: Record<string, string> = {
        // Bucharest
        'Old Town': '/images_romania/old_town.jpg',
        'Dorobanti': '/images_romania/dorobanti.jpg',
        'Pipera': '/images_romania/pipera.jpg',
        'Cotroceni': '/images_romania/cotroceni.jpg',
        // Cluj
        'Central': '/images_romania/cluj_central.jpg',
        'Grigorescu': '/images_romania/grigorescu.jpg',
        'Zorilor': '/images_romania/zorilor.jpg',
        'Manastur': '/images_romania/manastur.jpg',
      };

      const toSlug = (s: string) =>
        s.normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

      const nextAreas: Record<string, string[]> = { Bucharest: [], 'Cluj Napoca': [] };
      for (const z of rows) {
        if (z.ciudad === 'Bucharest') nextAreas.Bucharest.push(z.area);
        if (z.ciudad === 'Cluj Napoca') nextAreas['Cluj Napoca'].push(z.area);
      }
      setAreasByCity(nextAreas);

      const bucharestCards = rows
        .filter(z => z.ciudad === 'Bucharest')
        .map(z => ({
          name: z.area,
          slug: toSlug(z.area),
          image: areaImage[z.area] ?? '/images_romania/romania_fallback.jpg',
          link: `/zone/bucharest/${toSlug(z.area)}`,
        }));

      const clujCards = rows
        .filter(z => z.ciudad === 'Cluj Napoca')
        .map(z => ({
          name: z.area,
          slug: toSlug(z.area),
          image: areaImage[z.area] ?? '/images_romania/romania_fallback.jpg',
          link: `/zone/cluj/${toSlug(z.area)}`,
        }));

      setZonesData({ Bucharest: bucharestCards, 'Cluj Napoca': clujCards });

      const zoneIds = rows.map(r => r.id);
      if (!zoneIds.length) return;

      const { data: props, error: perr } = await supabase
        .from('propiedades')
        .select('id, titulo, precio, dormitorios, banos, metros_cuadrados, imagen_principal, zona_id')
        .in('zona_id', zoneIds)
        .order('destacada', { ascending: false })
        .order('precio', { ascending: false });

      if (perr || !props) return;

      const propIds = (props as PropRow[]).map(p => p.id);
      const { data: imgs } = await supabase
        .from('imagenes_propiedad')
        .select('propiedad_id, url, categoria')
        .in('propiedad_id', propIds);

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

      const zoneIdToCity: Record<string, string> = {};
      for (const z of rows) zoneIdToCity[z.id] = z.ciudad;

      const fmt = (n: number | null) =>
        typeof n === 'number'
          ? n.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' €'
          : '—';

      const mapped: Property[] = (props as PropRow[]).map(p => {
        const imgsProp = group[p.id] ?? [];
        const cover = imgsProp[0] ?? p.imagen_principal ?? '/images_romania/romania_fallback.jpg';
        return {
          id: p.id,
          title: p.titulo,
          price: fmt(p.precio),
          image: cover,
          bedrooms: p.dormitorios ?? 0,
          bathrooms: p.banos ?? 0,
          size: p.metros_cuadrados ?? 0,
          city: zoneIdToCity[p.zona_id ?? ''] ?? '',
        };
      });

      setImagesByProperty(group);
      setAllProperties(mapped);
    })();
  }, []);

  /* ---------------------- Cards "Types" (estáticas por ciudad) ---------------------- */
  const typeCardsBucharest = [
    {
      category: 'Luxury Living',
      description: 'Premium options for upscale living',
      types: [
        { name: 'Penthouse',   slug: 'penthouse',   image: '/images_type/type_bucharest/bucharest_penthouse.jpg' },
        { name: 'Casa',        slug: 'casa',        image: '/images_type/type_bucharest/bucharest_casa.jpg' },
      ]
    },
    {
      category: 'Modern Lifestyle',
      description: 'Well-situated and stylish',
      types: [
        { name: 'Apartamento', slug: 'apartamento', image: '/images_type/type_bucharest/bucharest_apartament.jpg' },
        { name: 'Ático',       slug: 'atico',       image: '/images_type/type_bucharest/bucharest_atico.jpg' },
      ]
    }
  ];

  const typeCardsCluj = [
    {
      category: 'Elegant Options',
      description: 'Ideal for families and professionals',
      types: [
        { name: 'Casa',        slug: 'casa',        image: '/images_type/type_cluj/cluj_casa.jpg' },
        { name: 'Apartamento', slug: 'apartamento', image: '/images_type/type_cluj/cluj_apartament.jpg' }
      ]
    },
    {
      category: 'City Style',
      description: 'Practical options in top areas',
      types: [
        { name: 'Ático',       slug: 'atico',       image: '/images_type/type_cluj/cluj_atico.jpg' },
        { name: 'Penthouse',   slug: 'penthouse',   image: '/images_type/type_cluj/cluj_penthouse.jpg' }
      ]
    }
  ];

  const typeCardsCombined = typeCardsBucharest.concat(typeCardsCluj);

  /* ---------------------- Propiedades: filtro + paginación ---------------------- */
  const filteredProperties = useMemo(() => {
    return selectedCity ? allProperties.filter(p => p.city === selectedCity) : allProperties;
  }, [allProperties, selectedCity]);

  const paginatedProperties = useMemo(() => {
    const start = (propertyPage - 1) * propertiesPerPage;
    return filteredProperties.slice(start, start + propertiesPerPage);
  }, [filteredProperties, propertyPage]);

  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / propertiesPerPage));

  /* 🔹 ZONAS: fuente + paginación independiente */
  const zoneCardsSource = useMemo(() => {
    if (selectedCity === 'Bucharest') return zonesData.Bucharest;
    if (selectedCity === 'Cluj Napoca') return zonesData['Cluj Napoca'];
    // sin filtro: primero Bucharest, luego Cluj
    return [...zonesData.Bucharest, ...zonesData['Cluj Napoca']];
  }, [zonesData, selectedCity]);

  const paginatedZones = useMemo(() => {
    const start = (zonePage - 1) * zonesPerPage;
    return zoneCardsSource.slice(start, start + zonesPerPage);
  }, [zoneCardsSource, zonePage]);

  const zoneTotalPages = Math.max(1, Math.ceil(zoneCardsSource.length / zonesPerPage));

  /* 🔹 TYPES: fuente + paginación independiente */
  const typeCardsSource = useMemo(() => {
    if (selectedCity === 'Bucharest') return typeCardsBucharest;
    if (selectedCity === 'Cluj Napoca') return typeCardsCluj;
    return typeCardsCombined;
  }, [selectedCity]);

  const typeCardsForView = useMemo(() => {
    const start = (typePage - 1) * typeCategoriesPerPage;
    return typeCardsSource.slice(start, start + typeCategoriesPerPage);
  }, [typeCardsSource, typePage]);

  const typeTotalPages = Math.max(1, Math.ceil(typeCardsSource.length / typeCategoriesPerPage));

  /* Si cambia el filtro de ciudad, reiniciamos cada paginación a 1 */
  useEffect(() => {
    setZonePage(1);
    setTypePage(1);
    setPropertyPage(1);
  }, [selectedCity]);

  return {
    // estado
    selectedCity, setSelectedCity,
    selectedTypes, setSelectedTypes,
    searchTerm, setSearchTerm,

    // paginaciones independientes
    zonePage, setZonePage, zoneTotalPages,
    typePage, setTypePage, typeTotalPages,
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

    // tarjetas estáticas
    typeCardsBucharest,
    typeCardsCluj,
    typeCardsCombined,

    // derivados para UI
    paginatedZones,
    typeCardsForView,
  };
};
