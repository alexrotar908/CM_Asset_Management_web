import { useParams } from 'react-router-dom';
import Apartamento from '../pages/tipo/madrid_type/apartamento/apartamento';
import Villa from '../pages/tipo/madrid_type/villa/villa';
import Atico from '../pages/tipo/madrid_type/atico_madrid/atico';
import Loft from '../pages/tipo/madrid_type/loft/loft';
import Commercial from '../pages/tipo/madrid_type/commercial/commercial';
import Office from '../pages/tipo/madrid_type/office/office';
import Building from '../pages/tipo/madrid_type/building/building';
import Warehouse from '../pages/tipo/madrid_type/warehouse/warehouse';
import Land from '../pages/tipo/madrid_type/land/land';
import Apartments from '../pages/tipo/malaga_type/apartamento/apartamento';
import Villas from '../pages/tipo/malaga_type/villas/villas';
import Seaview from '../pages/tipo/malaga_type/seaview/seaview';
import CostaFlats from '../pages/tipo/malaga_type/costa_flats/costa_flats';
import AtticPenthouse from '../pages/tipo/malaga_type/attic_penthouse/attic_penthouse';
import FrontLineBeach from '../pages/tipo/malaga_type/front_line_beach/front_line_beach';
import FrontLineGolf from '../pages/tipo/malaga_type/front_line_golf/front_line_golf';


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
    default:
      return <div style={{ padding: "4rem", textAlign: "center" }}><h2>Tipo de propiedad no encontrado</h2></div>;
  }
}
