'use client';

import { useEffect, useState, useCallback } from 'react';
import { fbListen, fbUpdate, Client, Pago } from '@/lib/db';
import styles from './pagos.module.css';

function getPaymentStatus(pagos: Pago[]) {
  if (!pagos.length) return { estado: 'pendiente', diasDesde: null, ultimoPago: null };
  const ultimoPago = pagos[pagos.length - 1];
  const diasDesde = Math.floor((Date.now() - new Date(ultimoPago.fecha).getTime()) / (1000 * 60 * 60 * 24));
  let estado = 'vencido';
  if (diasDesde <= 35) estado = 'pagado';
  else if (diasDesde <= 45) estado = 'pendiente';
  return { estado, diasDesde, ultimoPago };
}

const STATUS_CONFIG = {
  pagado:   { color: 'var(--green)', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)',  icon: '✅', txt: 'Al corriente' },
  pendiente:{ color: 'var(--warn)',  bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.3)',  icon: '⏳', txt: 'Pendiente'    },
  vencido:  { color: 'var(--red)',   bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.3)',   icon: '🚫', txt: 'Vencido'     },
};

export default function PagosPage() {
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [pagoModal, setPagoModal] = useState<{ clientId: string; mode: 'manual' | 'monto' } | null>(null);
  const [pmMonto, setPmMonto] = useState('499');
  const [pmFecha, setPmFecha] = useState(new Date().toISOString().split('T')[0]);
  const [pmMetodo, setPmMetodo] = useState('Efectivo');
  const [pmNotas, setPmNotas] = useState('');
  const [mmMonto, setMmMonto] = useState('499');
  const [mmPlan, setMmPlan] = useState('Estándar');

  useEffect(() => {
    const unsub = fbListen('clients', (data) => setClients((data as Record<string, Client>) ?? {}));
    return () => unsub();
  }, []);

  const showToast = useCallback((msg: string, type = '') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  async function registrarPago(clientId: string) {
    const c = clients[clientId]; if (!c) return;
    const pagos = [...(c.pagos ?? [])];
    pagos.push({ fecha: new Date(pmFecha).toISOString(), monto: parseFloat(pmMonto), metodo: pmMetodo, notas: pmNotas });
    await fbUpdate('clients/' + clientId, { pagos });
    showToast(`✅ Pago registrado: ${c.name}`, 'success');
    setPagoModal(null);
  }

  async function guardarMonto(clientId: string) {
    await fbUpdate('clients/' + clientId, { monto: parseFloat(mmMonto), plan: mmPlan });
    showToast('✅ Mensualidad actualizada', 'success');
    setPagoModal(null);
  }

  const clientList = Object.values(clients);
  let pagados = 0, pendientes = 0, vencidos = 0, totalMes = 0;
  clientList.forEach(c => {
    const { estado } = getPaymentStatus(c.pagos ?? []);
    if (estado === 'pagado') pagados++;
    else if (estado === 'pendiente') pendientes++;
    else vencidos++;
    totalMes += c.monto ?? 499;
  });

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pagos</h1>
          <p className={styles.sub}>Control de mensualidades y cobros</p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {[
          { label: 'Al corriente', value: pagados, color: 'var(--green)' },
          { label: 'Pendientes',   value: pendientes, color: 'var(--warn)' },
          { label: 'Vencidos',     value: vencidos, color: 'var(--red)' },
          { label: 'Ingreso mensual', value: `$${totalMes.toLocaleString()}`, color: 'var(--accent2)' },
        ].map(s => (
          <div key={s.label} className={`${styles.statCard} glass-panel animate-in`}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-syne)' }}>{s.value}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text2)', fontFamily: 'var(--font-jetbrains-mono)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Clients list */}
      <div className={styles.list}>
        {clientList.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--font-jetbrains-mono)', padding: '32px', fontSize: '0.8rem' }}>
            Sin clientes registrados
          </div>
        )}
        {clientList.map(c => {
          const { estado, diasDesde, ultimoPago } = getPaymentStatus(c.pagos ?? []);
          const cfg = STATUS_CONFIG[estado as keyof typeof STATUS_CONFIG];
          return (
            <div key={c.id} className={`${styles.clientRow} glass-panel`}>
              <div className={styles.rowHeader}>
                <div className={styles.rowAvatar}>{c.emoji ?? '🏪'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-syne)' }}>{c.name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text2)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                    {c.plan ?? 'Estándar'} · ${c.monto ?? 499}/mes
                  </div>
                </div>
                <div className={styles.statusBadge} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                  {cfg.icon} {cfg.txt}
                </div>
              </div>

              <div className={styles.lastPay}>
                <div>
                  <div style={{ fontSize: '0.58rem', fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Último pago</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono)', marginTop: '2px' }}>
                    {ultimoPago ? `$${ultimoPago.monto} · ${new Date(ultimoPago.fecha).toLocaleDateString('es-MX')} · ${ultimoPago.metodo}` : 'Sin pagos registrados'}
                  </div>
                </div>
                {diasDesde !== null && (
                  <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-jetbrains-mono)', color: diasDesde > 35 ? 'var(--warn)' : 'var(--muted)' }}>
                    hace {diasDesde}d
                  </span>
                )}
              </div>

              <div className={styles.rowActions}>
                <button className={`${styles.payBtn} ${styles.manual}`}
                  onClick={() => { setPmMonto(String(c.monto ?? 499)); setPmFecha(new Date().toISOString().split('T')[0]); setPmMetodo('Efectivo'); setPmNotas(''); setPagoModal({ clientId: c.id, mode: 'manual' }); }}>
                  💵 Pago manual
                </button>
                <button className={`${styles.payBtn} ${styles.settings}`}
                  onClick={() => { setMmMonto(String(c.monto ?? 499)); setMmPlan(c.plan ?? 'Estándar'); setPagoModal({ clientId: c.id, mode: 'monto' }); }}>
                  ⚙️ Plan
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pago Manual Modal */}
      {pagoModal?.mode === 'manual' && (
        <div className={styles.backdrop} onClick={e => e.target === e.currentTarget && setPagoModal(null)}>
          <div className={`${styles.modal} glass-panel`}>
            <div className={styles.modalHeader}>
              <h2>💵 Registrar pago — {clients[pagoModal.clientId]?.name}</h2>
              <button className={styles.closeBtn} onClick={() => setPagoModal(null)}>✕</button>
            </div>
            <div className={styles.modalForm}>
              <div className={styles.field}><label>Monto ($)</label><input type="number" value={pmMonto} onChange={e => setPmMonto(e.target.value)} /></div>
              <div className={styles.field}><label>Fecha</label><input type="date" value={pmFecha} onChange={e => setPmFecha(e.target.value)} /></div>
              <div className={styles.field}><label>Método</label>
                <select value={pmMetodo} onChange={e => setPmMetodo(e.target.value)}>
                  {['Efectivo','Transferencia','CoDi','Tarjeta','Otro'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className={styles.field}><label>Notas (opcional)</label><input value={pmNotas} onChange={e => setPmNotas(e.target.value)} placeholder="Referencia, notas..." /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn secondary" onClick={() => setPagoModal(null)}>Cancelar</button>
              <button className="btn primary" onClick={() => registrarPago(pagoModal.clientId)}>✅ Registrar pago</button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Modal */}
      {pagoModal?.mode === 'monto' && (
        <div className={styles.backdrop} onClick={e => e.target === e.currentTarget && setPagoModal(null)}>
          <div className={`${styles.modal} glass-panel`}>
            <div className={styles.modalHeader}>
              <h2>⚙️ Plan — {clients[pagoModal.clientId]?.name}</h2>
              <button className={styles.closeBtn} onClick={() => setPagoModal(null)}>✕</button>
            </div>
            <div className={styles.modalForm}>
              <div className={styles.field}><label>Mensualidad ($)</label><input type="number" value={mmMonto} onChange={e => setMmMonto(e.target.value)} /></div>
              <div className={styles.field}><label>Nombre del plan</label><input value={mmPlan} onChange={e => setMmPlan(e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn secondary" onClick={() => setPagoModal(null)}>Cancelar</button>
              <button className="btn primary" onClick={() => guardarMonto(pagoModal.clientId)}>💾 Guardar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`${styles.toast} ${styles[toast.type]}`}>{toast.msg}</div>}
    </div>
  );
}
