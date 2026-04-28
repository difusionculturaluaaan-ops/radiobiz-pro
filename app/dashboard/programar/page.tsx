'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { fbListen, fbUpdate, generateLink, Client } from '@/lib/db';
import styles from './programar.module.css';

export default function ProgramarPage() {
  const searchParams = useSearchParams();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [clients, setClients] = useState<Record<string, Client>>({});
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('id'));
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Player state
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(80);

  // Form state
  const [sourceMode, setSourceMode] = useState<'drive' | 'radio' | 'local'>('drive');
  const [musicFolder, setMusicFolder] = useState('');
  const [radioUrl, setRadioUrl] = useState('');
  const [jingleFolder, setJingleFolder] = useState('');
  const [intervalo, setIntervalo] = useState('10');
  const [fade, setFade] = useState('2');

  useEffect(() => {
    const unsub = fbListen('clients', (data) => {
      setClients((data as Record<string, Client>) ?? {});
    });
    return () => unsub();
  }, []);

  const showToast = useCallback((msg: string, type = '') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const selectedClient = selectedId ? clients[selectedId] : null;

  // Load selected client data
  useEffect(() => {
    if (selectedClient) {
      setSourceMode((selectedClient.sourceMode as 'drive' | 'radio' | 'local') || 'drive');
      setMusicFolder(selectedClient.musicfolder || '');
      setRadioUrl(selectedClient.radio || '');
      setJingleFolder(selectedClient.folder || '');
      setIntervalo(String(selectedClient.intervalo || 10));
      setFade(String(selectedClient.fade || 2));
      setGeneratedLink(null);
    }
  }, [selectedClient]);

  const handleSave = async () => {
    if (!selectedClient) return;

    // Validation
    if (!jingleFolder) {
      showToast('Folder ID de jingles es requerido', 'error');
      return;
    }
    if (sourceMode === 'drive' && !musicFolder) {
      showToast('Folder ID de música es requerido', 'error');
      return;
    }
    if (sourceMode === 'radio' && !radioUrl) {
      showToast('URL de radio es requerida', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const config = {
        sourceMode,
        musicfolder: sourceMode === 'drive' ? musicFolder : null,
        radio: sourceMode === 'radio' ? radioUrl : null,
        folder: jingleFolder,
        intervalo: Number(intervalo),
        fade: Number(fade),
        shortUrl: null, // Clear to regenerate
      };

      await fbUpdate(`clients/${selectedClient.id}`, config);
      showToast('✅ Programación guardada', 'success');

      // Generate new link
      const updatedClient = { ...selectedClient, ...config } as Client;
      const link = generateLink(updatedClient);
      setGeneratedLink(link);
    } catch (err) {
      showToast('❌ Error al guardar', 'error');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink).then(() => {
        showToast('📋 Link copiado', 'success');
      });
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        showToast('❌ Error al reproducir: ' + err.message, 'error');
        setPlaying(false);
      });
      setPlaying(true);
    }
  };

  const handleLoadMusic = async () => {
    if (!audioRef.current) return;

    try {
      if (sourceMode === 'radio' && radioUrl) {
        audioRef.current.src = radioUrl;
        audioRef.current.load();
        setPlaying(false);
        showToast('📡 Radio cargada', 'success');
      } else if (sourceMode === 'drive' && musicFolder) {
        showToast('☁️ Cargando desde Drive... (requiere API)', 'info');
      } else if (sourceMode === 'local') {
        showToast('📁 Local MP3 (requiere archivo)', 'info');
      } else {
        showToast('⚠️ Configura una fuente de audio primero', 'error');
      }
    } catch (err) {
      showToast('❌ Error: ' + (err as Error).message, 'error');
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
          🎵 Programar música
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: '4px', margin: 0 }}>
          Configura la fuente de música para cada cliente
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        {/* Clients List */}
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
                    borderRadius: '8px',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                  className={selectedId === id ? styles.clientButtonActive : ''}
                >
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {c.emoji || '🏪'} {c.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text2)', marginTop: '2px' }}>
                    {c.sourceMode === 'radio' ? '📡 Radio' : c.sourceMode === 'drive' ? '☁️ Drive' : '🎵 Local'}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="glass-panel animate-in" style={{ padding: '24px', delay: '0.1s' }}>
          {selectedClient ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                {selectedClient.emoji || '🏪'} {selectedClient.name}
              </h2>

              {/* Source Mode */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                  Fuente de música
                </label>
                <select
                  value={sourceMode}
                  onChange={(e) => {
                    setSourceMode(e.target.value as 'drive' | 'radio' | 'local');
                    setMusicFolder('');
                    setRadioUrl('');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--s2)',
                    border: '1px solid var(--border2)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <option value="drive">Google Drive</option>
                  <option value="radio">Radio Online</option>
                  <option value="local">Local MP3</option>
                </select>
              </div>

              {/* Drive Music Folder */}
              {sourceMode === 'drive' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                    📁 Folder ID de música Drive
                  </label>
                  <input
                    type="text"
                    value={musicFolder}
                    onChange={(e) => setMusicFolder(e.target.value)}
                    placeholder="1aBcDeFgHiJkLmNoPqRs..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--s2)',
                      border: '1px solid var(--border2)',
                      borderRadius: '8px',
                      color: 'var(--text)',
                      fontFamily: 'var(--font-jetbrains-mono)',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Radio URL */}
              {sourceMode === 'radio' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                    📡 URL del stream de radio
                  </label>
                  <input
                    type="text"
                    value={radioUrl}
                    onChange={(e) => setRadioUrl(e.target.value)}
                    placeholder="https://ice.somafm.com/..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--s2)',
                      border: '1px solid var(--border2)',
                      borderRadius: '8px',
                      color: 'var(--text)',
                      fontFamily: 'var(--font-jetbrains-mono)',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Jingles Folder */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                  🎵 Folder ID de jingles Drive
                </label>
                <input
                  type="text"
                  value={jingleFolder}
                  onChange={(e) => setJingleFolder(e.target.value)}
                  placeholder="1aBcDeFgHiJkLmNoPqRs..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--s2)',
                    border: '1px solid var(--border2)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-jetbrains-mono)',
                    fontSize: '0.8rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Intervalo and Fade */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                    Intervalo anuncios
                  </label>
                  <select
                    value={intervalo}
                    onChange={(e) => setIntervalo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--s2)',
                      border: '1px solid var(--border2)',
                      borderRadius: '8px',
                      color: 'var(--text)',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    {[1, 3, 5, 10, 15, 20, 30].map((m) => (
                      <option key={m} value={m}>
                        {m} min
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                    Fade in/out
                  </label>
                  <select
                    value={fade}
                    onChange={(e) => setFade(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--s2)',
                      border: '1px solid var(--border2)',
                      borderRadius: '8px',
                      color: 'var(--text)',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    {[0, 1, 2, 3, 5].map((s) => (
                      <option key={s} value={s}>
                        {s === 0 ? 'Sin fade' : s + ' seg'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Player Test Section */}
              <div style={{ background: 'rgba(167, 139, 250, 0.05)', border: '1px solid rgba(167, 139, 250, 0.2)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>🎧 Prueba la fuente de audio</div>

                {/* Load Button */}
                <button
                  onClick={handleLoadMusic}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--s2)',
                    border: '1px solid var(--border2)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginBottom: '12px',
                  }}
                >
                  📂 Cargar fuente {sourceMode === 'radio' ? '📡' : sourceMode === 'drive' ? '☁️' : '🎵'}
                </button>

                {/* Player Controls */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                  <button
                    onClick={handlePlayPause}
                    style={{
                      padding: '8px 16px',
                      background: playing ? 'rgba(244, 63, 94, 0.2)' : 'rgba(52, 211, 153, 0.2)',
                      border: `1px solid ${playing ? 'rgba(244, 63, 94, 0.4)' : 'rgba(52, 211, 153, 0.4)'}`,
                      borderRadius: '6px',
                      color: playing ? 'var(--red)' : 'var(--green)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      flex: 1,
                    }}
                  >
                    {playing ? '⏸ Pausar' : '▶ Reproducir'}
                  </button>
                </div>

                {/* Volume Control */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem' }}>🔊</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    style={{ flex: 1, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text2)', minWidth: '30px' }}>{volume}%</span>
                </div>

                {/* Hidden Audio Element */}
                <audio ref={audioRef} crossOrigin="anonymous" />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  padding: '12px 24px',
                  background: isSaving ? 'rgba(167, 139, 250, 0.5)' : 'linear-gradient(135deg, var(--accent), #7c3aed)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: 700,
                  fontFamily: 'var(--font-syne)',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? '⏳ Guardando...' : '💾 Guardar programación'}
              </button>

              {/* Generated Link */}
              {generatedLink && (
                <div style={{ background: 'rgba(240, 192, 64, 0.1)', border: '1px solid rgba(240, 192, 64, 0.3)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginBottom: '8px' }}>Link del cliente:</div>
                  <div
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono)',
                      fontSize: '0.75rem',
                      color: 'var(--accent)',
                      wordBreak: 'break-all',
                      marginBottom: '12px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '8px',
                      borderRadius: '6px',
                    }}
                  >
                    {generatedLink}
                  </div>
                  <button
                    onClick={copyLink}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--accent)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-syne)',
                    }}
                  >
                    📋 Copiar link
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
              <p style={{ fontSize: '1rem', marginBottom: '8px' }}>👈 Selecciona un cliente</p>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>para configurar su música y spots</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '12px 16px',
            background: toast.type === 'error' ? 'rgba(244, 63, 94, 0.9)' : 'rgba(52, 211, 153, 0.9)',
            color: 'white',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
