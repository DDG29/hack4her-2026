'use client';
import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type Status = 'done' | 'active' | 'pending';

interface Stop {
  id: string;
  name: string;
  territory: string;
  type: string;
  churnScore: number;
  lat: number;
  lng: number;
  eta: string;
  durationMin: number;
  distPrev: string | null;
  timePrev: string | null;
  status: Status;
}

const INITIAL_STOPS: Stop[] = [
  { id: 's05', name: 'Kiosco Reforma',          territory: 'CDMX',        type: 'Kiosco',     churnScore: 79, lat: 19.4326, lng: -99.1332,  eta: '08:00', durationMin: 45, distPrev: null,     timePrev: null,        status: 'done'    },
  { id: 's01', name: 'Abarrotes "La Esquina"',  territory: 'Guadalajara', type: 'Tiendita',   churnScore: 88, lat: 20.6597, lng: -103.3496, eta: '10:30', durationMin: 45, distPrev: '487 km', timePrev: '2h 30min',  status: 'active'  },
  { id: 's03', name: 'Tienda Don Pepe',          territory: 'Saltillo',    type: 'Proximidad', churnScore: 81, lat: 25.4382, lng: -100.9737, eta: '13:00', durationMin: 45, distPrev: '712 km', timePrev: '2h 30min',  status: 'pending' },
  { id: 's02', name: 'Mini Super Lomas',         territory: 'Monterrey',   type: 'Abarrotes',  churnScore: 76, lat: 25.6866, lng: -100.3161, eta: '15:00', durationMin: 45, distPrev: '67 km',  timePrev: '45 min',    status: 'pending' },
  { id: 's04', name: 'Licorería El Barril',      territory: 'Laredo',      type: 'Licorería',  churnScore: 73, lat: 27.5060, lng: -99.5075,  eta: '17:00', durationMin: 30, distPrev: '241 km', timePrev: '1h 30min',  status: 'pending' },
];

const STATUS_COLOR: Record<Status, string> = {
  done:    '#22c55e',
  active:  '#34d399',
  pending: '#f43f5e',
};

const STATUS_LABEL: Record<Status, string> = {
  done:    'Completada',
  active:  'En camino',
  pending: 'Pendiente',
};

export default function RutasDeVisita() {
  const [stops, setStops] = useState<Stop[]>(INITIAL_STOPS);
  const [selectedId, setSelectedId] = useState<string | null>('s01');

  function toggleDone(id: string) {
    setStops(prev => prev.map(s =>
      s.id === id ? { ...s, status: s.status === 'done' ? 'pending' : 'done' } : s
    ));
  }

  const done    = stops.filter(s => s.status === 'done').length;
  const total   = stops.length;
  const allCoords = stops.map(s => [s.lat, s.lng] as [number, number]);

  const doneIdx = stops.findIndex(s => s.status !== 'done');
  const doneCoords    = doneIdx > 0 ? allCoords.slice(0, doneIdx + 1) : doneIdx === -1 ? allCoords : [];
  const pendingCoords = doneIdx >= 0 ? allCoords.slice(doneIdx) : [];

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Left panel ── */}
      <div style={{ width: 380, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface)' }}>

        {/* Header */}
        <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                Ruta Prioritaria · Hoy
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                {total} visitas · ~9h · 1,507 km · IA ordenada por churn
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progreso</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399', fontFamily: 'monospace', lineHeight: 1.2 }}>
                {done}<span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>/{total}</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: 'var(--surface-3)', overflow: 'hidden' }}>
            <div style={{ width: `${(done / total) * 100}%`, height: '100%', background: '#34d399', borderRadius: 2, transition: 'width 0.4s' }} />
          </div>
        </div>

        {/* Rep card */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--brand)', color: '#0a0f15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
            AV
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Alan Vega</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rep. Zona Bajío · Sedán · Salida 08:00</div>
          </div>
          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: 'var(--r-sm)', background: 'rgba(52,211,153,.12)', color: '#34d399', fontWeight: 700, letterSpacing: '0.04em' }}>
            EN RUTA
          </span>
        </div>

        {/* Stop list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {stops.map((stop, i) => {
            const isSelected = selectedId === stop.id;
            const color = STATUS_COLOR[stop.status];

            return (
              <div key={stop.id}>
                {/* Travel info between stops */}
                {stop.distPrev && (
                  <div style={{ padding: '5px 20px 5px 58px', fontSize: '10.5px', color: 'var(--text-dim)', display: 'flex', gap: 14 }}>
                    <span>⇅ {stop.distPrev}</span>
                    <span>⏱ {stop.timePrev}</span>
                  </div>
                )}

                {/* Stop row */}
                <div
                  onClick={() => setSelectedId(stop.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '10px 20px', cursor: 'pointer',
                    background: isSelected ? 'var(--hover)' : 'transparent',
                    transition: 'background 0.12s',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {/* Number badge */}
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0, marginTop: 3,
                    background: color + '22',
                    border: `2px solid ${color}`,
                    color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, fontFamily: 'monospace',
                  }}>
                    {stop.status === 'done' ? '✓' : i + 1}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 190 }}>
                        {stop.name}
                      </div>
                      <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>
                        {stop.eta}
                      </div>
                    </div>
                    <div style={{ marginTop: 2, fontSize: '11px', color: 'var(--text-muted)' }}>
                      {stop.territory} · {stop.type} · {stop.durationMin} min
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: 'var(--r-sm)', background: '#f43f5e22', color: '#f43f5e', fontWeight: 700 }}>
                        {stop.churnScore}% churn
                      </span>
                      <span style={{ fontSize: '10px', color, fontWeight: 600 }}>
                        {STATUS_LABEL[stop.status]}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); toggleDone(stop.id); }}
                        style={{
                          marginLeft: 'auto', fontSize: '10px', padding: '2px 8px',
                          borderRadius: 'var(--r-sm)', border: '1px solid var(--border-2)',
                          background: stop.status === 'done' ? 'var(--surface-3)' : 'transparent',
                          color: stop.status === 'done' ? 'var(--text-dim)' : '#34d399',
                          cursor: 'pointer',
                        }}
                      >
                        {stop.status === 'done' ? 'Deshacer' : 'Marcar ✓'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <button style={{ flex: 1, padding: '9px 0', borderRadius: 'var(--r-md)', border: '1px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Exportar PDF
          </button>
          <button style={{ flex: 1, padding: '9px 0', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--brand)', color: '#0a0f15', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            Iniciar navegación →
          </button>
        </div>
      </div>

      {/* ── Map panel ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <MapContainer center={[22.5, -101.5]} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* Completed legs — dashed gray */}
          {doneCoords.length > 1 && (
            <Polyline positions={doneCoords} color="#3a4760" weight={3} dashArray="6 5" opacity={0.75} />
          )}

          {/* Pending legs — solid green */}
          {pendingCoords.length > 1 && (
            <Polyline positions={pendingCoords} color="#34d399" weight={3} opacity={0.85} />
          )}

          {/* Markers */}
          {stops.map((stop, i) => {
            const isSelected = selectedId === stop.id;
            const color = STATUS_COLOR[stop.status];
            return (
              <CircleMarker
                key={stop.id}
                center={[stop.lat, stop.lng]}
                radius={isSelected ? 14 : 10}
                fillColor={color}
                color={isSelected ? '#ffffff' : '#0a0f15'}
                weight={isSelected ? 2.5 : 2}
                opacity={1}
                fillOpacity={0.88}
                eventHandlers={{ click: () => setSelectedId(stop.id) }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  <span style={{ fontWeight: 700 }}>
                    {i + 1}. {stop.name} — {stop.churnScore}% churn · {stop.eta}
                  </span>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Summary overlay */}
        <div style={{
          position: 'absolute', top: 16, right: 16, zIndex: 1000,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)', padding: '12px 16px',
          boxShadow: '0 4px 20px rgba(0,0,0,.4)',
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Resumen de ruta
          </div>
          <div style={{ display: 'flex', gap: 18 }}>
            {[
              { val: '1,507', lbl: 'km totales' },
              { val: '~9h',   lbl: 'duración est.' },
              { val: '5',     lbl: 'riesgo alto', color: '#f43f5e' },
            ].map(({ val, lbl, color }) => (
              <div key={lbl}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: color ?? 'var(--text)', fontFamily: 'monospace', lineHeight: 1.2 }}>{val}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 16, right: 16, zIndex: 1000,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)', padding: '10px 14px',
          boxShadow: '0 4px 20px rgba(0,0,0,.4)',
          pointerEvents: 'none',
        }}>
          {[
            { color: '#22c55e', label: 'Completada', dashed: false },
            { color: '#34d399', label: 'En camino',  dashed: false },
            { color: '#f43f5e', label: 'Pendiente',  dashed: false },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
