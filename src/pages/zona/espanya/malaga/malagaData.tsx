// src/pages/espanya/malaga/malagaData.tsx
import { useEffect, useMemo, useState } from 'react';
import type { MultiValue } from 'react-select';
import { supabase } from '../../../../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

export interface OptionType { value: string; label: string; }
export interface Property {
  id: string; title: string; price: number; image: string;
  bedrooms: number; bathrooms: number; size: number;
  province: string; area?: string; typeSlug?: string;
}
type AreasMap = Record<string, string[]>;

const PROV_MATCH_ES = (p?: string) => p === 'Málaga';
const PROV_MATCH_EN = (p?: string) => p === 'Malaga';

const zonesDataMalaga = [
  { name: 'Centro Histórico', slug: 'centro_historico', image: '/images_espanya/malaga_centro.jpg', link: '/zone/malaga/centro' },
  { name: 'La Malagueta', slug: 'malagueta', image: '/images_espanya/malagueta.jpg', link: '/zone/malaga/malagueta' },
  { name: 'Pedregalejo', slug: 'pedregalejo', image: '/images_espanya/pedregalejo.jpg', link: '/zone/malaga/pedregalejo' },
  { name: 'El Palo', slug: 'elpalo', image: '/images_espanya/el_palo.jpg', link: '/zone/malaga/elpalo' },
];

const typeCardsMalaga = [
  {
    category: 'Residential',
    description: 'Villas, houses, apartments, penthouses. Find your home on the Costa del Sol.',
    types: [
      { name: 'Front Line Beach', slug: 'front_line_beach', image: '/images_type/type_malaga/beach.jpg' },
      { name: 'Front Line Golf', slug: 'front_line_golf', image: '/images_type/type_malaga/golf.jpg' },
      { name: 'Sea View', slug: 'sea_view', image: '/images_type/type_malaga/sea.jpg' },
      { name: 'Villas', slug: 'villas', image: '/images_type/type_malaga/villa_malaga.jpg' },
    ],
  },
  {
    category: 'New Development',
    description: 'Your New Home on the Costa del Sol: Live the Mediterranean Dream',
    types: [
      { name: 'Costa Flats', slug: 'costa_flats', image: '/images_type/type_malaga/flats.jpg' },
      { name: 'Atic/Penthouse', slug: 'attic_penthouse', image: '/images_type/type_malaga/attic_malaga.jpg' },
      { name: 'Apartments', slug: 'apartamento', image: '/images_type/type_malaga/new.jpg' },
    ],
  },
];

export const useMalagaLogic = () => {
  const { i18n } = useTranslation();
  const lang: 'es' | 'en' = i18n.language?.startsWith('es') ? 'es' : 'en';

  // columnas en BD según idioma
  const fPais = `pais_${lang}`;
  const fCiudad = `ciudad_${lang}`;
  const fArea = `area_${lang}`;
  const fTipo = `nombre_${lang}`;
  const fTitulo = `titulo_${lang}`;

  const FORCED_PROVINCE = lang === 'es' ? 'Málaga' : 'Malaga';
  const PROV_MATCH = lang === 'es' ? PROV_MATCH_ES : PROV_MATCH_EN;
  const COUNTRY = lang === 'es' ? 'España' : 'Spain';

  const [selectedProvince, setSelectedProvince] = useState<string>(FORCED_PROVINCE);
  const [selectedTypes, setSelectedTypes] = useState<MultiValue<OptionType>>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [propertyPage, setPropertyPage] = useState<number>(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [typeOptions, setTypeOptions] = useState<OptionType[]>([]);
  const [areasByProvince, setAreasByProvince] = useState<AreasMap>({ [FORCED_PROVINCE]: [] });

  const propertiesPerPage = 3;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Áreas Málaga (por idioma)
        const { data: zonas, error: zonasErr } = await supabase
          .from('zonas')
          .select(`${fPais}, ${fCiudad}, ${fArea}`)
          .eq(fPais, COUNTRY);
        if (zonasErr) throw zonasErr;

        if (isMounted && zonas) {
          const areas = Array.from(
            new Set(
              (zonas as any[])
                .filter(z => PROV_MATCH(String(z?.[fCiudad] ?? '')))
                .map(z => String(z?.[fArea] ?? '').trim())
                .filter(Boolean)
            )
          ).sort();
          setAreasByProvince({ [FORCED_PROVINCE]: areas });
        }

        // Tipos (etiqueta en idioma)
        const { data: tipos, error: tiposErr } = await supabase
          .from('tipos')
          .select(`id, ${fTipo}, nombre_es, nombre_en, nombre, slug`);
        if (tiposErr) throw tiposErr;

        if (isMounted && tipos) {
          const labelOf = (t: any) =>
            String(t?.[fTipo] ?? t?.nombre_es ?? t?.nombre_en ?? t?.nombre ?? '').trim();
          setTypeOptions(
            (tipos as any[]).map(t => ({ value: labelOf(t), label: labelOf(t) })) as OptionType[]
          );
        }

        // Propiedades (filtraremos Málaga por ciudad)
        const { data: props, error: propsErr } = await supabase
          .from('propiedades')
          .select(`
            id,
            ${fTitulo},
            precio,
            dormitorios,
            banos,
            metros_cuadrados,
            imagen_principal,
            zona_id,
            tipo_id,
            zonas:zona_id ( ${fCiudad}, ${fArea} ),
            tipos:tipo_id ( slug ),
            imagenes_propiedad!imagenes_propiedad_propiedad_id_fkey ( url, categoria )
          `);
        if (propsErr) throw propsErr;

        if (isMounted && props) {
          const mapped: Property[] = (props as any[])
            .filter(p => PROV_MATCH(String(p?.zonas?.[fCiudad] ?? '')))
            .map((p: any) => {
              const firstGallery =
                (p.imagenes_propiedad || []).find((im: any) => im.categoria === 'principal') ||
                (p.imagenes_propiedad || [])[0];
              return {
                id: p.id,
                title: p[fTitulo] ?? '',
                price: Number(p.precio),
                image: p.imagen_principal || firstGallery?.url || '',
                bedrooms: p.dormitorios,
                bathrooms: p.banos,
                size: Number(p.metros_cuadrados),
                province: p.zonas?.[fCiudad] ?? '',
                area: p.zonas?.[fArea] ?? '',
                typeSlug: p.tipos?.slug ?? undefined,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, fPais, fCiudad, fArea, fTitulo, fTipo]);

  const filteredProperties = useMemo(() => {
    const typeSet = new Set((selectedTypes as OptionType[]).map(t => t.value.toLowerCase()));
    return allProperties
      .filter(p => typeSet.size ? typeSet.has((p.typeSlug ?? p.title).toLowerCase()) : true)
      .filter(p => searchTerm
        ? (p.title + ' ' + (p.area ?? '')).toLowerCase().includes(searchTerm.toLowerCase())
        : true
      );
  }, [allProperties, selectedTypes, searchTerm]);

  const propertyTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredProperties.length / propertiesPerPage)),
    [filteredProperties.length]
  );

  const paginatedProperties = useMemo(() => {
    const start = (propertyPage - 1) * propertiesPerPage;
    const end = start + propertiesPerPage;
    return filteredProperties.slice(start, end);
  }, [filteredProperties, propertyPage]);

  useEffect(() => { setPropertyPage(1); }, [selectedTypes, searchTerm]);

  return {
    selectedProvince, setSelectedProvince,
    selectedTypes, setSelectedTypes,
    searchTerm, setSearchTerm,

    propertyPage, setPropertyPage, propertyTotalPages,

    propertiesPerPage,
    areasByProvince,
    typeOptions,
    zoneCards: zonesDataMalaga,
    typeCardsForView: typeCardsMalaga,

    paginatedProperties,
    loading, error,
  };
};
