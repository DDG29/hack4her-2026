'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { Store } from './components/Map';

// Dummy data for KPI calculations
const accounts = [
  { id: '1', risk: 'hi', territory: 'La Paz', avgTransactions: 30 },
  { id: '2', risk: 'hi', territory: 'Monterrey', avgTransactions: 25 },
  { id: '3', risk: 'hi', territory: 'La Paz', avgTransactions: 20 },
  { id: '4', risk: 'md', territory: 'Monterrey', avgTransactions: 50 },
  { id: '5', risk: 'lo', territory: 'CDMX', avgTransactions: 100 },
];

const Map = dynamic(() => import('./components/Map'), {
  ssr: false,
  loading: () => <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Cargando mapa...</div>
});

const Predicciones = dynamic(() => import('./components/Predicciones'), {
  ssr: false,
  loading: () => <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Cargando predicciones...</div>
});

/* ------------------------------------------------------------------ */
/* SVG icon helper                                                      */
/* ------------------------------------------------------------------ */
function Icon({ id, className = 'i' }: { id: string; className?: string }) {
  return (
    <svg className={className} aria-hidden="true">
      <use href={`#${id}`} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Icon sprite (hidden)                                                 */
/* ------------------------------------------------------------------ */
function IconSprites() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <symbol id="i-map" viewBox="0 0 24 24"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14m6-12v14" /></symbol>
        <symbol id="i-accounts" viewBox="0 0 24 24"><path d="M3 5h18M3 12h18M3 19h12" /><circle cx="20" cy="19" r="2" /></symbol>
        <symbol id="i-route" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M6 8.5v3a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3" /></symbol>
        <symbol id="i-predict" viewBox="0 0 24 24"><path d="M4 18 8 12l4 3 8-10" /><path d="m16 5 4 0 0 4" /></symbol>
        <symbol id="i-report" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></symbol>
        <symbol id="i-team" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><circle cx="17" cy="9" r="2.5" /><path d="M16 20a5 5 0 0 1 5-5" /></symbol>
        <symbol id="i-settings" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.4 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.4l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.6 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></symbol>
        <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></symbol>
        <symbol id="i-bell" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></symbol>
        <symbol id="i-help" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .75-1.5 1.5-1.5 3M12 17.01v.01" /></symbol>
        <symbol id="i-zoomin" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></symbol>
        <symbol id="i-zoomout" viewBox="0 0 24 24"><path d="M5 12h14" /></symbol>
        <symbol id="i-layers" viewBox="0 0 24 24"><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5M3 18l9 5 9-5" /></symbol>
        <symbol id="i-x" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></symbol>
        <symbol id="i-phone" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.92z" /></symbol>
        <symbol id="i-msg" viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" /></symbol>
        <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></symbol>
        <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></symbol>
        <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></symbol>
        <symbol id="i-spark" viewBox="0 0 24 24"><path d="m12 3 1.8 5.5L19 10l-5.2 1.5L12 17l-1.8-5.5L5 10l5.2-1.5L12 3z" /></symbol>
        <symbol id="i-filter" viewBox="0 0 24 24"><path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" /></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12 5 5 9-11" /></symbol>
      </defs>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Chip component (togglable)                                           */
/* ------------------------------------------------------------------ */
function Chip({
  label,
  risk,
  defaultOn = false,
  dot = false,
}: {
  label: string;
  risk?: 'hi' | 'md' | 'lo';
  defaultOn?: boolean;
  dot?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  const cls = ['chip', risk ?? '', on ? 'on' : ''].filter(Boolean).join(' ');
  return (
    <span className={cls} onClick={() => setOn(!on)}>
      {dot && <span className="d" />}
      {label}
    </span>
  );
}

const totalAccounts = accounts.length

const highRisk = accounts.filter((a: {risk: string}) => a.risk === 'hi').length

const valueAtRisk = accounts
  .filter((a: {risk: string}) => a.risk === 'hi')
  .reduce((sum: number, a: {avgTransactions: number}) => sum + a.avgTransactions, 0)

const criticalRegion = Object.entries(
  accounts
    .filter((a: {risk: string}) => a.risk === 'hi')
    .reduce((acc: Record<string, number>, a: {territory: string}) => {
      acc[a.territory] = (acc[a.territory] || 0) + 1
      return acc
    }, {})
).sort((a, b) => b[1] - a[1])[0][0]

const criticalRegionCount = accounts
  .filter((a: {risk: string, territory: string}) => 
    a.risk === 'hi' && a.territory === criticalRegion
  ).length

/* ------------------------------------------------------------------ */
/* Main Dashboard                                                       */
/* ------------------------------------------------------------------ */
const RISK_LABEL: Record<string, string> = { hi: 'ALTO', md: 'MEDIO', lo: 'BAJO' };

export default function Dashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hintGone, setHintGone] = useState(false);
  const [layerPopOpen, setLayerPopOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<'Gerente' | 'Supervisor' | 'Analista'>('Gerente');
  const [activeView, setActiveView] = useState<'Mapa' | 'Lista'>('Mapa');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [activeNav, setActiveNav] = useState<string>('Mapa');
  const layerBtnRef = useRef<HTMLButtonElement>(null);

  function openDrawer() {
    setDrawerOpen(true);
    setHintGone(true);
  }
  function closeDrawer() {
    setDrawerOpen(false);
  }

  function handleStoreSelect(store: Store) {
    setSelectedStore(store);
    setDrawerOpen(true);
    setHintGone(true);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    function onDoc() { setLayerPopOpen(false); }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  return (
    <>
      <IconSprites />

      <div className="app">

        {/* =================== SIDEBAR ======================== */}
        <aside className="sidebar">
          <div className="brand">
            <div className="mark" />
            <div className="name">
              Churn Hunters
              <small>Panel · Bajío</small>
            </div>
          </div>

          <nav className="nav">
            <a className={`item${activeNav === 'Mapa' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveNav('Mapa'); }}>
              <Icon id="i-map" /> Mapa
              <span className="badge">1,890</span>
            </a>
            <a className="item" href="#"><Icon id="i-accounts" /> Cuentas</a>
            <a className="item" href="#"><Icon id="i-route" /> Rutas de visita</a>
            <a className={`item${activeNav === 'Predicciones' ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); setActiveNav('Predicciones'); }}>
              <Icon id="i-predict" /> Predicciones
            </a>
            <a className="item" href="#"><Icon id="i-report" /> Reportes</a>

            <div className="nav-section">Equipo</div>
            <a className="item" href="#">
              <Icon id="i-team" /> Supervisores
              <span className="badge muted">42</span>
            </a>
            <a className="item" href="#"><Icon id="i-settings" /> Ajustes</a>
          </nav>

          <div className="filters">
            <h4>
              Filtros
              <span className="clear">limpiar</span>
            </h4>

            <div className="filter-block">
              <label>Nivel de riesgo</label>
              <div className="chips">
                <Chip label="Alto"  risk="hi" defaultOn dot />
                <Chip label="Medio" risk="md" defaultOn dot />
                <Chip label="Bajo"  risk="lo" dot />
              </div>
            </div>

            <div className="filter-block">
              <label>Región</label>
              <div className="select">
                Bajío <span className="caret">▾</span>
              </div>
            </div>

            <div className="filter-block">
              <label>Tipo de negocio</label>
              <div className="chips">
                <Chip label="Tiendita"    defaultOn />
                <Chip label="Abarrotes"   defaultOn />
                <Chip label="Restaurante" />
                <Chip label="+ 4" />
              </div>
            </div>

            <div className="filter-block">
              <label>Días sin pedido</label>
              <div className="range">
                <div className="bar">
                  <div className="fill" />
                  <div className="knob" style={{ left: '20%' }} />
                  <div className="knob" style={{ left: '100%', background: 'var(--text)', borderColor: 'var(--brand)' }} />
                </div>
                <div className="lbls"><span>30d</span><span>120d+</span></div>
              </div>
            </div>
          </div>
        </aside>

        {/* =================== MAIN =========================== */}
        <div className="main">

          {/* TOPBAR */}
          <header className="topbar">
            <div className="title">
              Panel de Intervención
              <span className="sep">/</span>
              <span className="crumb">México</span>
              <span className="sep">/</span>
              <span className="crumb">Bajío</span>
            </div>

            <div className="search">
              <Icon id="i-search" className="i i-sm" />
              <input placeholder="Buscar cuenta, ciudad o ID…" />
              <kbd>⌘ K</kbd>
            </div>

            <div className="grow" />

            <div className="role-switch" role="tablist" aria-label="Rol activo">
              {(['Gerente', 'Supervisor', 'Analista'] as const).map((r) => (
                <button
                  key={r}
                  className={activeRole === r ? 'on' : ''}
                  onClick={() => setActiveRole(r)}
                >
                  {r}
                </button>
              ))}
            </div>

            <button className="icon-btn" aria-label="notificaciones">
              <Icon id="i-bell" />
              <span className="dot" />
            </button>
            <button className="icon-btn" aria-label="ayuda">
              <Icon id="i-help" />
            </button>
            <div className="avatar" aria-label="M. González">MG</div>
          </header>

          {/* WORKSPACE */}
          <div className={`workspace${drawerOpen && activeNav === 'Mapa' ? '' : ' closed'}`}>

            {/* ===================== MAP / PREDICCIONES ======================== */}
            <div className="mapwrap" id="mapwrap" style={{ position: 'relative' }}>
              {activeNav === 'Predicciones' ? (
                <div style={{ height: '100%', overflow: 'hidden', background: 'var(--bg-2)' }}>
                  <Predicciones />
                </div>
              ) : (
                <Map onStoreSelect={handleStoreSelect} />
              )}

              {/* map tools */}
              <div className="map-tools" style={{ display: activeNav === 'Predicciones' ? 'none' : undefined }}>
                <div className="group">
                  <button title="Acercar"><Icon id="i-zoomin" /></button>
                  <button title="Alejar"><Icon id="i-zoomout" /></button>
                </div>
                <div className="group">
                  <button
                    title="Capas"
                    ref={layerBtnRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLayerPopOpen((v) => !v);
                    }}
                  >
                    <Icon id="i-layers" />
                  </button>
                </div>
              </div>

              {/* layer popover */}
              <div className={`layer-pop${layerPopOpen ? ' open' : ''}`} onClick={(e) => e.stopPropagation()} style={{ display: activeNav === 'Predicciones' ? 'none' : undefined }}>
                <h5>Capas</h5>
                <label className="opt"><input type="checkbox" defaultChecked /> Pines de cuentas</label>
                <label className="opt"><input type="checkbox" defaultChecked /> Clusters</label>
                <label className="opt"><input type="checkbox" /> Heatmap densidad</label>
                <label className="opt"><input type="checkbox" /> Rutas asignadas</label>
                <label className="opt"><input type="checkbox" defaultChecked /> Etiquetas de estado</label>
              </div>

              {/* view pills */}
              <div className="view-pills" style={{ display: activeNav === 'Predicciones' ? 'none' : undefined }}>
                {(['Mapa', 'Lista'] as const).map((v) => (
                  <button
                    key={v}
                    className={activeView === v ? 'on' : ''}
                    onClick={() => setActiveView(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* legend */}
              <div className="legend" style={{ display: activeNav === 'Predicciones' ? 'none' : undefined }}>
                <h5>Riesgo de churn (30d)</h5>
                <div className="row">
                  <span className="swatch" style={{ color: 'var(--hi)', background: 'var(--hi)' }} />
                  Alto · &gt;70%
                </div>
                <div className="row">
                  <span className="swatch" style={{ color: 'var(--md)', background: 'var(--md)' }} />
                  Medio · 40–70%
                </div>
                <div className="row">
                  <span className="swatch" style={{ color: 'var(--lo)', background: 'var(--lo)' }} />
                  Bajo · &lt;40%
                </div>
                <div className="sub">Cluster muestra # de cuentas en zona</div>
              </div>

              {/* hint chip */}
              <div className={`map-hint${hintGone || activeNav === 'Predicciones' ? ' gone' : ''}`}>
                <span className="k">Click</span> un marcador para ver detalle
              </div>
            </div>

            {/* ===================== DRAWER ===================== */}
            <aside className="drawer">
              <div className="drawer-head">
                <h3>Detalle de cuenta</h3>
                <button className="x" aria-label="cerrar" onClick={closeDrawer}>
                  <Icon id="i-x" />
                </button>
              </div>

              <div className="drawer-body">

                {/* photo */}
                <div className="photo">FOTO DEL LOCAL</div>

                {/* name + risk */}
                <div className="acct-card">
                  <div className="acct-name">
                    <div>
                      <h2>{selectedStore?.name ?? 'Selecciona una cuenta'}</h2>
                      <div className="meta">
                        <span>ID <b>#{selectedStore?.id ?? '—'}</b></span>
                        <span>·</span>
                        <span>{selectedStore?.territory ?? '—'}</span>
                        <span>·</span>
                        <span>{selectedStore?.type ?? '—'}</span>
                      </div>
                    </div>
                    {selectedStore && (
                      <span className={`risk-badge ${selectedStore.risk}`}>
                        <span className="pulse" />{RISK_LABEL[selectedStore.risk]}
                      </span>
                    )}
                  </div>
                </div>

                {/* score card */}
                <div className="score-card">
                  <div className="gauge">
                    <svg viewBox="0 0 130 80">
                      <path d="M 12 70 A 53 53 0 0 1 118 70"
                        stroke="#243044" strokeWidth="9" fill="none" strokeLinecap="round" />
                      <path d="M 12 70 A 53 53 0 0 1 47 19"
                        stroke="#22c55e" strokeWidth="9" fill="none" strokeLinecap="round" opacity=".25" />
                      <path d="M 47 19 A 53 53 0 0 1 83 19"
                        stroke="#f59e0b" strokeWidth="9" fill="none" strokeLinecap="round" opacity=".25" />
                      <path d="M 83 19 A 53 53 0 0 1 118 70"
                        stroke="#f43f5e" strokeWidth="9" fill="none" strokeLinecap="round" />
                      <g transform="translate(65 70) rotate(60)">
                        <line x1="0" y1="0" x2="0" y2="-46" stroke="#eaeef5" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="0" cy="0" r="6" fill="#eaeef5" stroke="#0a0f15" strokeWidth="2" />
                      </g>
                      <text x="12"  y="78" textAnchor="middle" fill="#5e6a80" fontSize="8" fontFamily="JetBrains Mono">0</text>
                      <text x="118" y="78" textAnchor="middle" fill="#5e6a80" fontSize="8" fontFamily="JetBrains Mono">100</text>
                    </svg>
                  </div>
                  <div>
                    <div className="lbl">Riesgo de churn · 30d</div>
                    <div className="num">{selectedStore?.churnScore ?? '—'}<small>%</small></div>
                    <div className="delta">score del modelo</div>
                  </div>
                </div>

                {/* mini stat grid */}
                <div className="mini-grid">
                  <div className="mini-stat">
                    <span className="lbl">Días sin pedido</span>
                    <span className="val hi">65</span>
                    <span className="sub">vs prom. 18d</span>
                  </div>
                  <div className="mini-stat">
                    <span className="lbl">Tamaño</span>
                    <span className="val">{selectedStore?.size ?? '—'}</span>
                    <span className="sub">categoría de cuenta</span>
                  </div>
                  <div className="mini-stat" style={{ gridColumn: 'span 2' }}>
                    <span className="lbl">Productividad refrigerador</span>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px' }}>
                      <span className="val hi">
                        2.0<small style={{ fontSize: '13px', color: 'var(--text-muted)' }}> / 5.0</small>
                      </span>
                      <div className="fridge-row" style={{ flex: 1 }}>
                        <span className="full" />
                        <span className="full" />
                        <span className="empty" />
                        <span className="empty" />
                        <span className="empty" />
                      </div>
                    </div>
                    <span className="sub">↓ 60% vs trimestre pasado</span>
                  </div>
                </div>

                {/* order history chart */}
                <div className="mini-stat" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="lbl">Tendencia de pedidos · 12m</span>
                    <span className="sub mono" style={{ fontSize: '11px' }}>cajas/mes</span>
                  </div>
                  <svg viewBox="0 0 320 80" style={{ marginTop: '6px', height: '80px', width: '100%' }}>
                    <defs>
                      <linearGradient id="trendfill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%"   stopColor="#f43f5e" stopOpacity=".35" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 18 L 28 22 L 56 16 L 84 26 L 112 30 L 140 38 L 168 46 L 196 54 L 224 60 L 252 66 L 280 70 L 308 74 L 320 78 L 320 80 L 0 80 Z"
                      fill="url(#trendfill)"
                    />
                    <path
                      d="M 0 18 L 28 22 L 56 16 L 84 26 L 112 30 L 140 38 L 168 46 L 196 54 L 224 60 L 252 66 L 280 70 L 308 74 L 320 78"
                      fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinejoin="round"
                    />
                    <line x1="0" y1="78" x2="320" y2="78" stroke="#2a3653" strokeWidth=".5" strokeDasharray="2 3" />
                    <circle cx="308" cy="74" r="3" fill="#f43f5e" stroke="#0a0f15" strokeWidth="1.5" />
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-dim)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                    <span>JUN&apos;25</span><span>DIC&apos;25</span><span>JUN&apos;26</span>
                  </div>
                </div>

                {/* contact */}
                <div className="contact">
                  <div className="head">
                    <div className="av">ML</div>
                    <div className="info">
                      <strong>Sra. María López</strong>
                      <span>Dueña · Cliente desde 2017</span>
                    </div>
                  </div>
                  <div className="links">
                    <a href="#"><Icon id="i-phone" className="i i-sm" />Llamar</a>
                    <a href="#"><Icon id="i-msg"   className="i i-sm" />WhatsApp</a>
                    <a href="#"><Icon id="i-mail"  className="i i-sm" />Correo</a>
                  </div>
                </div>

                {/* recommended action */}
                <div className="reco">
                  <div className="label">
                    <Icon id="i-spark" className="i i-sm" /> Acción recomendada
                  </div>
                  <h4>Enviar supervisor a auditoría de equipos + oferta de retención</h4>
                  <p>Intervenir esta semana mientras la señal es accionable. Cliente con historial estable de 7 años y caída reciente repentina.</p>
                  <div className="conf">
                    Confianza del modelo
                    <div className="bar"><div /></div>
                    <b>62%</b>
                  </div>
                </div>

              </div>

              <div className="drawer-actions">
                <button className="btn-sec">Asignar visita</button>
                <button className="btn-pri">
                  Ver perfil completo <Icon id="i-arrow" className="i i-sm" />
                </button>
              </div>

            </aside>
          </div>

          {/* =================== KPI BAR ====================== */}
          <footer className="kpibar">
             <div className="kpi">
              <span className="lbl">Total cuentas</span>
              <span className="val">{totalAccounts.toLocaleString()}</span>
              <span className="delta">activas en región</span>
            </div>

            <div className="kpi">
              <span className="lbl">En riesgo alto</span>
              <span className="val hi">{highRisk}</span>
              <span className="delta up">▲ alertas activas</span>
            </div>

            <div className="kpi">
              <span className="lbl">Transacciones en riesgo</span>
              <span className="val">{valueAtRisk.toLocaleString()}</span>
              <span className="delta">suma · cuentas en riesgo alto</span>
            </div>

            <div className="kpi">
              <span className="lbl">Región crítica</span>
              <span className="val" style={{ fontSize: '22px' }}>{criticalRegion}</span>
              <span className="delta"><b>{criticalRegionCount}</b> alertas activas</span>
            </div>
          </footer>

        </div>
      </div>
    </>
  );
}
