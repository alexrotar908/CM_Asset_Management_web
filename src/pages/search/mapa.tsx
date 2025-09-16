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
import './mapa.css';
import 'leaflet/dist/leaflet.css';

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
  initialCenter?: [number, number];
  initialZoom?: number;
  activeId?: string | null;
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
  onMarkerClick?: (id: string) => void;
  onMarkerHover?: (id: string | null) => void;
  fitToMarkers?: boolean;
  viewportRadiusKm?: number | null;
  showFullscreenButton?: boolean;
};

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
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

const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<div class="qk-cluster"><span>${count}</span></div>`,
    className: 'qk-cluster-wrap',
    iconSize: L.point(40, 40, true),
  });
};

/** Notificador de bounds (si el padre lo usa) */
function BoundsNotifier({ onChange }: { onChange?: (b: L.LatLngBounds) => void }) {
  const map = useMap();
  const notify = useCallback(() => onChange?.(map.getBounds()), [map, onChange]);
  useMapEvent('moveend', notify);
  useEffect(() => { notify(); }, [notify]);
  return null;
}

/** Evita re-centrar una vez que el usuario ha movido/zoomeado */
function UseUserMove({ onUserMove }: { onUserMove: () => void }) {
  useMapEvent('movestart', onUserMove);
  useMapEvent('zoomstart', onUserMove);
  return null;
}

/** Fit automático solo cuando cambia realmente el set de marcadores y el usuario aún no ha interactuado */
function FitToMarkers({
  markers,
  userMoved,
}: {
  markers: QkMarker[];
  userMoved: boolean;
}) {
  const map = useMap();
  const fittedKeyRef = useRef<string>('');

  useEffect(() => {
    if (!markers.length || userMoved) return;

    const key = markers.map(m => m.id).sort().join(',');
    if (key === fittedKeyRef.current) return;

    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
    if (markers.length === 1) {
      map.setView(bounds.getCenter(), Math.max(map.getZoom(), 13));
    } else {
      map.fitBounds(bounds.pad(0.2));
    }
    fittedKeyRef.current = key;
  }, [markers, userMoved, map]);

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

  // Flag que desactiva auto-fit cuando el usuario interactúa
  const [userMoved, setUserMoved] = useState(false);

  const centerForRadius = useMemo<[number, number]>(() => {
    if (markers.length) return [markers[0].lat, markers[0].lng];
    return initialCenter;
  }, [markers, initialCenter]);

  const mapInvalidate = () => {
    const el = containerRef.current?.querySelector('.leaflet-container') as any;
    if (!el) return;
    // @ts-ignore
    const map: L.Map | undefined = el?._leaflet_id ? (el as any)._leaflet_map : undefined;
    setTimeout(() => { map && (map as any).invalidateSize?.(); }, 250);
  };

  useEffect(() => { if (isFullscreen) mapInvalidate(); }, [isFullscreen]);

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
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <BoundsNotifier onChange={onBoundsChange} />
        <UseUserMove onUserMove={() => setUserMoved(true)} />

        {fitToMarkers && markers.length > 0 && (
          <FitToMarkers markers={markers} userMoved={userMoved} />
        )}

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
