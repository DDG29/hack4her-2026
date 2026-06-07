'use client';
import { useState } from 'react';

type Status = 'active' | 'on_route' | 'offline';

interface AssignedStore {
  name: string;
  territory: string;
  risk: 'hi' | 'md' | 'lo';
  churnScore: number;
}

interface Activity {
  date: string;
  action: string;
  store: string;
  type: 'visit' | 'alert' | 'call' | 'retention';
}

interface Supervisor {
  id: string;
  name: string;
  initials: string;
  state: string;
  zone: string;
  status: Status;
  accounts: number;
  atRisk: number;
  visitsMonth: number;
  retentionRate: number;
  phone: string;
  since: number;
  coverageKm: number;
  color: string;
  weeklyVisits: [number, number, number, number];
  stores: AssignedStore[];
  activity: Activity[];
}

const SUPERVISORS: Supervisor[] = [
  {
    id: 'sup01', name: 'Marco García', initials: 'MG',
    state: 'Nuevo León', zone: 'Zona Regia',
    status: 'active', accounts: 42, atRisk: 8, visitsMonth: 31, retentionRate: 87,
    phone: '+52 81 3456-7890', since: 2019, coverageKm: 340, color: '#6366f1',
    weeklyVisits: [7, 9, 8, 7],
    stores: [
      { name: 'Mini Super Lomas',      territory: 'Monterrey', risk: 'hi', churnScore: 76 },
      { name: 'Distribuidora del Norte', territory: 'Reynosa', risk: 'md', churnScore: 44 },
      { name: 'Tienda La Central',     territory: 'Matamoros', risk: 'md', churnScore: 61 },
    ],
    activity: [
      { date: 'Hoy 14:22',   action: 'Visita completada',   store: 'Mini Super Lomas',      type: 'visit' },
      { date: 'Ayer 11:05',  action: 'Alerta atendida',     store: 'Distribuidora del Norte', type: 'alert' },
      { date: 'Lun 09:30',   action: 'Llamada de retención', store: 'Tienda La Central',      type: 'call' },
      { date: 'Vie 16:00',   action: 'Visita completada',   store: 'Mini Super Lomas',      type: 'visit' },
    ],
  },
  {
    id: 'sup02', name: 'Ana Reyes', initials: 'AR',
    state: 'Jalisco', zone: 'Zona Bajío Oeste',
    status: 'on_route', accounts: 38, atRisk: 5, visitsMonth: 32, retentionRate: 92,
    phone: '+52 33 2345-6789', since: 2021, coverageKm: 280, color: '#ec4899',
    weeklyVisits: [8, 7, 9, 8],
    stores: [
      { name: 'Abarrotes "La Esquina"', territory: 'Guadalajara', risk: 'hi', churnScore: 88 },
      { name: 'Mini Super Vallarta',    territory: 'Guadalajara', risk: 'md', churnScore: 52 },
      { name: 'Super Express León',     territory: 'León',        risk: 'lo', churnScore: 31 },
    ],
    activity: [
      { date: 'Hoy 10:15',   action: 'En ruta activa',      store: 'Abarrotes "La Esquina"', type: 'visit' },
      { date: 'Hoy 08:00',   action: 'Visita completada',   store: 'Mini Super Vallarta',    type: 'visit' },
      { date: 'Ayer 15:40',  action: 'Oferta de retención', store: 'Abarrotes "La Esquina"', type: 'retention' },
    ],
  },
  {
    id: 'sup03', name: 'Luis Hernández', initials: 'LH',
    state: 'CDMX', zone: 'Zona Metropolitana',
    status: 'active', accounts: 55, atRisk: 12, visitsMonth: 46, retentionRate: 79,
    phone: '+52 55 1234-5678', since: 2017, coverageKm: 210, color: '#f59e0b',
    weeklyVisits: [11, 13, 12, 10],
    stores: [
      { name: 'Kiosco Reforma',         territory: 'CDMX',     risk: 'hi', churnScore: 79 },
      { name: 'Bodega Central Oriente', territory: 'Puebla',   risk: 'lo', churnScore: 22 },
      { name: 'Mini Mercado Veracruz',  territory: 'Veracruz', risk: 'lo', churnScore: 27 },
    ],
    activity: [
      { date: 'Hoy 13:00',   action: 'Auditoría de equipo', store: 'Kiosco Reforma',         type: 'alert' },
      { date: 'Hoy 09:45',   action: 'Visita completada',   store: 'Bodega Central Oriente', type: 'visit' },
      { date: 'Ayer 17:20',  action: 'Llamada de retención', store: 'Kiosco Reforma',         type: 'call' },
      { date: 'Lun 11:10',   action: 'Visita completada',   store: 'Mini Mercado Veracruz',  type: 'visit' },
    ],
  },
  {
    id: 'sup04', name: 'Sofía Martínez', initials: 'SM',
    state: 'Coahuila', zone: 'Zona Norte Centro',
    status: 'offline', accounts: 29, atRisk: 3, visitsMonth: 23, retentionRate: 95,
    phone: '+52 844 567-8901', since: 2022, coverageKm: 480, color: '#34d399',
    weeklyVisits: [5, 6, 7, 5],
    stores: [
      { name: 'Tienda Don Pepe',      territory: 'Saltillo', risk: 'hi', churnScore: 81 },
      { name: 'Tienda El Roble',      territory: 'Torreón', risk: 'lo', churnScore: 14 },
      { name: 'Super Mercado Juárez', territory: 'Chihuahua', risk: 'md', churnScore: 55 },
    ],
    activity: [
      { date: 'Ayer 18:00',  action: 'Día finalizado',      store: 'Tienda Don Pepe',     type: 'visit' },
      { date: 'Ayer 12:30',  action: 'Visita completada',   store: 'Tienda El Roble',     type: 'visit' },
      { date: 'Lun 14:00',   action: 'Oferta de retención', store: 'Tienda Don Pepe',     type: 'retention' },
    ],
  },
  {
    id: 'sup05', name: 'Diego Torres', initials: 'DT',
    state: 'Tamaulipas', zone: 'Zona Frontera',
    status: 'on_route', accounts: 33, atRisk: 7, visitsMonth: 29, retentionRate: 83,
    phone: '+52 868 678-9012', since: 2020, coverageKm: 390, color: '#f43f5e',
    weeklyVisits: [7, 8, 8, 6],
    stores: [
      { name: 'Licorería El Barril',     territory: 'Laredo',    risk: 'hi', churnScore: 73 },
      { name: 'Distribuidora del Norte', territory: 'Reynosa',   risk: 'md', churnScore: 44 },
      { name: 'Tienda La Central',       territory: 'Matamoros', risk: 'md', churnScore: 61 },
    ],
    activity: [
      { date: 'Hoy 11:30',  action: 'En ruta activa',      store: 'Licorería El Barril', type: 'visit' },
      { date: 'Hoy 09:00',  action: 'Visita completada',   store: 'Tienda La Central',   type: 'visit' },
      { date: 'Ayer 16:45', action: 'Alerta atendida',     store: 'Licorería El Barril', type: 'alert' },
    ],
  },
  {
    id: 'sup06', name: 'Valeria López', initials: 'VL',
    state: 'Guanajuato', zone: 'Zona Bajío Centro',
    status: 'active', accounts: 45, atRisk: 6, visitsMonth: 40, retentionRate: 91,
    phone: '+52 477 789-0123', since: 2018, coverageKm: 300, color: '#a78bfa',
    weeklyVisits: [9, 10, 11, 10],
    stores: [
      { name: 'Abarrotes San Marcos', territory: 'Querétaro', risk: 'lo', churnScore: 18 },
      { name: 'Super Express León',   territory: 'León',      risk: 'lo', churnScore: 31 },
      { name: 'Abarrotes Familia',    territory: 'La Paz',    risk: 'md', churnScore: 48 },
    ],
    activity: [
      { date: 'Hoy 15:10',  action: 'Visita completada',   store: 'Super Express León',   type: 'visit' },
      { date: 'Hoy 10:00',  action: 'Visita completada',   store: 'Abarrotes San Marcos', type: 'visit' },
      { date: 'Ayer 14:20', action: 'Oferta de retención', store: 'Abarrotes Familia',    type: 'retention' },
      { date: 'Lun 09:15',  action: 'Llamada de retención', store: 'Super Express León',  type: 'call' },
    ],
  },
];

const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  active:   { label: 'Activo',   color: '#22c55e', bg: 'rgba(34,197,94,.12)' },
  on_route: { label: 'En ruta',  color: '#34d399', bg: 'rgba(52,211,153,.12)' },
  offline:  { label: 'Offline',  color: '#5e6a80', bg: 'rgba(94,106,128,.12)' },
};

const ACTIVITY_ICON: Record<string, string> = {
  visit:     '📍',
  alert:     '⚠️',
  call:      '📞',
  retention: '🎯',
};

const RISK_COLOR: Record<string, string> = { hi: '#f43f5e', md: '#f59e0b', lo: '#22c55e' };
const RISK_LABEL: Record<string, string>  = { hi: 'ALTO',   md: 'MEDIO',   lo: 'BAJO'   };

export default function Supervisores() {
  const [selected, setSelected] = useState<Supervisor>(SUPERVISORS[0]);

  const totalAccounts  = SUPERVISORS.reduce((s, r) => s + r.accounts, 0);
  const totalAtRisk    = SUPERVISORS.reduce((s, r) => s + r.atRisk, 0);
  const avgRetention   = Math.round(SUPERVISORS.reduce((s, r) => s + r.retentionRate, 0) / SUPERVISORS.length);
  const activeCount    = SUPERVISORS.filter(r => r.status !== 'offline').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Top KPI bar ── */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        flexShrink: 0,
      }}>
        {[
          { lbl: 'Supervisores',     val: SUPERVISORS.length.toString(), sub: `${activeCount} activos hoy`,   color: undefined },
          { lbl: 'Cuentas totales',  val: totalAccounts.toString(),      sub: 'bajo supervisión',             color: undefined },
          { lbl: 'Cuentas en riesgo', val: totalAtRisk.toString(),       sub: 'alertas activas',              color: '#f43f5e' },
          { lbl: 'Retención prom.',  val: `${avgRetention}%`,            sub: 'este mes',                     color: '#22c55e' },
        ].map(({ lbl, val, sub, color }, i) => (
          <div key={lbl} style={{
            flex: 1, padding: '14px 20px',
            borderRight: i < 3 ? '1px solid var(--border)' : undefined,
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{lbl}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: color ?? 'var(--text)', fontFamily: 'monospace', lineHeight: 1.1 }}>{val}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Main area ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Supervisor list ── */}
        <div style={{ width: 340, borderRight: '1px solid var(--border)', overflowY: 'auto', background: 'var(--surface)' }}>
          <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid var(--border)', fontSize: '10.5px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {SUPERVISORS.length} supervisores · región Bajío
          </div>
          {SUPERVISORS.map(sup => {
            const isActive = selected.id === sup.id;
            const sm = STATUS_META[sup.status];
            return (
              <div
                key={sup.id}
                onClick={() => setSelected(sup)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', cursor: 'pointer',
                  background: isActive ? 'var(--hover)' : 'transparent',
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.12s',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: sup.color + '22', border: `2px solid ${sup.color}`,
                  color: sup.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700,
                }}>
                  {sup.initials}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{sup.name}</span>
                    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: 'var(--r-sm)', background: sm.bg, color: sm.color, fontWeight: 700 }}>
                      {sm.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>{sup.state} · {sup.zone}</div>
                  <div style={{ marginTop: 5, display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{sup.accounts} cuentas</span>
                    {sup.atRisk > 0 && (
                      <span style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 600 }}>⚠ {sup.atRisk} en riesgo</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Detail panel ── */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-2)' }}>
          {selected && (
            <div style={{ maxWidth: 760, padding: '24px 28px' }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 24 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
                  background: selected.color + '22', border: `2.5px solid ${selected.color}`,
                  color: selected.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 800,
                }}>
                  {selected.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{selected.name}</h2>
                    <span style={{
                      fontSize: '10px', padding: '3px 9px', borderRadius: 'var(--r-sm)',
                      background: STATUS_META[selected.status].bg,
                      color: STATUS_META[selected.status].color,
                      fontWeight: 700, letterSpacing: '0.05em',
                    }}>
                      {STATUS_META[selected.status].label.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ marginTop: 4, fontSize: '13px', color: 'var(--text-muted)' }}>
                    {selected.state} · {selected.zone}
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 16, fontSize: '12px', color: 'var(--text-dim)' }}>
                    <span>📞 {selected.phone}</span>
                    <span>📅 Desde {selected.since}</span>
                    <span>🗺 {selected.coverageKm} km cobertura</span>
                  </div>
                </div>
              </div>

              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { lbl: 'Cuentas',       val: selected.accounts.toString(),       sub: 'asignadas',       color: undefined },
                  { lbl: 'En riesgo',     val: selected.atRisk.toString(),          sub: 'alertas activas', color: selected.atRisk > 5 ? '#f43f5e' : '#f59e0b' },
                  { lbl: 'Visitas',       val: selected.visitsMonth.toString(),     sub: 'este mes',        color: undefined },
                  { lbl: 'Retención',     val: `${selected.retentionRate}%`,        sub: 'tasa mensual',    color: selected.retentionRate >= 90 ? '#22c55e' : '#f59e0b' },
                ].map(({ lbl, val, sub, color }) => (
                  <div key={lbl} style={{
                    padding: '14px 16px', borderRadius: 'var(--r-md)',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{lbl}</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: color ?? 'var(--text)', fontFamily: 'monospace', lineHeight: 1.1 }}>{val}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Weekly performance chart */}
              <div style={{ padding: '16px 18px', borderRadius: 'var(--r-md)', background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 20 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
                  Visitas por semana · últimas 4 semanas
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 64 }}>
                  {selected.weeklyVisits.map((v, i) => {
                    const maxV = Math.max(...selected.weeklyVisits);
                    const pct = v / maxV;
                    const isLatest = i === 3;
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: isLatest ? selected.color : 'var(--text-muted)', fontWeight: isLatest ? 700 : 400 }}>{v}</span>
                        <div style={{ width: '100%', height: Math.round(pct * 44) + 'px', borderRadius: 'var(--r-sm)', background: isLatest ? selected.color : selected.color + '44', transition: 'height 0.4s' }} />
                        <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>S{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* Assigned stores */}
                <div style={{ padding: '16px 18px', borderRadius: 'var(--r-md)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                    Cuentas clave asignadas
                  </div>
                  {selected.stores.map((store, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 0', borderBottom: i < selected.stores.length - 1 ? '1px solid var(--border)' : undefined,
                    }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>{store.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 1 }}>{store.territory}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '12px', fontFamily: 'monospace', color: RISK_COLOR[store.risk], fontWeight: 700 }}>
                          {store.churnScore}%
                        </div>
                        <span style={{
                          fontSize: '9px', padding: '1px 6px', borderRadius: 'var(--r-sm)',
                          background: RISK_COLOR[store.risk] + '22',
                          color: RISK_COLOR[store.risk], fontWeight: 700,
                        }}>
                          {RISK_LABEL[store.risk]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent activity */}
                <div style={{ padding: '16px 18px', borderRadius: 'var(--r-md)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                    Actividad reciente
                  </div>
                  {selected.activity.map((a, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 10, paddingBottom: 10,
                      marginBottom: i < selected.activity.length - 1 ? 10 : 0,
                      borderBottom: i < selected.activity.length - 1 ? '1px solid var(--border)' : undefined,
                    }}>
                      <span style={{ fontSize: '14px', lineHeight: '18px', flexShrink: 0 }}>{ACTIVITY_ICON[a.type]}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '12.5px', color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {a.action}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {a.store}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: 2 }}>{a.date}</div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Action buttons */}
              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <button style={{ padding: '10px 20px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  📞 Llamar
                </button>
                <button style={{ padding: '10px 20px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  📋 Ver ruta asignada
                </button>
                <button style={{ padding: '10px 20px', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--brand)', color: '#0a0f15', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  Reasignar cuentas →
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
