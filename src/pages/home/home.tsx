import './home.css';
import { useState } from 'react';
import Select, { components } from 'react-select';
import type { MultiValue } from 'react-select';

interface OptionType {
  value: string;
  label: string;
}

export default function Home() {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<MultiValue<OptionType>>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const provincesByCountry: Record<string, string[]> = {
    Spain: ['Madrid', 'Málaga'],
    Romania: ['Cluj Napoca', 'Bucharest'],
    Dubai: ['Dubai']
  };

  const areasByProvince: Record<string, string[]> = {
    Madrid: ['Centro', 'Salamanca', 'Chamberí', 'Retiro'],
    Málaga: ['Centro Histórico', 'La Malagueta', 'Pedregalejo', 'El Palo'],
    'Cluj Napoca': ['Centru', 'Grigorescu', 'Manastur', 'Zorilor'],
    Bucharest: ['Old Town', 'Herastrau', 'Dorobanti', 'Pipera'],
    Dubai: ['Downtown Dubai', 'Palm Jumeirah', 'Marina', 'Jumeirah Beach Residence']
  };

  const typeOptions: OptionType[] = [
    { value: 'Apartamento Costa', label: 'Apartamento Costa' },
    { value: 'Ático', label: 'Ático' },
    { value: 'Ático Dúplex', label: 'Ático Dúplex' },
    { value: 'Ático/Penthouse', label: 'Ático/Penthouse' },
    { value: 'Casa', label: 'Casa' }
  ];

  const selectAllTypes = () => setSelectedTypes(typeOptions);
  const clearTypes = () => setSelectedTypes([]);

  const CustomMenuList = (props: any) => {
    const filteredOptions = props.options.filter((option: OptionType) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <components.MenuList {...props}>
        <div className="custom-menu-search">
          <input
            type="text"
            placeholder="Buscar tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="custom-menu-input"
          />
        </div>
        <div className="custom-menu-buttons">
          <button type="button" onClick={selectAllTypes}>Seleccionar todo</button>
          <button type="button" onClick={clearTypes}>Quitar selección</button>
        </div>
        {filteredOptions.map((option: OptionType) => (
          <components.Option
            key={option.value}
            {...props}
            data={option}
            isSelected={selectedTypes.some(t => t.value === option.value)}
          >
            {option.label}
          </components.Option>
        ))}
      </components.MenuList>
    );
  };

  return (
    <div className="home-container">
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to CM Asset Management</h1>
          <p>We have the ability to interpret our clients' needs, ensuring that their operations are always a success.</p>
        </div>
      </section>

      <section className="search-section">
        <form className="search-form">
          <select>
            <option>Buy</option>
            <option>Rent</option>
            <option>Rented</option>
          </select>

          <div style={{ flex: 1 }}>
            <Select
              options={typeOptions}
              isMulti
              placeholder="Tipo"
              value={selectedTypes}
              onChange={setSelectedTypes}
              className="type-select"
              components={{ MenuList: CustomMenuList }}
              isSearchable={false}
              filterOption={null}
            />
          </div>

          <select
            value={selectedCountry}
            onChange={(e) => {
              setSelectedCountry(e.target.value);
              setSelectedProvince('');
            }}
          >
            <option value=''>Select Country</option>
            <option value='Spain'>Spain</option>
            <option value='Romania'>Romania</option>
            <option value='Dubai'>Dubai</option>
          </select>

          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            disabled={!selectedCountry}
          >
            <option value=''>Select Province</option>
            {selectedCountry && provincesByCountry[selectedCountry]?.map((province) => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>

          <select disabled={!selectedProvince}>
            <option value=''>Select Area</option>
            {selectedProvince && areasByProvince[selectedProvince]?.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>

          <select>
            <option>Bedrooms</option>
            <option>1</option>
            <option>2</option>
            <option>3</option>
            <option>4</option>
            <option>5+</option>
          </select>

          <select>
            <option>Max Price</option>
            <option>5.000€</option>
            <option>10.000€</option>
            <option>50.000€</option>
            <option>100.000€</option>
            <option>500.000€</option>
            <option>1.000.000€</option>
          </select>

          <button type="submit">Search</button>
        </form>
      </section>

      <section className="properties-section">
        <h2>Exclusive Properties and Unique Spaces</h2>
        <p>The best properties in Spain, Dubái and Rumanía</p>
        <div className="properties-grid">
          <a href="/espanya" className="property-card">
            <img src="/images_zonas/espanya.png" alt="España" />
            <div className="property-info">
              <h3>Spain</h3>
              <button>View Properties</button>
            </div>
          </a>
          <a href="/dubai" className="property-card">
            <img src="/images_zonas/dubai.png" alt="Dubái" />
            <div className="property-info">
              <h3>Dubái</h3>
              <button>View Properties</button>
            </div>
          </a>
          <a href="/romania" className="property-card">
            <img src="/images_zonas/rumania.png" alt="Rumanía" />
            <div className="property-info">
              <h3>Rumanía</h3>
              <button>View Properties</button>
            </div>
          </a>
        </div>
      </section>

      <section className="welcome-section">
        <h2>Discover Your New Home with CM Asset Management</h2>
        <p>We invite you to explore our website and discover the available properties, as well as our specialized services...</p>
        <img src="/logo.png" alt="Luxury Building" />
      </section>

      <section className="why-choose-us">
        <div className="why-item">
          <h3>01. Best Decision</h3>
          <p>We help you make the best decision...</p>
        </div>
        <div className="why-item">
          <h3>02. Quality Service</h3>
          <p>Quality in service is our fundamental pillar...</p>
        </div>
        <div className="why-item">
          <h3>03. Satisfaction</h3>
          <p>Objective: the satisfaction of our customers...</p>
        </div>
      </section>
    </div>
  );
}
