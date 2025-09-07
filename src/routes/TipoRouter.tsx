import { useParams } from 'react-router-dom';

// ====== España (Madrid) ======
import Apartamento from '../pages/tipo/madrid_type/apartamento/apartamento';
import Villa from '../pages/tipo/madrid_type/villa/villa';
import Atico from '../pages/tipo/madrid_type/atico_madrid/atico';
import Loft from '../pages/tipo/madrid_type/loft/loft';
import Commercial from '../pages/tipo/madrid_type/commercial/commercial';
import Office from '../pages/tipo/madrid_type/office/office';
import Building from '../pages/tipo/madrid_type/building/building';
import Warehouse from '../pages/tipo/madrid_type/warehouse/warehouse';
import Land from '../pages/tipo/madrid_type/land/land';

// ====== España (Málaga) ======
import Apartments from '../pages/tipo/malaga_type/apartamento/apartamento';
import Villas from '../pages/tipo/malaga_type/villas/villas';
import Seaview from '../pages/tipo/malaga_type/seaview/seaview';
import CostaFlats from '../pages/tipo/malaga_type/costa_flats/costa_flats';
import AtticPenthouse from '../pages/tipo/malaga_type/attic_penthouse/attic_penthouse';
import FrontLineBeach from '../pages/tipo/malaga_type/front_line_beach/front_line_beach';
import FrontLineGolf from '../pages/tipo/malaga_type/front_line_golf/front_line_golf';

// ====== Dubái ======
import ApartamentoLujoDubai from '../pages/tipo/dubai_type/apartamento_lujo/apartamento_lujo';
import VillaDubai from '../pages/tipo/dubai_type/villa_dubai/villa_dubai';
import AticoDubai from '../pages/tipo/dubai_type/atico_dubai/atico_dubai';
import PenthouseDubai from '../pages/tipo/dubai_type/penthouse_dubai/penthouse_dubai';
import TownhouseDubai from '../pages/tipo/dubai_type/townhouse/townhouse';
import HotelApartmentDubai from '../pages/tipo/dubai_type/hotel_dubai/hotel_dubai';

// ====== Rumanía (Bucarest) ======
import ApartamentoBucharest from '../pages/tipo/bucharest_type/apartamento_bucharest/apartamento_bucharest';
import CasaBucharest from '../pages/tipo/bucharest_type/casa_bucharest/casa_bucharest';
import AticoBucharest from '../pages/tipo/bucharest_type/atico_bucharest/atico_bucharest';
import PenthouseBucharest from '../pages/tipo/bucharest_type/penthouse_bucharest/penthouse_bucharest';

// ====== Rumanía (Cluj) ======
import ApartamentoCluj from '../pages/tipo/cluj_type/apartamento_cluj/apartamento_cluj';
import CasaCluj from '../pages/tipo/cluj_type/casa_cluj/casa_cluj';
import AticoCluj from '../pages/tipo/cluj_type/atico_cluj/atico_cluj';
import PenthouseCluj from '../pages/tipo/cluj_type/penthouse_cluj/penthouse_cluj';


export default function TipoRouter() {
  const { zona, tipo } = useParams();

  
  const key = `${zona?.toLowerCase()}/${tipo?.toLowerCase()}`;

  switch (key) {

    /*Residential Madrid*/ 
    case 'madrid_type/apartamento':
      return <Apartamento />;
    case 'madrid_type/villa':
      return <Villa />;
    case 'madrid_type/atico':
      return <Atico />;
    case 'madrid_type/loft':
      return <Loft />;

    /*Comercial Madrid*/ 
    case 'madrid_type/commercial':
      return <Commercial />;
    case 'madrid_type/office':
      return <Office />;
    case 'madrid_type/building':
      return <Building />;
    case 'madrid_type/warehouse':
      return <Warehouse />;
    case 'madrid_type/land':
      return <Land />;
    
    /* Residential Málaga */
    case 'malaga_type/apartamento':
      return <Apartments />;
    case 'malaga_type/villas':
      return <Villas />;
    case 'malaga_type/seaview':
      return <Seaview />;
    case 'malaga_type/costa_flats':
      return <CostaFlats />;
    case 'malaga_type/attic_penthouse':
      return <AtticPenthouse />;
    case 'malaga_type/front_line_beach':
      return <FrontLineBeach />;
    case 'malaga_type/front_line_golf':
      return <FrontLineGolf />;

      /* Dubái */
    case 'dubai_type/apartamento-de-lujo':
      return <ApartamentoLujoDubai />;
    case 'dubai_type/villa':
      return <VillaDubai />;
    case 'dubai_type/atico':
      return <AticoDubai />;
    case 'dubai_type/penthouse':
     return <PenthouseDubai />;
    case 'dubai_type/townhouse':
     return <TownhouseDubai />;
    case 'dubai_type/hotel-apartment':
     return <HotelApartmentDubai />;

     /* Bucarest */
    case 'bucharest_type/apartamento':
      return <ApartamentoBucharest />;
    case 'bucharest_type/casa':
      return <CasaBucharest />;
    case 'bucharest_type/atico':
      return <AticoBucharest />;
    case 'bucharest_type/penthouse':
      return <PenthouseBucharest />;

    /* Cluj */
    case 'cluj_type/apartamento':
      return <ApartamentoCluj />;
    case 'cluj_type/casa':
      return <CasaCluj />;
    case 'cluj_type/atico':
      return <AticoCluj />;
    case 'cluj_type/penthouse':
      return <PenthouseCluj />;

    default:
      return <div style={{ padding: "4rem", textAlign: "center" }}><h2>Tipo de propiedad no encontrado</h2></div>;
  }
}
