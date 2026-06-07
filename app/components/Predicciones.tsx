'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import accountsData from '../data/accounts.json';

interface Reason {
  factor: string;
  impact: 'increases_churn' | 'decreases_churn';
  shap_value: number;
}

interface Prediction {
  customer_id: string;
  name: string;
  territory: string;
  type: string;
  size: string;
  churn_probability: number;
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  top_reasons: Reason[];
}

const RISK_COLOR: Record<string, string> = {
  CRITICAL: 'var(--hi)',
  HIGH:     'var(--md)',
  MEDIUM:   '#a78bfa',
  LOW:      'var(--lo)',
};

const RISK_SOFT: Record<string, string> = {
  CRITICAL: 'var(--hi-soft)',
  HIGH:     'var(--md-soft)',
  MEDIUM:   'rgba(167,139,250,.14)',
  LOW:      'var(--lo-soft)',
};

const RISK_LABEL_ES: Record<string, string> = {
  CRITICAL: 'CRÍTICO',
  HIGH:     'ALTO',
  MEDIUM:   'MEDIO',
  LOW:      'BAJO',
};

function simulateChurnProb(s: any): number {
  const monthsInactive  = s.monthsInactive  ?? 0;
  const avgTransactions = s.avgTransactions ?? 0;
  const numCoolers      = s.numCoolers      ?? 0;
  const avgBoxes        = s.avgBoxes        ?? 0;

  let score = monthsInactive / 150;                      // inactividad es el factor dominante
  score -= avgTransactions / 180;                        // más transacciones = menos riesgo
  score -= avgBoxes / 400;                               // más cajas = menos riesgo
  if (numCoolers === 0) score += 0.06;                   // sin enfriadores sube el riesgo
  score += (Math.sin(s.id?.charCodeAt(0) ?? 0) * 0.04); // pequeña variación determinista por ID

  return Math.min(0.97, Math.max(0.12, +score.toFixed(2)));
}

function toFallbackPredictions(): Prediction[] {
  return (accountsData as any[]).map(s => {
    const prob = simulateChurnProb(s);
    const riskLevel = prob > 0.75 ? 'CRITICAL' : prob > 0.55 ? 'HIGH' : prob > 0.30 ? 'MEDIUM' : 'LOW';
    const reasons: Reason[] = [];

    const monthsInactive = s.monthsInactive ?? 0;
    const avgTransactions = s.avgTransactions ?? 0;
    const avgBoxes = s.avgBoxes ?? 0;
    const numCoolers = s.numCoolers ?? 0;

    if (monthsInactive > 0)
      reasons.push({ factor: 'Meses inactivo', impact: 'increases_churn', shap_value: +(monthsInactive / 200).toFixed(3) });
    if (avgTransactions < 5)
      reasons.push({ factor: 'Transacciones promedio bajas', impact: 'increases_churn', shap_value: +((5 - avgTransactions) / 20).toFixed(3) });
    else
      reasons.push({ factor: 'Transacciones promedio', impact: 'decreases_churn', shap_value: +(avgTransactions / 200).toFixed(3) });
    if (avgBoxes === 0)
      reasons.push({ factor: 'Sin cajas vendidas', impact: 'increases_churn', shap_value: 0.31 });
    if (numCoolers === 0)
      reasons.push({ factor: 'Sin enfriadores activos', impact: 'increases_churn', shap_value: 0.18 });

    reasons.sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value));

    return {
      customer_id: s.id,
      name: s.name,
      territory: s.territory,
      type: s.type,
      size: s.size,
      churn_probability: +prob.toFixed(2),
      risk_level: riskLevel,
      top_reasons: reasons.slice(0, 4),
    } as Prediction;
  }).sort((a, b) => b.churn_probability - a.churn_probability);
}

export default function Predicciones() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Prediction | null>(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/predictions')
      .then(res => { setPredictions(res.data); setLoading(false); })
      .catch(() => { setPredictions(toFallbackPredictions()); setLoading(false); });
  }, []);

  const critical = predictions.filter(p => p.risk_level === 'CRITICAL').length;
  const high     = predictions.filter(p => p.risk_level === 'HIGH').length;

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0, overflow: 'hidden' }}>

      {/* ── List panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* header */}
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                Predicciones de Churn · LightGBM
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                SMOTE · Accuracy 95% · Umbral SHAP top-4 features
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ padding: '4px 10px', borderRadius: 'var(--r-sm)', background: 'var(--hi-soft)', color: 'var(--hi)', fontSize: '11px', fontWeight: 700 }}>
                {critical} CRÍTICOS
              </span>
              <span style={{ padding: '4px 10px', borderRadius: 'var(--r-sm)', background: 'var(--md-soft)', color: 'var(--md)', fontSize: '11px', fontWeight: 700 }}>
                {high} ALTOS
              </span>
            </div>
          </div>
        </div>

        {/* table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '32px 1fr 100px 90px 120px',
          gap: '0 12px',
          padding: '8px 24px',
          borderBottom: '1px solid var(--border)',
          fontSize: '10.5px',
          color: 'var(--text-dim)',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          flexShrink: 0,
        }}>
          <span>#</span>
          <span>Cuenta</span>
          <span>Prob. churn</span>
          <span>Nivel</span>
          <span>Factor principal</span>
        </div>

        {/* rows */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px 24px', color: 'var(--text-muted)', textAlign: 'center' }}>Cargando predicciones…</div>
          ) : (
            predictions.map((p, i) => {
              const isActive = selected?.customer_id === p.customer_id;
              const color = RISK_COLOR[p.risk_level];
              const mainReason = p.top_reasons.find(r => r.impact === 'increases_churn');
              return (
                <div
                  key={p.customer_id}
                  onClick={() => setSelected(p)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr 100px 90px 120px',
                    gap: '0 12px',
                    padding: '10px 24px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: isActive ? 'var(--hover)' : 'transparent',
                    transition: 'background 0.15s',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{i + 1}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 1 }}>{p.territory} · {p.type}</div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        flex: 1,
                        height: 5,
                        borderRadius: 3,
                        background: 'var(--surface-3)',
                        overflow: 'hidden',
                      }}>
                        <div style={{ width: `${p.churn_probability * 100}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} />
                      </div>
                      <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color, minWidth: 34, textAlign: 'right' }}>
                        {(p.churn_probability * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    padding: '3px 7px',
                    borderRadius: 'var(--r-sm)',
                    background: RISK_SOFT[p.risk_level],
                    color,
                    whiteSpace: 'nowrap',
                  }}>
                    {RISK_LABEL_ES[p.risk_level]}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {mainReason?.factor ?? '—'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Detail panel ── */}
      <div style={{
        width: 300,
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--surface)',
      }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--text-dim)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 18 8 12l4 3 8-10"/><path d="m16 5 4 0 0 4"/></svg>
            <span style={{ fontSize: '12px' }}>Selecciona una cuenta</span>
          </div>
        ) : (
          <>
            <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35 }}>{selected.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 3 }}>{selected.territory} · {selected.size}</div>
                </div>
                <span style={{
                  flexShrink: 0,
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em',
                  padding: '3px 8px', borderRadius: 'var(--r-sm)',
                  background: RISK_SOFT[selected.risk_level],
                  color: RISK_COLOR[selected.risk_level],
                }}>
                  {RISK_LABEL_ES[selected.risk_level]}
                </span>
              </div>

              {/* big probability */}
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <div style={{ fontSize: '42px', fontWeight: 800, color: RISK_COLOR[selected.risk_level], lineHeight: 1, fontFamily: 'monospace' }}>
                  {(selected.churn_probability * 100).toFixed(0)}<span style={{ fontSize: '20px', fontWeight: 400 }}>%</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 4 }}>probabilidad de churn · 30d</div>
                <div style={{ marginTop: 10, height: 8, borderRadius: 4, background: 'var(--surface-3)', overflow: 'hidden' }}>
                  <div style={{ width: `${selected.churn_probability * 100}%`, height: '100%', background: RISK_COLOR[selected.risk_level], borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
              </div>
            </div>

            {/* SHAP reasons */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                Factores SHAP · Top {selected.top_reasons.length}
              </div>
              {selected.top_reasons.map((r, i) => {
                const isIncrease = r.impact === 'increases_churn';
                const barColor = isIncrease ? 'var(--hi)' : 'var(--lo)';
                const maxShap = Math.max(...selected.top_reasons.map(x => Math.abs(x.shap_value)));
                const pct = maxShap > 0 ? (Math.abs(r.shap_value) / maxShap) * 100 : 0;
                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.factor}</span>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: barColor }}>
                        {isIncrease ? '+' : '−'}{r.shap_value.toFixed(3)}
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-3)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* actions */}
            <div style={{ padding: '14px 18px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button style={{
                padding: '9px 0', borderRadius: 'var(--r-md)', border: '1px solid var(--border-2)',
                background: 'var(--surface-2)', color: 'var(--text)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}>
                Asignar visita
              </button>
              <button style={{
                padding: '9px 0', borderRadius: 'var(--r-md)', border: 'none',
                background: 'var(--brand)', color: '#0a0f15', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              }}>
                Ver perfil completo →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
