'use client';

import { useEffect, useState, useCallback } from 'react';
import { fbListen, fbSet, Client } from '@/lib/db';
import styles from './control.module.css';

export default function ControlPage() {
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [intValue, setIntValue] = useState(10);
  const [volValue, setVolValue] = useState(80);

  useEffect(() => {
    const unsub = fbListen('clients', (data) => setClients((data as Record<string, Client>) ?? {}));
    return () => unsub();
  }, []);

  const showToast = useCallback((msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  async function sendCmd(action: string, value: unknown) {
    if (!selectedId) { showToast('Selecciona un cliente primero', 'error'); return; }
    await fbSet('commands/' + selectedId, { action, value, ts: Date.now() });
    showToast(`Comando enviado: ${action} ✓`);
  }

  const selected = selectedId ? clients[selectedId] : null;
  const clientList = Object.values(clients);

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Control remoto</h1>
        <p className={styles.sub}>Controla reproductores en tiempo real</p>
      </div>

      {/* Client tabs */}
      <div className={styles.sectionLabel}>Selecciona un cliente</div>
      <div className={styles.tabs}>
        {clientList.length === 0 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>Sin clientes.</span>
        )}
        {clientList.map(c => (
          <button
            key={c.id}
            className={`${styles.tab} ${selectedId === c.id ? styles.tabActive : ''}`}
            onClick={() => setSelectedId(c.id)}
          >
            {c.emoji ?? '🏪'} {c.name} {c.blocked ? '🚫' : ''}
          </button>
        ))}
      </div>

      {/* Control panel */}
      <div className={`${styles.panel} glass-panel`}>
        <div className={styles.panelClient}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', fontFamily: 'var(--font-syne)' }}>
            {selected ? `${selected.emoji ?? '🏪'} ${selected.name}` : '—'}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text2)', fontFamily: 'var(--font-jetbrains-mono)', marginTop: 3 }}>
            {selected ? `PIN: ${selected.pin} · Intervalo: ${selected.intervalo} min` : 'Selecciona un cliente arriba'}
          </div>
        </div>

        {/* Big play button */}
        <button
          className={`${styles.bigBtn} ${isPlaying ? styles.bigBtnPlaying : ''}`}
          onClick={() => { const next = !isPlaying; setIsPlaying(next); sendCmd('play_pause', next); }}
        >
          {isPlaying ? '⏸ Pausar' : '▶ Reproducir'}
        </button>

        {/* Quick actions */}
        <div className={styles.actionsGrid}>
          {[
            { icon: '📢', label: 'Forzar anuncio', action: () => sendCmd('force_ad', true), cls: styles.btnAd },
            { icon: '☁️', label: 'Sync Drive',     action: () => sendCmd('sync_drive', true), cls: styles.btnSync },
            { icon: '🔒', label: 'Bloquear',        action: () => sendCmd('lock', true), cls: styles.btnLock },
          ].map(b => (
            <button key={b.label} className={`${styles.actionBtn} ${b.cls}`} onClick={b.action}>
              <span style={{ fontSize: '1.3rem' }}>{b.icon}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>{b.label}</span>
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className={styles.sliders}>
          <div>
            <label className={styles.sliderLabel}>
              Intervalo anuncio <span style={{ color: 'var(--accent2)' }}>{intValue} min</span>
            </label>
            <input type="range" min={1} max={60} value={intValue}
              onChange={e => setIntValue(Number(e.target.value))}
              onMouseUp={() => sendCmd('set_interval', intValue)}
              style={{ width: '100%', accentColor: 'var(--accent)' }} />
          </div>
          <div>
            <label className={styles.sliderLabel}>
              Volumen música <span style={{ color: 'var(--accent2)' }}>{volValue}%</span>
            </label>
            <input type="range" min={0} max={100} value={volValue}
              onChange={e => setVolValue(Number(e.target.value))}
              onMouseUp={() => sendCmd('set_volume', volValue)}
              style={{ width: '100%', accentColor: 'var(--accent)' }} />
          </div>
        </div>
      </div>

      {toast && <div className={`${styles.toast} ${styles[toast.type]}`}>{toast.msg}</div>}
    </div>
  );
}
