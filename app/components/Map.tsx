'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

export interface Store {
  id: string;
  name: string;
  territory: string;
  type: string;
  size: string;
  risk: string;
  churnScore: number;
  lat: number;
  lng: number;
}

const SIMULATED_STORES: Store[] = [
  { id: 's01', name: 'Abarrotes "La Esquina"',    territory: 'Guadalajara', type: 'Tiendita',          size: 'Mini',    risk: 'hi', churnScore: 88, lat: 20.6597, lng: -103.3496 },
  { id: 's02', name: 'Mini Super Lomas',           territory: 'Monterrey',   type: 'Abarrotes y bodegas', size: 'Mediano', risk: 'hi', churnScore: 76, lat: 25.6866, lng: -100.3161 },
  { id: 's03', name: 'Tienda Don Pepe',            territory: 'Saltillo',    type: 'Proximidad',        size: 'Mini',    risk: 'hi', churnScore: 81, lat: 25.4382, lng: -100.9737 },
  { id: 's04', name: 'Licorería El Barril',        territory: 'Laredo',      type: 'Licorería',         size: 'Mini',    risk: 'hi', churnScore: 73, lat: 27.5060, lng: -99.5075 },
  { id: 's05', name: 'Kiosco Reforma',             territory: 'CDMX',        type: 'Kiosco',            size: 'Mini',    risk: 'hi', churnScore: 79, lat: 19.4326, lng: -99.1332 },
  { id: 's06', name: 'Super Mercado Juárez',       territory: 'Chihuahua',   type: 'Abarrotes y bodegas', size: 'Grande', risk: 'md', churnScore: 55, lat: 28.6329, lng: -106.0691 },
  { id: 's07', name: 'Abarrotes Familia',          territory: 'La Paz',      type: 'Tiendita',          size: 'Mini',    risk: 'md', churnScore: 48, lat: 24.1426, lng: -110.3128 },
  { id: 's08', name: 'Tienda La Central',          territory: 'Matamoros',   type: 'Proximidad',        size: 'Mediano', risk: 'md', churnScore: 61, lat: 25.8691, lng: -97.5026 },
  { id: 's09', name: 'Distribuidora del Norte',    territory: 'Reynosa',     type: 'Abarrotes y bodegas', size: 'Grande', risk: 'md', churnScore: 44, lat: 26.0921, lng: -98.2770 },
  { id: 's10', name: 'Mini Super Vallarta',        territory: 'Guadalajara', type: 'Tiendita',          size: 'Mediano', risk: 'md', churnScore: 52, lat: 20.7220, lng: -103.4023 },
  { id: 's11', name: 'Bodega Central Oriente',     territory: 'Puebla',      type: 'Abarrotes y bodegas', size: 'Grande', risk: 'lo', churnScore: 22, lat: 19.0414, lng: -98.2063 },
  { id: 's12', name: 'Abarrotes San Marcos',       territory: 'Querétaro',   type: 'Tiendita',          size: 'Mini',    risk: 'lo', churnScore: 18, lat: 20.5888, lng: -100.3899 },
  { id: 's13', name: 'Super Express León',         territory: 'León',        type: 'Proximidad',        size: 'Mediano', risk: 'lo', churnScore: 31, lat: 21.1221, lng: -101.6824 },
  { id: 's14', name: 'Tienda El Roble',            territory: 'Torreón',     type: 'Tiendita',          size: 'Mini',    risk: 'lo', churnScore: 14, lat: 25.5428, lng: -103.4068 },
  { id: 's15', name: 'Mini Mercado Veracruz',      territory: 'Veracruz',    type: 'Abarrotes y bodegas', size: 'Mediano', risk: 'lo', churnScore: 27, lat: 19.1738, lng: -96.1342 },
];

interface MapProps {
  onStoreSelect?: (store: Store) => void;
}

const RISK_COLOR: Record<string, string> = {
  hi: '#f43f5e',
  md: '#f59e0b',
  lo: '#22c55e',
};

export default function Map({ onStoreSelect }: MapProps) {
  const [stores, setStores] = useState<Store[]>(SIMULATED_STORES);

  useEffect(() => {
    axios
      .get('http://127.0.0.1:8000/api/stores')
      .then(res => { if (res.data?.length) setStores(res.data); })
      .catch(() => {/* keep simulated data */});
  }, []);

  return (
    <MapContainer center={[23.5, -102.0]} zoom={5} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {stores.map(store => (
        <CircleMarker
          key={store.id}
          center={[store.lat, store.lng]}
          radius={9}
          fillColor={RISK_COLOR[store.risk] ?? '#888'}
          color={RISK_COLOR[store.risk] ?? '#888'}
          weight={2}
          opacity={0.9}
          fillOpacity={0.75}
          eventHandlers={{ click: () => onStoreSelect?.(store) }}
        />
      ))}
    </MapContainer>
  );
}