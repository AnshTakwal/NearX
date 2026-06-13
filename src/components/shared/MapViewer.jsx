import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from '../../lib/leaflet-setup';

function MapBounds({ markers }) {
  const map = useMap();

  useEffect(() => {
    if (!markers || markers.length === 0) return;
    
    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, markers]);

  return null;
}

/**
 * A read-only map that displays one or multiple markers and auto-fits bounds.
 * @param {Array} markers - Array of objects: { lat, lng, popupText }
 */
export default function MapViewer({ markers = [], className = "w-full h-64" }) {
  const defaultCenter = [28.6139, 77.2090];
  const center = markers.length > 0 ? [markers[0].lat, markers[0].lng] : defaultCenter;

  return (
    <div className={`${className} rounded-xl overflow-hidden border border-slate-200 z-0 relative`}>
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {markers.map((marker, index) => (
          <Marker key={index} position={[marker.lat, marker.lng]}>
            {marker.popupText && (
              <Popup>
                {marker.popupText}
              </Popup>
            )}
          </Marker>
        ))}
        
        <MapBounds markers={markers} />
      </MapContainer>
    </div>
  );
}
