'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

interface Store {
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

export default function Map() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  // Obtener datos del backend cuando carga el componente
  useEffect(() => {
    axios
      .get('http://127.0.0.1:8000/api/stores')
      .then(res => {
        setStores(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching stores:', err);
        setLoading(false);
      });
  }, []);

  // Color según riesgo
  const getRiskColor = (risk: string) => {
    return risk === 'hi' ? '#FF0000' : '#FFAA00';  // Rojo = alto riesgo
  };

  if (loading) return <div>Cargando mapa...</div>;

  return (
    <MapContainer center={[25.6866, -100.3161]} zoom={6} style={{ height: "100vh", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {/* Dibujar un círculo para cada store */}
      {stores.map(store => (
        <CircleMarker
          key={store.id}
          center={[store.lat, store.lng]}
          radius={8}
          fillColor={getRiskColor(store.risk)}
          color={getRiskColor(store.risk)}
          weight={2}
          opacity={0.8}
          fillOpacity={0.7}
        >
          {/* Mostrar información al hacer clic */}
          <Popup>
            <div style={{ fontSize: '12px' }}>
              <strong>{store.name}</strong><br/>
              Territorio: {store.territory}<br/>
              Tipo: {store.type}<br/>
              Tamaño: {store.size}<br/>
              Score Churn: {store.churnScore}<br/>
              Riesgo: <span style={{ color: getRiskColor(store.risk) }}>
                {store.risk === 'hi' ? 'ALTO' : 'MEDIO'}
              </span>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}