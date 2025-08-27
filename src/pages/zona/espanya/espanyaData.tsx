import { useEffect, useMemo, useState } from 'react';
import type { MultiValue } from 'react-select';
import { supabase } from '../../../lib/supabaseClient';

export interface OptionType {
  value: string;
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
  typeSlug?: string;
}

type ProvincesMap = Record<string, string[]>;
type AreasMap = Record<string, string[]>;

export const useEspanyaLogic = () => {
  // FILTROS
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<MultiValue<OptionType>>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // PAGINACIONES INDEPENDIENTES
  const [zonePage, setZonePage] = useState<number>(1);        // Zonas
  const [typePage, setTypePage] = useState<number>(1);        // Types (NUEVA)
  const [propertyPage, setPropertyPage] = useState<number>(1); // Propiedades

  // ESTADO BD
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [typeOptions, setTypeOptions] = useState<OptionType[]>([]);
  const [provincesByCountry, setProvincesByCountry] = useState<ProvincesMap>({ Spain: [] });
  const [areasByProvince, setAreasByProvince] = useState<AreasMap>({});

  // Tamaño de página para propiedades
  const propertiesPerPage = 3;

  // ---------- DATA ESTÁTICA ----------
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

        const { data: zonas, error: zonasErr } = await supabase
          .from('zonas')
          .select('pais, ciudad, area')
          .eq('pais', 'España');
        if (zonasErr) throw zonasErr;

        if (isMounted && zonas) {
          const provinces = Array.from(new Set(zonas.map(z => z.ciudad))).sort();
          const areasMap: AreasMap = {};
          provinces.forEach(p => {
            areasMap[p] = Array.from(new Set(zonas.filter(z => z.ciudad === p).map(z => z.area))).sort();
          });
          setProvincesByCountry({ Spain: provinces });
          setAreasByProvince(areasMap);
        }

        const { data: tipos, error: tiposErr } = await supabase
          .from('tipos')
          .select('nombre, slug');
        if (tiposErr) throw tiposErr;

        if (isMounted && tipos) {
          setTypeOptions(tipos.map(t => ({ value: t.nombre, label: t.nombre })) as OptionType[]);
        }

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
            tipos:tipo_id ( slug ),
            imagenes_propiedad!imagenes_propiedad_propiedad_id_fkey ( url, categoria )
          `);
        if (propsErr) throw propsErr;

        if (isMounted && props) {
          const mapped: Property[] = props.map((p: any) => {
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
    const typeSet = new Set((selectedTypes as OptionType[]).map(t => t.value.toLowerCase()));
    return allProperties
      .filter(p => (selectedProvince ? p.province === selectedProvince : true))
      .filter(p => typeSet.size ? typeSet.has((p.typeSlug ?? p.title).toLowerCase()) : true)
      .filter(p => searchTerm
        ? (p.title + ' ' + (p.area ?? '')).toLowerCase().includes(searchTerm.toLowerCase())
        : true
      );
  }, [allProperties, selectedProvince, selectedTypes, searchTerm]);

  const propertyTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredProperties.length / propertiesPerPage)),
    [filteredProperties.length]
  );

  const paginatedProperties = useMemo(() => {
    const start = (propertyPage - 1) * propertiesPerPage;
    const end = start + propertiesPerPage;
    return filteredProperties.slice(start, end);
  }, [filteredProperties, propertyPage]);

  useEffect(() => { setPropertyPage(1); }, [selectedProvince, selectedTypes, searchTerm]);

  // ---------- ZONAS (paginación independiente) ----------
  const zoneTotalPages = useMemo(() => (!selectedProvince ? 2 : 1), [selectedProvince]);

  const zoneCards = useMemo(() => {
    if (selectedProvince === 'Madrid') return zonesData.Madrid;
    if (selectedProvince === 'Malaga' || selectedProvince === 'Málaga') return zonesData.Malaga;
    return zonePage === 1 ? zonesData.Madrid : zonesData.Malaga;
  }, [selectedProvince, zonePage]);

  useEffect(() => { setZonePage(1); }, [selectedProvince]);

  // ---------- TYPES (paginación INDEPENDIENTE y propia) ----------
  const typeTotalPages = useMemo(() => (!selectedProvince ? 2 : 1), [selectedProvince]);

  const typeCardsForView = useMemo(() => {
    if (selectedProvince === 'Madrid') return typeCardsMadrid;
    if (selectedProvince === 'Malaga' || selectedProvince === 'Málaga') return typeCardsMalaga;
    return typePage === 1 ? typeCardsMadrid : typeCardsMalaga;
  }, [selectedProvince, typePage]);

  useEffect(() => { setTypePage(1); }, [selectedProvince]);

  return {
    // filtros
    selectedProvince, setSelectedProvince,
    selectedTypes, setSelectedTypes,
    searchTerm, setSearchTerm,

    // paginaciones
    zonePage, setZonePage, zoneTotalPages,
    typePage, setTypePage, typeTotalPages,
    propertyPage, setPropertyPage, propertyTotalPages,

    // datos
    propertiesPerPage,
    provincesByCountry,
    areasByProvince,
    typeOptions,
    typeCardsMadrid,
    typeCardsMalaga,
    typeCardsForView,
    zoneCards,

    // derivados
    paginatedProperties,

    // status
    loading, error
  };
};
