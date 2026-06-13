import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import '../../lib/leaflet-setup';

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return position === null ? null : (
    <Marker position={[position.lat, position.lng]}></Marker>
  );
}

export default function MapPicker({ initialPosition, onPositionChange }) {
  const [position, setPosition] = useState(initialPosition || null);
  const mapRef = useRef(null);

  // Default to New Delhi if no initial position and geolocation fails
  const defaultCenter = [28.6139, 77.2090]; 

  useEffect(() => {
    if (position && onPositionChange) {
      onPositionChange(position);
    }
  }, [position, onPositionChange]);

  useEffect(() => {
    // Attempt to get user location if no initial position
    if (!initialPosition && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(newPos);
          if (mapRef.current) {
            mapRef.current.flyTo([newPos.lat, newPos.lng], 15);
          }
        },
        (err) => {
          console.warn('Geolocation failed or denied:', err);
        }
      );
    }
  }, [initialPosition]);

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-slate-200 z-0 relative">
      <MapContainer 
        center={position ? [position.lat, position.lng] : defaultCenter} 
        zoom={position ? 15 : 11} 
        scrollWheelZoom={true} 
        className="w-full h-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
      <div className="absolute top-2 right-2 z-[400] bg-white text-xs px-2 py-1 rounded shadow text-slate-500 pointer-events-none">
        Click to place marker
      </div>
    </div>
  );
}
