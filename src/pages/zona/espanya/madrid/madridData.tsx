// src/pages/espanya/madrid/madridData.tsx
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

const FORCED_PROVINCE_ES = 'Madrid';
const FORCED_PROVINCE_EN = 'Madrid'; // igual visualmente
const PROV_MATCH = (p?: string) => (p === 'Madrid');

const zonesDataMadrid = [
  { name: 'Centro', slug: 'centro', image: '/images_espanya/centro_madrid.jpg', link: '/zone/madrid/centro' },
  { name: 'Salamanca', slug: 'salamanca', image: '/images_espanya/salamanca.jpg', link: '/zone/madrid/salamanca' },
  { name: 'Chamberí', slug: 'chamberi', image: '/images_espanya/chamberi.jpg', link: '/zone/madrid/chamberi' },
  { name: 'Periferia', slug: 'periferia', image: '/images_espanya/periferia.jpg', link: '/zone/madrid/periferia' },
];

const typeCardsMadrid = [
  {
    category: 'Residential',
    description: 'Buy a villa, flat, penthouse, flat. Find your home among our properties.',
    types: [
      { name: 'Apartamento', slug: 'apartamento', image: '/images_type/type_madrid/apartamento.jpg' },
      { name: 'Villa', slug: 'villa', image: '/images_type/type_madrid/villa.jpg' },
      { name: 'Atico', slug: 'atico', image: '/images_type/type_madrid/attic.jpg' },
      { name: 'Loft', slug: 'loft', image: '/images_type/type_madrid/loft.jpg' },
    ],
  },
  {
    category: 'Commercial',
    description: 'We have the right premises, office, warehouse, hotel or land for your business.',
    types: [
      { name: 'Commercial', slug: 'commercial', image: '/images_type/type_madrid/commercial.jpg' },
      { name: 'Office', slug: 'office', image: '/images_type/type_madrid/office.jpg' },
      { name: 'Building', slug: 'building', image: '/images_type/type_madrid/building.jpg' },
      { name: 'Warehouse', slug: 'warehouse', image: '/images_type/type_madrid/warehouse.jpg' },
      { name: 'Land', slug: 'land', image: '/images_type/type_madrid/land.jpg' },
    ],
  },
];

export const useMadridLogic = () => {
  const { i18n } = useTranslation();
  const lang: 'es' | 'en' = i18n.language?.startsWith('es') ? 'es' : 'en';

  // columnas por idioma en BD
  const fPais = `pais_${lang}`;
  const fCiudad = `ciudad_${lang}`;
  const fArea = `area_${lang}`;
  const fTipo = `nombre_${lang}`;
  const fTitulo = `titulo_${lang}`;

  const FORCED_PROVINCE = lang === 'es' ? FORCED_PROVINCE_ES : FORCED_PROVINCE_EN;

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

        // Áreas de Madrid (por idioma)
        const { data: zonas, error: zonasErr } = await supabase
          .from('zonas')
          .select(`${fPais}, ${fCiudad}, ${fArea}`)
          .eq(fPais, lang === 'es' ? 'España' : 'Spain');
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

        // Tipos (etiqueta en idioma actual)
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

        // Propiedades (de cualquier zona, filtraremos Madrid después)
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
    zoneCards: zonesDataMadrid,
    typeCardsForView: typeCardsMadrid,

    paginatedProperties,
    loading, error,
  };
};
