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

export const useRomaniaLogic = () => {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<MultiValue<OptionType>>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [zonePage, setZonePage] = useState<number>(1);
  const [propertyPage, setPropertyPage] = useState<number>(1);
  const propertiesPerPage = 3;

  const cities = ['Bucharest', 'Cluj Napoca'];

  const typeOptions: OptionType[] = [
    { value: 'Apartamento', label: 'Apartamento' },
    { value: 'Casa', label: 'Casa' },
    { value: 'Penthouse', label: 'Penthouse' },
    { value: 'Ático', label: 'Ático' }
  ];

  const areasByCity: Record<string, string[]> = {
    Bucharest: ['Old Town', 'Dorobanti', 'Pipera', 'Cotroceni'],
    'Cluj Napoca': ['Central', 'Grigorescu', 'Zorilor', 'Manastur'],
  };

  const zonesData: Record<string, { name: string; image: string; link: string }[]> = {
    Bucharest: [
      { name: 'Old Town', image: '/images_romania/old_town.jpg', link: '/zone/bucharest/oldtown' },
      { name: 'Dorobanti', image: '/images_romania/dorobanti.jpg', link: '/zone/bucharest/dorobanti' },
      { name: 'Pipera', image: '/images_romania/pipera.jpg', link: '/zone/bucharest/pipera' },
      { name: 'Cotroceni', image: '/images_romania/cotroceni.jpg', link: '/zone/bucharest/cotroceni' }
    ],
    'Cluj Napoca': [
      { name: 'Central', image: '/images_romania/cluj_central.jpg', link: '/zone/cluj/central' },
      { name: 'Grigorescu', image: '/images_romania/grigorescu.jpg', link: '/zone/cluj/grigorescu' },
      { name: 'Zorilor', image: '/images_romania/zorilor.jpg', link: '/zone/cluj/zorilor' },
      { name: 'Manastur', image: '/images_romania/manastur.jpg', link: '/zone/cluj/manastur' }
    ]
  };

   const typeCardsBucharest = [
  {
    category: "Luxury Living",
    description: "Premium options for upscale living",
    types: [
      { name: "Penthouse", image: "/images_type/type_bucharest/bucharest_penthouse.jpg" },
      { name: "Casa", image: "/images_type/type_bucharest/bucharest_casa.jpg" },
    ]
  },
  {
    category: "Modern Lifestyle",
    description: "Well-situated and stylish",
    types: [
      { name: "Apartamento", image: "/images_type/type_bucharest/bucharest_apartament.jpg" },
      { name: "Ático", image: "/images_type/type_bucharest/bucharest_atico.jpg" },
    ]
  }
];

const typeCardsCluj = [
  {
    category: "Elegant Options",
    description: "Ideal for families and professionals",
    types: [
      { name: "Casa", image: "/images_type/type_cluj/cluj_casa.jpg" },
      { name: "Apartamento", image: "/images_type/type_cluj/cluj_apartament.jpg" }
    ]
  },
  {
    category: "City Style",
    description: "Practical options in top areas",
    types: [
      { name: "Ático", image: "/images_type/type_cluj/cluj_atico.jpg" },
      { name: "Penthouse", image: "/images_type/type_cluj/cluj_penthouse.jpg" }
    ]
  }
];

const typeCardsCombined = typeCardsBucharest.concat(typeCardsCluj);


  const allProperties: Property[] = [
    { id: 1, title: 'Elegant Apartment in Bucharest', price: '150.000€', image: '/images_romania/romania1.jpg', bedrooms: 3, bathrooms: 2, size: 120, city: 'Bucharest' },
    { id: 2, title: 'Historical Villa in Cluj Napoca', price: '350.000€', image: '/images_romania/romania2.jpg', bedrooms: 5, bathrooms: 3, size: 300, city: 'Cluj Napoca' },
    { id: 3, title: 'Modern Flat in Bucharest Center', price: '120.000€', image: '/images_romania/romania3.jpg', bedrooms: 2, bathrooms: 1, size: 90, city: 'Bucharest' },
    { id: 4, title: 'Cozy House in Cluj Napoca Suburbs', price: '200.000€', image: '/images_romania/romania4.jpg', bedrooms: 4, bathrooms: 2, size: 150, city: 'Cluj Napoca' }
  ];

  const filteredProperties = allProperties.filter(p =>
    selectedCity ? p.city === selectedCity : true
  );

  const paginatedProperties = filteredProperties.slice(
    (propertyPage - 1) * propertiesPerPage,
    propertyPage * propertiesPerPage
  );

  const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);

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
    typeCardsCombined,
    typeCardsBucharest,
    typeCardsCluj
  };
};
