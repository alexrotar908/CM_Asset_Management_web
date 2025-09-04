import { useParams } from 'react-router-dom';

// Importa componentes por zona y ubicación real

// ====== España (Madrid) ======
import Centro from '../pages/ciudad/madrid_provincia/centro/centro';
import Salamanca from '../pages/ciudad/madrid_provincia/salamanca/salamanca';
import Chamberi from '../pages/ciudad/madrid_provincia/chamberi/chamberi';
import Periferia from '../pages/ciudad/madrid_provincia/periferia/periferia';

// ====== España (Málaga) ======
import CentroHistorico from '../pages/ciudad/malaga_provincia/centro_hitorico/centro_historico';
import Malagueta from '../pages/ciudad/malaga_provincia/malagueta/malagueta';
import ElPalo from '../pages/ciudad/malaga_provincia/elpalo/elpalo';
import Pedregalejo from '../pages/ciudad/malaga_provincia/pedregalejo/pedregalejo';

// ====== Dubái ======
import DowntownDubai from '../pages/zona/dubai/areas/downtown/downtown';
import BusinessBay from '../pages/zona/dubai/areas/business_bay/businessbay';
import DubaiMarina from '../pages/zona/dubai/areas/marina/marina';
import PalmJumeirah from '../pages/zona/dubai/areas/palm_jumeirah/palm_jumeirah';

// ====== Rumanía (Bucarest) ======
import Oldtown from '../pages/zona/romania/bucharest/areas/oldtown/oldtown';
import Pipera from '../pages/zona/romania/bucharest/areas/pipera/pipera';
import Dorobanti from '../pages/zona/romania/bucharest/areas/dorobanti/dorobanti';
import Cotroceni from '../pages/zona/romania/bucharest/areas/cotroceni/cotroceni';

// ====== Rumanía (Cluj) ======
import ClujCentral from '../pages/zona/romania/clujNapoca/areas/clujcentral/clujcentral';
import Grigorescu from '../pages/zona/romania/clujNapoca/areas/grigorescu/grigorescu';
import Zorilor from '../pages/zona/romania/clujNapoca/areas/zorilor/zorilor';
import Manastur from '../pages/zona/romania/clujNapoca/areas/manastur/manastur';
// Agrega más zonas aquí

export default function ZonaRouter() {
  const { province, slug } = useParams();

  if (province === 'madrid') {
    switch (slug) {
      case 'centro':
        return <Centro />;
      case 'salamanca':
        return <Salamanca />;
      case 'chamberi':
        return <Chamberi />;
      case 'periferia':
        return <Periferia />;
      default:
        return <div>Zona de Madrid no encontrada</div>;
    }
  }

  if (province === 'malaga') {
    switch (slug) {
      case 'centro_historico':
        return <CentroHistorico />;
      case 'malagueta':
        return <Malagueta />;
      case 'elpalo':
        return <ElPalo />;
      case 'pedregalejo':
        return <Pedregalejo />;
      default:
        return <div>Zona de Málaga no encontrada</div>;
    }
  }

  // ====== Dubái ======
  if (province === 'dubai') {
    switch (slug) {
      case 'downtown-dubai':
        return <DowntownDubai />;
      case 'dubai-marina':
        return <DubaiMarina />;
      case 'palm-jumeirah':
        return <PalmJumeirah />;
      case 'business-bay':
        return <BusinessBay />;
      default:
        return <div>Zona de Dubái no encontrada</div>;
    }
  }

   // ====== Rumanía: Bucarest ======
  if (province === 'bucharest') {
    switch (slug) {
      case 'old-town':
        return <Oldtown />;
      case 'dorobanti':
        return <Dorobanti />;
      case 'pipera':
        return <Pipera />;
      case 'cotroceni':
        return <Cotroceni />;
      default:
        return <div>Zona de Bucarest no encontrada</div>;
    }
  }

  // ====== Rumanía: Cluj ======
  if (province === 'cluj') {
    switch (slug) {
      case 'central':
        return <ClujCentral />;
      case 'grigorescu':
        return <Grigorescu />;
      case 'zorilor':
        return <Zorilor />;
      case 'manastur':
        return <Manastur />;
      default:
        return <div>Zona de Cluj no encontrada</div>;
    }
  }


  return <div>Zona no encontrada</div>;
 }

