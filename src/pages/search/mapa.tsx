import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvent
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
//import type { LatLngBoundsExpression } from 'leaflet';
import './mapa.css';

// Arregla warning por imágenes de Leaflet en bundlers (Vite + TS)
import 'leaflet/dist/leaflet.css';

// --------- Tipos ----------
export type QkMarker = {
  id: string;
  lat: number;
  lng: number;
  price?: number | null;
  title?: string | null;
  city?: string | null;
  image?: string | null;
};

type Props = {
  markers: QkMarker[];
  /** Centrar el mapa al cargar (si no hay markers) */
  initialCenter?: [number, number];
  initialZoom?: number;
  /** Id activo (hover desde la lista) */
  activeId?: string | null;
  /** Avisar al padre cuando cambian los bounds (para “Radius/Viewport”) */
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
  /** Click en marcador → abrir detalle/lista */
  onMarkerClick?: (id: string) => void;
  /** Hover en marcador para sincronizar con la lista */
  onMarkerHover?: (id: string | null) => void;
  /** Ajustar el mapa automáticamente a todos los markers */
  fitToMarkers?: boolean;
  /** Si se pasa (en km), dibujamos un círculo de radio desde el centro */
  viewportRadiusKm?: number | null;
  /** Mostrar botón de fullscreen */
  showFullscreenButton?: boolean;
};

// --------- Iconos ----------
const defaultIcon = L.icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -32],
  shadowSize: [41, 41],
});

const activeIcon = L.divIcon({
  className: 'qk-active-icon',
  html: '<div class="qk-active-pin"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

// Cluster estilo QualityKeys (burbuja azul con número)
const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<div class="qk-cluster"><span>${count}</span></div>`,
    className: 'qk-cluster-wrap',
    iconSize: L.point(40, 40, true),
  });
};

// --------- Helpers internos ----------
function FitToMarkers({ markers }: { markers: QkMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (!markers.length) return;
    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
    // Evita zoom excesivo si hay un solo punto
    if (markers.length === 1) {
      map.setView(bounds.getCenter(), Math.max(map.getZoom(), 13));
    } else {
      map.fitBounds(bounds.pad(0.2));
    }
  }, [markers, map]);
  return null;
}

function BoundsNotifier({ onChange }: { onChange?: (b: L.LatLngBounds) => void }) {
  const map = useMap();
  const notify = useCallback(() => {
    onChange?.(map.getBounds());
  }, [map, onChange]);

  useMapEvent('moveend', notify);
  useEffect(() => { notify(); }, [notify]);
  return null;
}

export default function Mapa({
  markers,
  initialCenter = [40.4168, -3.7038], // Madrid
  initialZoom = 6,
  activeId,
  onBoundsChange,
  onMarkerClick,
  onMarkerHover,
  fitToMarkers = true,
  viewportRadiusKm = null,
  showFullscreenButton = true,
}: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Centro para el círculo de radio
  const centerForRadius = useMemo<[number, number]>(() => {
    if (markers.length) return [markers[0].lat, markers[0].lng];
    return initialCenter;
  }, [markers, initialCenter]);

  // Forzar invalidation al entrar/salir de fullscreen
  const mapInvalidate = () => {
    const el = containerRef.current?.querySelector('.leaflet-container') as any;
    if (!el) return;
    // @ts-ignore
    const map: L.Map | undefined = el?._leaflet_id ? (el as any)._leaflet_map : undefined;
    // truco: mejor usar una ref del MapContainer, pero así evitamos reestructurar
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      map && map.invalidateSize?.();
    }, 250);
  };

  useEffect(() => {
    if (!isFullscreen) return;
    mapInvalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen]);

  return (
    <div
      ref={containerRef}
      className={`qk-map-wrap ${isFullscreen ? 'qk-map-fullscreen' : ''}`}
    >
      {showFullscreenButton && (
        <button
          type="button"
          className="qk-fullscreen-btn"
          onClick={() => setIsFullscreen(v => !v)}
        >
          {isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}
        </button>
      )}

      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        zoomControl={true}
        className="qk-map"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Notificador de bounds para filtrar por viewport/radio */}
        <BoundsNotifier onChange={onBoundsChange} />

        {/* Encajar al conjunto de markers */}
        {fitToMarkers && markers.length > 0 && <FitToMarkers markers={markers} />}

        {/* Círculo de radio tipo “Radius 20 km” (opcional; el toggle lo gestionas fuera) */}
        {viewportRadiusKm && (
          <Circle
            center={centerForRadius}
            radius={viewportRadiusKm * 1000}
            pathOptions={{ weight: 1 }}
          />
        )}

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterIcon as any}
          spiderfyDistanceMultiplier={1.2}
          showCoverageOnHover={false}
        >
          {markers.map(m => {
            const isActive = activeId === m.id;
            return (
              <Marker
                key={m.id}
                position={[m.lat, m.lng]}
                icon={isActive ? activeIcon : defaultIcon}
                eventHandlers={{
                  click: () => onMarkerClick?.(m.id),
                  mouseover: () => onMarkerHover?.(m.id),
                  mouseout: () => onMarkerHover?.(null),
                }}
              >
                <Popup>
                  <div className="qk-popup">
                    {m.image && <img src={m.image} alt={m.title || 'Property'} />}
                    <div className="qk-popup-info">
                      <div className="qk-popup-price">
                        {m.price != null
                          ? m.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
                          : '—'}
                      </div>
                      <div className="qk-popup-title">{m.title || 'Property'}</div>
                      <div className="qk-popup-city">{m.city || ''}</div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
