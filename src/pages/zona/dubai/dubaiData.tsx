// DubaiData.tsx
import { useState } from 'react';
import type { MultiValue } from 'react-select';

export interface OptionType {
  value: string;
  label: string;
}

export interface Property {
  id: number;
  title: string;
  price: string;
  image: string;
  bedrooms: number;
  bathrooms: number;
  size: number;
  city: string;
}

export const useDubaiLogic = () => {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<MultiValue<OptionType>>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [zonePage, setZonePage] = useState<number>(1);
  const [propertyPage, setPropertyPage] = useState<number>(1);
  const propertiesPerPage = 3;

  const cities = ['Dubai City', 'Al Ain'];

  const typeOptions: OptionType[] = [
    { value: 'Apartamento de Lujo', label: 'Apartamento de Lujo' },
    { value: 'Villa', label: 'Villa' },
    { value: 'Ático', label: 'Ático' },
    { value: 'Penthouse', label: 'Penthouse' }
  ];

  const areasByCity: Record<string, string[]> = {
    'Dubai City': ['Downtown Dubai', 'Dubai Marina', 'Palm Jumeirah', 'Business Bay'],
    'Al Ain': ['Central District', 'Al Jimi', 'Al Mutawaa', 'Al Maqam'],
  };

  const zonesData: Record<string, { name: string; image: string; link: string }[]> = {
    Dubai: [
      { name: 'Downtown Dubai', image: '/images_dubai/downtown.jpg', link: '/zone/dubai/downtown' },
      { name: 'Dubai Marina', image: '/images_dubai/marina.jpg', link: '/zone/dubai/marina' },
      { name: 'Palm Jumeirah', image: '/images_dubai/palm.jpg', link: '/zone/dubai/palm' },
      { name: 'Business Bay', image: '/images_dubai/business_bay.jpg', link: '/zone/dubai/businessbay' },
    ],
    'Al Ain': [
      { name: 'Central District', image: '/images_dubai/alain_central.jpg', link: '/zone/alain/central' },
      { name: 'Al Jimi', image: '/images_dubai/aljimi.jpg', link: '/zone/alain/aljimi' },
      { name: 'Al Mutawaa', image: '/images_dubai/mutawaa.jpg', link: '/zone/alain/mutawaa' },
      { name: 'Al Maqam', image: '/images_dubai/maqam.jpg', link: '/zone/alain/maqam' },
    ]
  };

  const typeCardsDubaiCity = [
    {
      category: 'Luxury Residences',
      description: 'Penthouse, apartments, and beachfront views in Dubai.',
      types: [
        { name: 'Penthouse', image: '/images_type/type_dubai/dubai_penthouse.jpg' },
        { name: 'Apartamento de Lujo', image: '/images_type/type_dubai/lux_apartment.jpg' },
        { name: 'Ático', image: '/images_type/type_dubai/dubai_attic.jpg' }
      ]
    },
    {
      category: 'Investment Properties',
      description: 'Great opportunities in top Dubai City areas.',
      types: [
        { name: 'Dubai Marina', image: '/images_type/type_dubai/dubai_marina.jpg' },
        { name: 'Business Bay', image: '/images_type/type_dubai/dubai_business.jpg' }
      ]
    }
  ];

  const typeCardsAlAin = [
    {
      category: 'Family Villas',
      description: 'Spacious villas and houses for families in Al Ain.',
      types: [
        { name: 'Villa', image: '/images_type/type_alain/alain_villa.jpg' },
        { name: 'Family Home', image: '/images_type/type_alain/family.jpg' }
      ]
    },
    {
      category: 'Quiet Zones',
      description: 'Discover peaceful neighborhoods in Al Ain.',
      types: [
        { name: 'Central District', image: '/images_type/type_alain/al_ain_central.jpg' },
        { name: 'Al Jimi', image: '/images_type/type_alain/alain_aljimi.jpg' }
      ]
    }
  ];

  const allProperties: Property[] = [
    { id: 1, title: 'Luxury Penthouse in Dubai City', price: '5M€', image: '/images_dubai/dubai1.jpg', bedrooms: 4, bathrooms: 3, size: 300, city: 'Dubai City' },
    { id: 2, title: 'Exclusive Villa in Al Ain', price: '2.5M€', image: '/images_dubai/dubai2.jpg', bedrooms: 5, bathrooms: 4, size: 450, city: 'Al Ain' },
    { id: 3, title: 'Downtown Apartment', price: '1M€', image: '/images_dubai/dubai3.jpg', bedrooms: 3, bathrooms: 2, size: 150, city: 'Dubai City' },
    { id: 4, title: 'Seaview Apartment', price: '3M€', image: '/images_dubai/dubai4.jpg', bedrooms: 3, bathrooms: 2, size: 200, city: 'Dubai City' }
  ];

  const filteredProperties = allProperties.filter(p =>
    selectedCity ? p.city === selectedCity : true
  );

  const paginatedProperties = filteredProperties.slice(
    (propertyPage - 1) * propertiesPerPage,
    propertyPage * propertiesPerPage
  );

  const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);
  const typeCardsCombined = zonePage === 1 ? typeCardsDubaiCity : typeCardsAlAin;

  return {
    selectedCity, setSelectedCity,
    selectedTypes, setSelectedTypes,
    searchTerm, setSearchTerm,
    zonePage, setZonePage,
    propertyPage, setPropertyPage,
    cities,
    typeOptions,
    areasByCity,
    zonesData,
    allProperties,
    paginatedProperties,
    totalPages,
    typeCardsDubaiCity,
    typeCardsAlAin,
    typeCardsCombined
  };
};
