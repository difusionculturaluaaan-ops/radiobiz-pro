'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fbListen, fbUpdate, Client, generateLink } from '@/lib/db';
import styles from './programar.module.css';

/* ─── Sub-componente: ajustes de intervalo/fade con auto-save ─── */
function ClientSettings({ client }: { client: Client }) {
  const [folder, setFolder] = useState(client.folder || '');
  const [intervalo, setIntervalo] = useState(String(client.intervalo || 10));
  const [fade, setFade] = useState(String(client.fade || 2));
  const [saved, setSaved] = useState(false);

  const autoSave = async (field: string, value: string | number) => {
    try {
      await fbUpdate(`clients/${client.id}`, { [field]: value });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) { console.error(e); }
  };

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '10px',
    background: 'var(--s2)', border: '1px solid var(--border2)',
    borderRadius: '8px', color: 'var(--text)',
    fontFamily: 'inherit', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{client.emoji || '🏪'} {client.name}</h2>
        {saved && (
          <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600 }}>✅ Guardado</span>
        )}
      </div>

      {/* Spots folder — editable */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
          🎵 Folder de spots
        </label>
        <input
          type="text"
          value={folder}
          onChange={e => setFolder(e.target.value)}
          onBlur={() => { if (folder.trim()) autoSave('folder', folder.trim()); }}
          placeholder="1aBcDeFgHiJkLmNoPqRs..."
          style={{
            width: '100%', padding: '10px 12px', boxSizing: 'border-box',
            background: 'var(--s2)', border: '1px solid var(--border2)',
            borderRadius: '8px', color: 'var(--text)',
            fontFamily: 'var(--font-jetbrains-mono)', fontSize: '0.75rem', outline: 'none',
          }}
        />
      </div>

      {/* Fuente de música — readonly, editable desde el player */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text2)' }}>
          📡 Fuente de música
        </label>
        <div style={{
          padding: '10px 12px', background: 'var(--s2)',
          border: '1px solid var(--border2)', borderRadius: '8px',
          fontSize: '0.85rem', color: client.sourceMode ? 'var(--text)' : 'var(--text2)',
        }}>
          {client.sourceMode === 'radio' && `📡 Radio — ${client.radio || '(sin URL)'}`}
          {client.sourceMode === 'drive' && `☁️ Drive — ${client.musicfolder || '(sin folder)'}`}
          {client.sourceMode === 'local' && '🎵 Local'}
          {!client.sourceMode && 'No configurada — configura desde el Player V4'}
        </div>
      </div>

      {/* Intervalo */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
          Intervalo de anuncios
        </label>
        <select
          value={intervalo}
          onChange={(e) => {
            setIntervalo(e.target.value);
            autoSave('intervalo', Number(e.target.value));
          }}
          style={selectStyle}
        >
          {[1, 3, 5, 10, 15, 20, 30].map((m) => (
            <option key={m} value={m}>{m} min</option>
          ))}
        </select>
      </div>

      {/* Fade */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
          Fade in/out
        </label>
        <select
          value={fade}
          onChange={(e) => {
            setFade(e.target.value);
            autoSave('fade', Number(e.target.value));
          }}
          style={selectStyle}
        >
          {[0, 1, 2, 3, 5].map((s) => (
            <option key={s} value={s}>{s === 0 ? 'Sin fade' : `${s} seg`}</option>
          ))}
        </select>
      </div>

      {/* Player V4 HTML — acceso directo */}
      <button
        onClick={() => window.open(generateLink(client), 'player-v4', 'width=1100,height=750')}
        style={{
          width: '100%', padding: '13px',
          background: 'rgba(167, 139, 250, 0.1)',
          border: '1px solid rgba(167, 139, 250, 0.35)',
          borderRadius: '10px', color: 'var(--accent)',
          fontWeight: 700, fontFamily: 'var(--font-syne)',
          cursor: 'pointer', fontSize: '0.95rem',
        }}
      >
        🎧 Probar Player V4
      </button>
    </div>
  );
}

/* ─── Página principal ─── */
export default function ProgramarPage() {
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('id'));

  useEffect(() => {
    const unsub = fbListen('clients', (data) => {
      setClients((data as Record<string, Client>) ?? {});
    });
    return () => unsub();
  }, []);

  const selectedClient = selectedId ? clients[selectedId] : null;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
          🎵 Programar música
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: '4px', margin: 0 }}>
          Ajusta intervalos y abre el player V4 para configurar la fuente de música
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        {/* Lista de clientes */}
        <div className="glass-panel animate-in" style={{ padding: '16px', maxHeight: '600px', overflow: 'auto' }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '0.9rem', fontWeight: 700 }}>Clientes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(clients).length === 0 ? (
              <p style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>Sin clientes</p>
            ) : (
              Object.entries(clients).map(([id, c]) => (
                <button
                  key={id}
                  onClick={() => setSelectedId(id)}
                  style={{
                    padding: '10px 12px',
                    background: selectedId === id ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                    border: selectedId === id ? '1px solid var(--accent)' : '1px solid var(--border2)',
                    borderRadius: '8px', color: 'var(--text)',
                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                  }}
                  className={selectedId === id ? styles.clientButtonActive : ''}
                >
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{c.emoji || '🏪'} {c.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text2)', marginTop: '2px' }}>
                    {c.sourceMode === 'radio' ? '📡 Radio' : c.sourceMode === 'drive' ? '☁️ Drive' : '⚙️ Sin fuente'}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Panel de configuración */}
        <div className="glass-panel animate-in" style={{ padding: '24px' }}>
          {selectedClient ? (
            <ClientSettings key={selectedId!} client={selectedClient} />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
              <p style={{ fontSize: '1rem', marginBottom: '8px' }}>👈 Selecciona un cliente</p>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>para ajustar sus parámetros y abrir el Player V4</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
