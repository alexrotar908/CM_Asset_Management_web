// src/pages/zona/espanya/espanyaData.tsx
import { useEffect, useMemo, useState } from 'react';
import type { MultiValue } from 'react-select';
import { supabase } from '../../../lib/supabaseClient';

export interface OptionType {
  value: string; // usamos ID de tipo (uuid o string) para ser compatible con /search
  label: string;
}

export interface Property {
  id: string;
  title: string;
  price: number;
  image: string;
  bedrooms: number;
  bathrooms: number;
  size: number;
  province: string;
  area?: string;
  typeId?: string | null;   // <- para filtrar por tipo (id)
  typeSlug?: string;
}

type ProvincesMap = Record<string, string[]>;
type AreasMap = Record<string, string[]>;

const COUNTRY_ES = 'España';

export const useEspanyaLogic = () => {
  // ===== FILTROS DEL BUSCADOR (alineado con Home/Search) =====
  const [operation, setOperation] = useState<'Buy' | 'Rent' | 'Rented' | ''>(''); // '' = All
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<MultiValue<OptionType>>([]);
  const [bedroomsMin, setBedroomsMin] = useState<string>(''); // '1'...'5+'
  const [maxPrice, setMaxPrice] = useState<string>('');        // ej. '100.000€'

  // Búsqueda de texto para el listado local de esta página
  const [searchTerm, setSearchTerm] = useState<string>('');

  // ===== PAGINACIONES INDEPENDIENTES =====
  const [zonePage, setZonePage] = useState<number>(1);         // Zonas
  const [typePage, setTypePage] = useState<number>(1);         // Types (tarjetas)
  const [propertyPage, setPropertyPage] = useState<number>(1); // Propiedades

  // ===== ESTADO BD =====
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [typeOptions, setTypeOptions] = useState<OptionType[]>([]);
  const [provincesByCountry, setProvincesByCountry] = useState<ProvincesMap>({ [COUNTRY_ES]: [] });
  const [areasByProvince, setAreasByProvince] = useState<AreasMap>({});

  // Tamaño de página para propiedades
  const propertiesPerPage = 3;

  // ---------- DATA ESTÁTICA (tarjetas) ----------
  const zonesData: Record<string, { name: string; slug: string; image: string; link: string }[]> = {
    Madrid: [
      { name: 'Centro', slug: 'centro', image: '/images_espanya/centro_madrid.jpg', link: '/zone/madrid/centro' },
      { name: 'Salamanca', slug: 'salamanca', image: '/images_espanya/salamanca.jpg', link: '/zone/madrid/salamanca' },
      { name: 'Chamberí', slug: 'chamberi', image: '/images_espanya/chamberi.jpg', link: '/zone/madrid/chamberi' },
      { name: 'Periferia', slug: 'periferia', image: '/images_espanya/periferia.jpg', link: '/zone/madrid/periferia' },
    ],
    Malaga: [
      { name: 'Centro Histórico', slug: 'centro_historico', image: '/images_espanya/malaga_centro.jpg', link: '/zone/malaga/centro' },
      { name: 'La Malagueta', slug: 'malagueta', image: '/images_espanya/malagueta.jpg', link: '/zone/malaga/malagueta' },
      { name: 'Pedregalejo', slug: 'pedregalejo', image: '/images_espanya/pedregalejo.jpg', link: '/zone/malaga/pedregalejo' },
      { name: 'El Palo', slug: 'elpalo', image: '/images_espanya/el_palo.jpg', link: '/zone/malaga/elpalo' },
    ],
  };

  const typeCardsMadrid = [
    {
      category: 'Residential',
      description: 'Buy a villa, flat, penthouse, flat. Find your home among our properties.',
      types: [
        { name: 'Apartamento', slug: 'apartamento', image: '/images_type/type_madrid/apartamento.jpg' },
        { name: 'Villa', slug: 'villa', image: '/images_type/type_madrid/villa.jpg' },
        { name: 'Atico', slug: 'atico', image: '/images_type/type_madrid/attic.jpg' },
        { name: 'Loft', slug: 'loft', image: '/images_type/type_madrid/loft.jpg' }
      ]
    },
    {
      category: 'Commercial',
      description: 'We have the right premises, office, warehouse, hotel or land for your business.',
      types: [
        { name: 'Commercial', slug: 'commercial', image: '/images_type/type_madrid/commercial.jpg' },
        { name: 'Office', slug: 'office', image: '/images_type/type_madrid/office.jpg' },
        { name: 'Building', slug: 'building', image: '/images_type/type_madrid/building.jpg' },
        { name: 'Warehouse', slug: 'warehouse', image: '/images_type/type_madrid/warehouse.jpg' },
        { name: 'Land', slug: 'land', image: '/images_type/type_madrid/land.jpg' }
      ]
    }
  ];

  const typeCardsMalaga = [
    {
      category: 'Residential',
      description: 'Villas, houses, apartments, penthouses. Find your home on the Costa del Sol.',
      types: [
        { name: 'Front Line Beach', slug: 'front_line_beach', image: '/images_type/type_malaga/beach.jpg' },
        { name: 'Front Line Golf', slug: 'front_line_golf', image: '/images_type/type_malaga/golf.jpg' },
        { name: 'Sea View', slug: 'sea_view', image: '/images_type/type_malaga/sea.jpg' },
        { name: 'Villas', slug: 'villas', image: '/images_type/type_malaga/villa_malaga.jpg' }
      ]
    },
    {
      category: 'New Development',
      description: 'Your New Home on the Costa del Sol: Live the Mediterranean Dream',
      types: [
        { name: 'Costa Flats', slug: 'costa_flats', image: '/images_type/type_malaga/flats.jpg' },
        { name: 'Atic/Penthouse', slug: 'attic_penthouse', image: '/images_type/type_malaga/attic_malaga.jpg' },
        { name: 'Apartments', slug: 'apartamento', image: '/images_type/type_malaga/new.jpg' }
      ]
    }
  ];

  // ---------- CARGA DESDE SUPABASE ----------
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Provincias/Áreas solo de España
        const { data: zonas, error: zonasErr } = await supabase
          .from('zonas')
          .select('pais, ciudad, area')
          .eq('pais', COUNTRY_ES);
        if (zonasErr) throw zonasErr;

        if (isMounted && zonas) {
          const provinces = Array.from(new Set(zonas.map(z => (z.ciudad ?? '').trim()).filter(Boolean))).sort();
          const areasMap: AreasMap = {};
          provinces.forEach(p => {
            areasMap[p] = Array.from(
              new Set(zonas.filter(z => (z.ciudad ?? '').trim() === p).map(z => (z.area ?? '').trim()).filter(Boolean))
            ).sort();
          });
          setProvincesByCountry({ [COUNTRY_ES]: provinces });
          setAreasByProvince(areasMap);
        }

        // Tipos → usamos ID + nombre (para /search types=ids)
        const { data: tipos, error: tiposErr } = await supabase
          .from('tipos')
          .select('id, nombre, slug');
        if (tiposErr) throw tiposErr;

        if (isMounted && tipos) {
          setTypeOptions(
            (tipos || []).map((t: any) => ({
              value: String(t.id),
              label: (t.nombre ?? '').trim(),
            }))
          );
        }

        // Propiedades (para listado local en esta página)
        const { data: props, error: propsErr } = await supabase
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
            zonas:zona_id ( ciudad, area ),
            tipos:tipo_id ( id, slug ),
            imagenes_propiedad!imagenes_propiedad_propiedad_id_fkey ( url, categoria )
          `);
        if (propsErr) throw propsErr;

        if (isMounted && props) {
          const mapped: Property[] = (props as any[]).map((p: any) => {
            const firstGallery =
              (p.imagenes_propiedad || []).find((im: any) => im.categoria === 'principal') ||
              (p.imagenes_propiedad || [])[0];

            return {
              id: p.id,
              title: p.titulo,
              price: Number(p.precio),
              image: p.imagen_principal || firstGallery?.url || '',
              bedrooms: p.dormitorios,
              bathrooms: p.banos,
              size: Number(p.metros_cuadrados),
              province: p.zonas?.ciudad ?? '',
              area: p.zonas?.area ?? '',
              typeId: p.tipo_id ?? p.tipos?.id ?? null,
              typeSlug: p.tipos?.slug ?? undefined
            } as Property;
          });

          setAllProperties(mapped);
        }
      } catch (e: any) {
        if (isMounted) setError(e?.message ?? 'Error loading data');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => { isMounted = false; };
  }, []);

  // ---------- PROPIEDADES (filtros + paginación) ----------
  const filteredProperties = useMemo(() => {
    const typeIdSet = new Set((selectedTypes as OptionType[]).map(t => String(t.value)));
    return allProperties
      .filter(p => (selectedProvince ? p.province === selectedProvince : true))
      .filter(p => (selectedArea ? (p.area ?? '') === selectedArea : true))
      .filter(p => (typeIdSet.size ? (p.typeId ? typeIdSet.has(String(p.typeId)) : false) : true))
      .filter(p =>
        searchTerm
          ? (p.title + ' ' + (p.area ?? '')).toLowerCase().includes(searchTerm.toLowerCase())
          : true
      );
  }, [allProperties, selectedProvince, selectedArea, selectedTypes, searchTerm]);

  const propertyTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredProperties.length / propertiesPerPage)),
    [filteredProperties.length]
  );

  const paginatedProperties = useMemo(() => {
    const start = (propertyPage - 1) * propertiesPerPage;
    const end = start + propertiesPerPage;
    return filteredProperties.slice(start, end);
  }, [filteredProperties, propertyPage]);

  useEffect(() => { setPropertyPage(1); }, [selectedProvince, selectedArea, selectedTypes, searchTerm]);

  // ---------- ZONAS (paginación independiente) ----------
  const zoneTotalPages = useMemo(() => (!selectedProvince ? 2 : 1), [selectedProvince]);

  const zoneCards = useMemo(() => {
    if (selectedProvince === 'Madrid') return zonesData.Madrid;
    if (selectedProvince === 'Malaga' || selectedProvince === 'Málaga') return zonesData.Malaga;
    return zonePage === 1 ? zonesData.Madrid : zonesData.Malaga;
  }, [selectedProvince, zonePage]);

  useEffect(() => { setZonePage(1); }, [selectedProvince]);

  // ---------- TYPES (tarjetas; paginación independiente) ----------
  const typeTotalPages = useMemo(() => (!selectedProvince ? 2 : 1), [selectedProvince]);

  const typeCardsForView = useMemo(() => {
    if (selectedProvince === 'Madrid') return typeCardsMadrid;
    if (selectedProvince === 'Malaga' || selectedProvince === 'Málaga') return typeCardsMalaga;
    return typePage === 1 ? typeCardsMadrid : typeCardsMalaga;
  }, [selectedProvince, typePage]);

  useEffect(() => { setTypePage(1); }, [selectedProvince]);

  // ---------- Helper: URL /search compatible ----------
  const getSearchHref = () => {
    const qs = new URLSearchParams();
    qs.set('page', '1');

    // operación
    if (operation) qs.set('op', operation);

    // tipos (ids)
    if (selectedTypes.length) {
      qs.set('types', (selectedTypes as OptionType[]).map(t => t.value).join(','));
    }

    // zona (fijamos España)
    qs.set('country', COUNTRY_ES);
    if (selectedProvince) qs.set('province', selectedProvince);
    if (selectedArea) qs.set('area', selectedArea);

    // texto location (para input de Search)
    const locText = [selectedArea, selectedProvince, COUNTRY_ES].filter(Boolean).join(', ');
    if (locText) qs.set('loc', locText);

    // bedrooms min
    if (bedroomsMin) {
      const bmin = bedroomsMin.replace('+', '');
      qs.set('bmin', bmin);
    }

    // max price numérico
    if (maxPrice) {
      const pmax = parseInt(maxPrice.replace(/\D/g, ''), 10);
      if (Number.isFinite(pmax)) qs.set('pmax', String(pmax));
    }

    return `/search?${qs.toString()}`;
  };

  return {
    // ===== filtros (para el UI) =====
    operation, setOperation,
    selectedProvince, setSelectedProvince,
    selectedArea, setSelectedArea,
    selectedTypes, setSelectedTypes,
    bedroomsMin, setBedroomsMin,
    maxPrice, setMaxPrice,
    searchTerm, setSearchTerm,

    // ===== paginaciones =====
    zonePage, setZonePage, zoneTotalPages,
    typePage, setTypePage, typeTotalPages,
    propertyPage, setPropertyPage, propertyTotalPages,

    // ===== datos y derivados =====
    propertiesPerPage,
    provincesByCountry,
    areasByProvince,
    typeOptions,
    typeCardsMadrid,
    typeCardsMalaga,
    typeCardsForView,
    zoneCards,
    paginatedProperties,

    // ===== status =====
    loading, error,

    // ===== navegación a /search =====
    getSearchHref,
  };
};
