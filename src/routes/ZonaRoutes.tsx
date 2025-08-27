import { useParams } from 'react-router-dom';

// Importa componentes por zona y ubicación real
import Centro from '../pages/ciudad/madrid_provincia/centro/centro';
import Salamanca from '../pages/ciudad/madrid_provincia/salamanca/salamanca';
import Chamberi from '../pages/ciudad/madrid_provincia/chamberi/chamberi';
import Periferia from '../pages/ciudad/madrid_provincia/periferia/periferia';
import CentroHistorico from '../pages/ciudad/malaga_provincia/centro_hitorico/centro_historico';
import Malagueta from '../pages/ciudad/malaga_provincia/malagueta/malagueta';
import ElPalo from '../pages/ciudad/malaga_provincia/elpalo/elpalo';
import Pedregalejo from '../pages/ciudad/malaga_provincia/pedregalejo/pedregalejo';
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

  return <div>Zona no encontrada</div>;
 }

