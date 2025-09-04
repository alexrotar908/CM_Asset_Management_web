import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from '../components/navbar/navbar';
import Home from '../pages/home/home';
import Agencia from '../pages/agencia/agencia';
import Servicios from '../pages/servicios/servicios';
import Contacto from '../pages/contacto/contacto';

// Importa cada zona
import Dubai from '../pages/zona/dubai/dubai';
import DubaiCity from '../pages/zona/dubai/dubaiCity/dubaiCity';
import Romania from '../pages/zona/romania/romania';
import Bucharest from '../pages/zona/romania/bucharest/bucharest';
import ClujNapoca from '../pages/zona/romania/clujNapoca/clujNapoca';
import Espanya from '../pages/zona/espanya/espanya';
import Profile from '../pages/login/profile';
import Dashboard from '../pages/login/dashboard';
import ResetPassword from '../auth/resetPassword';
import TipoRouter from './TipoRouter';
import ZonaRouter from './ZonaRoutes';
import PropertyDataDetails from '../pages/properties/propertyDetail/propertyDataDetail';
import Madrid from '../pages/zona/espanya/madrid/madrid';
import Malaga from '../pages/zona/espanya/malaga/malaga';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agencia" element={<Agencia />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/contacto" element={<Contacto />} />

        {/* Rutas de zonas */}
        <Route path="/espanya" element={<Espanya />} />
        <Route path="/espanya/madrid" element={<Madrid />} />
        <Route path="/espanya/malaga" element={<Malaga />} />
        <Route path="/dubai" element={<Dubai />} />
        <Route path="/dubaiCity" element={<DubaiCity />} />
        <Route path="/romania" element={<Romania />} />
        <Route path="/clujNapoca" element={<ClujNapoca />} />
        <Route path="/bucharest" element={<Bucharest />} />

        {/*Rutas login */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
         <Route path="/reset-password" element={<ResetPassword />} />

         {/*Rutas propiedades */}
          <Route path="/tipos/:zona/:tipo" element={<TipoRouter />} />
          <Route path="/zone/:province/:slug" element={<ZonaRouter />} />
          <Route path="/propiedad/:id" element={<PropertyDataDetails />} />
       
          

      </Routes>
    </BrowserRouter>
  );
}
