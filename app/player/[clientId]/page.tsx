'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { fbGet, fbUpdate, fbListen, Client, generateLink } from '@/lib/db';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import PinScreen from '@/components/player/PinScreen';
import PlayerCard from '@/components/player/PlayerCard';
import styles from './player.module.css';

type View = 'setup' | 'player';
type SourceMode = 'drive' | 'radio' | 'local';

interface SetupState {
  sourceMode: SourceMode;
  musicFolder: string;
  radioUrl: string;
  jingleFolder: string;
}

const SOURCE_LABELS: Record<SourceMode, string> = {
  drive: '☁️ Google Drive',
  radio: '📡 Radio Online',
  local: '🎵 Local',
};

/* ── Sub-component: Active Player ── */
function ActivePlayer({ client, onBlocked }: { client: Client; onBlocked: () => void }) {
  const audioPlayer = useAudioPlayer(client);

  useEffect(() => {
    const sessionIdRef = { current: `s_${client.id}_${Date.now()}` };

    // Register session
    (async () => {
      const { fbSet } = await import('@/lib/db');
      await fbSet(`sessions/${sessionIdRef.current}`, {
        clientId: client.id,
        lastPing: Date.now(),
      });
    })();

    // Ping every 90 seconds
    const pingInterval = setInterval(async () => {
      const { fbSet } = await import('@/lib/db');
      if (sessionIdRef.current) {
        await fbSet(`sessions/${sessionIdRef.current}`, {
          clientId: client.id,
          lastPing: Date.now(),
        });
      }
    }, 90 * 1000);

    // Listen for block changes
    const unsubBlocked = fbListen(`clients/${client.id}`, (updatedClient: any) => {
      if (updatedClient && updatedClient.blocked) {
        onBlocked();
      }
    });

    // Cleanup
    return () => {
      clearInterval(pingInterval);
      unsubBlocked();
      (async () => {
        const { fbRemove } = await import('@/lib/db');
        if (sessionIdRef.current) {
          await fbRemove(`sessions/${sessionIdRef.current}`);
        }
      })();
    };
  }, [client, onBlocked]);

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <div style={{ fontSize: '2rem' }}>{client.emoji || '🏪'}</div>
          <h1 className={styles.clientName}>{client.name}</h1>
          <p className={styles.subtitle}>Gestionado por RadioBiz Pro</p>
        </div>

        {/* Player Card */}
        <PlayerCard
          playing={audioPlayer.playing}
          onPlayPause={audioPlayer.handlePlayPause}
          currentTrack={audioPlayer.currentTrack}
          progress={audioPlayer.progress}
          onProgressChange={audioPlayer.setProgress}
          volume={audioPlayer.volume}
          onVolumeChange={audioPlayer.setVolume}
          nextAdSecs={audioPlayer.nextAdSecs}
        />

        {/* Audio elements */}
        <audio ref={audioPlayer.musicRef} onTimeUpdate={audioPlayer.handleTimeUpdate} crossOrigin="anonymous" />
        <audio ref={audioPlayer.adRef} onEnded={audioPlayer.onAdEnd} crossOrigin="anonymous" />

        <p style={{ fontSize: '0.7rem', color: 'var(--text2)', textAlign: 'center' }}>
          Powered by RadioBiz Pro
        </p>
      </div>
    </div>
  );
}

export default function PlayerPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pinAuthenticated, setPinAuthenticated] = useState(false);
  const [view, setView] = useState<View>('setup');

  const [setup, setSetup] = useState<SetupState>({ sourceMode: 'drive', musicFolder: '', radioUrl: '', jingleFolder: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Audio test state
  const [testPlaying, setTestPlaying] = useState(false);
  const [testError, setTestError] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  /* ── Load client ── */
  useEffect(() => {
    const load = async () => {
      try {
        const c = (await fbGet(`clients/${clientId}`)) as Client | null;
        if (!c) { setError('Cliente no encontrado'); return; }
        if (c.blocked) { setError('Servicio suspendido. Contacta a RadioBiz Pro.'); return; }
        setClient(c);
        setSetup({
          sourceMode: c.sourceMode || 'drive',
          musicFolder: c.musicfolder || '',
          radioUrl: c.radio || '',
          jingleFolder: c.folder || '',
        });
        if (c.sourceMode) {
          setView('player');
        }
      } catch {
        setError('Error cargando cliente. Verifica tu conexión.');
      } finally {
        setLoading(false);
      }
    };
    if (clientId) load();
  }, [clientId]);

  /* ── Helpers ── */
  const handlePinSubmit = (pin: string) => {
    if (client && pin === client.pin) setPinAuthenticated(true);
  };

  const handleTestAudio = () => {
    if (!audioRef.current) return;
    setTestError('');
    if (setup.sourceMode === 'radio' && setup.radioUrl) {
      if (testPlaying) {
        audioRef.current.pause();
        setTestPlaying(false);
        return;
      }
      audioRef.current.src = setup.radioUrl;
      audioRef.current.volume = 0.8;
      audioRef.current.play()
        .then(() => setTestPlaying(true))
        .catch(() => {
          setTestError('No se pudo reproducir. Verifica la URL.');
          setTestPlaying(false);
        });
    } else if (setup.sourceMode === 'drive') {
      setTestError('El folder de Drive se cargará al iniciar el player del cliente.');
    } else {
      setTestError('Fuente local: los archivos se cargarán en el player.');
    }
  };

  const handleSave = async () => {
    if (!client) return;
    if (setup.sourceMode === 'drive' && !setup.musicFolder.trim()) {
      setSaveError('Ingresa el Folder ID de Google Drive');
      return;
    }
    if (setup.sourceMode === 'radio' && !setup.radioUrl.trim()) {
      setSaveError('Ingresa la URL del stream de radio');
      return;
    }
    setSaveError('');
    if (!setup.jingleFolder.trim()) {
      setSaveError('Ingresa el Folder ID de spots/jingles');
      return;
    }
    setIsSaving(true);
    try {
      await fbUpdate(`clients/${clientId}`, {
        sourceMode: setup.sourceMode,
        folder: setup.jingleFolder.trim(),
        musicfolder: setup.sourceMode === 'drive' ? setup.musicFolder.trim() : null,
        radio: setup.sourceMode === 'radio' ? setup.radioUrl.trim() : null,
      });
      setClient(prev => prev ? {
        ...prev,
        sourceMode: setup.sourceMode,
        folder: setup.jingleFolder,
        musicfolder: setup.musicFolder,
        radio: setup.radioUrl,
      } : prev);
      if (audioRef.current) { audioRef.current.pause(); }
      setTestPlaying(false);
      setView('player');
    } catch {
      setSaveError('Error al guardar. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  /** URL del player-pro-v4.html con los params actuales del formulario */
  const getV4Url = () => {
    if (!client) return '';
    const merged: Client = {
      ...client,
      folder: setup.jingleFolder || client.folder,
      sourceMode: setup.sourceMode,
      musicfolder: setup.musicFolder || client.musicfolder,
      radio: setup.radioUrl || client.radio,
    };
    return generateLink(merged);
  };

  const handleShareWA = () => {
    if (!client) return;
    const link = getV4Url();
    const msg = encodeURIComponent(
      `🎵 *RadioBiz Pro* — ¡Tu reproductor está listo!\n\n` +
      `*Negocio:* ${client.name} ${client.emoji ?? ''}\n\n` +
      `👆 Abre este link:\n${link}\n\n` +
      `📌 PIN: *${client.pin}*\n\n` +
      `_Powered by RadioBiz Pro_`
    );
    window.open('https://wa.me/?text=' + msg, '_blank');
  };

  /* ── Screens ── */
  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner} />
      <p>Cargando reproductor...</p>
    </div>
  );

  if (error) return (
    <div className={styles.errorContainer}>
      <div className={styles.errorModal}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚫</div>
        <h1 style={{ marginBottom: '8px' }}>Acceso no disponible</h1>
        <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>{error}</p>
        <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Powered by RadioBiz Pro</p>
      </div>
    </div>
  );

  if (!pinAuthenticated) return <PinScreen pin={client!.pin} onSubmit={handlePinSubmit} />;

  /* ── Vista A: Setup de fuente ── */
  if (view === 'setup') {
    const inputStyle: React.CSSProperties = {
      width: '100%', padding: '12px 14px',
      background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border2)',
      borderRadius: '10px', color: 'var(--text)',
      fontFamily: 'var(--font-jetbrains-mono)', fontSize: '0.85rem',
      boxSizing: 'border-box', outline: 'none',
    };

    return (
      <div className={styles.container}>
        <div className={styles.main}>
          {/* Header */}
          <div className={styles.header}>
            <div style={{ fontSize: '2rem' }}>{client!.emoji || '🏪'}</div>
            <h1 className={styles.clientName}>{client!.name}</h1>
            <p className={styles.subtitle}>Configura la fuente de música</p>
          </div>

          {/* Setup card */}
          <div className={`${styles.setupCard} glass-panel`}>
            <h3 className={styles.setupTitle}>🎵 Fuente de música</h3>

            {/* Source mode tabs */}
            <div className={styles.sourceTabs}>
              {(['drive', 'radio', 'local'] as SourceMode[]).map((mode) => (
                <button
                  key={mode}
                  className={`${styles.sourceTab} ${setup.sourceMode === mode ? styles.sourceTabActive : ''}`}
                  onClick={() => {
                    setTestError('');
                    if (audioRef.current) { audioRef.current.pause(); }
                    setTestPlaying(false);
                    setSetup(prev => ({ ...prev, sourceMode: mode }));
                  }}
                >
                  {SOURCE_LABELS[mode]}
                </button>
              ))}
            </div>

            {/* Spots / Jingles folder — siempre editable */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>🎵 Folder ID de spots / jingles</label>
              <input
                type="text"
                value={setup.jingleFolder}
                onChange={e => setSetup(prev => ({ ...prev, jingleFolder: e.target.value }))}
                placeholder="1aBcDeFgHiJkLmNoPqRs..."
                style={inputStyle}
              />
              <p className={styles.inputHint}>Cambia el folder para alternar entre campañas de marketing.</p>
            </div>

            {/* Input según modo de música */}
            {setup.sourceMode === 'drive' && (
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>📁 Folder ID de Google Drive</label>
                <input
                  type="text"
                  value={setup.musicFolder}
                  onChange={e => setSetup(prev => ({ ...prev, musicFolder: e.target.value }))}
                  placeholder="1aBcDeFgHiJkLmNoPqRs..."
                  style={inputStyle}
                />
                <p className={styles.inputHint}>El ID se encuentra en la URL de la carpeta de Drive.</p>
              </div>
            )}

            {setup.sourceMode === 'radio' && (
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>📡 URL del stream de radio</label>
                <input
                  type="text"
                  value={setup.radioUrl}
                  onChange={e => {
                    setTestError('');
                    setSetup(prev => ({ ...prev, radioUrl: e.target.value }));
                  }}
                  placeholder="https://ice.somafm.com/groovesalad-128-mp3"
                  style={inputStyle}
                />
                <p className={styles.inputHint}>Acepta streams MP3, AAC u otros formatos de audio.</p>
              </div>
            )}

            {setup.sourceMode === 'local' && (
              <div className={styles.inputGroup}>
                <p className={styles.inputHint} style={{ textAlign: 'center', padding: '20px 0' }}>
                  🎵 El reproductor cargará los archivos MP3 localmente.<br/>
                  No se requiere configuración adicional.
                </p>
              </div>
            )}

            {/* Test audio */}
            {setup.sourceMode === 'radio' && (
              <button
                onClick={handleTestAudio}
                className={`${styles.testBtn} ${testPlaying ? styles.testBtnPlaying : ''}`}
              >
                {testPlaying ? '⏹ Detener prueba' : '▶ Probar stream'}
              </button>
            )}
            {testError && <p className={styles.testError}>{testError}</p>}

            <audio ref={audioRef} onEnded={() => setTestPlaying(false)} />

            {/* Probar en Player V4 */}
            <button
              onClick={() => window.open(getV4Url(), 'player-v4', 'width=1100,height=750')}
              className={styles.v4Btn}
            >
              🎧 Probar en Player V4
            </button>

            {/* Divider */}
            <div className={styles.divider} />

            {/* Save */}
            {saveError && <p className={styles.testError}>{saveError}</p>}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={styles.saveBtn}
            >
              {isSaving ? '⏳ Guardando...' : '💾 Guardar fuente'}
            </button>
          </div>

          <p style={{ fontSize: '0.7rem', color: 'var(--text2)', textAlign: 'center' }}>
            Powered by RadioBiz Pro
          </p>
        </div>
      </div>
    );
  }

  /* ── Vista B: Player activo ── */
  if (view === 'player' && client && pinAuthenticated) {
    return <ActivePlayer client={client} onBlocked={() => { setError('Servicio suspendido. Contacta a RadioBiz Pro.'); setPinAuthenticated(false); }} />;
  }

  /* ── Setup view fallback ── */
  const sourceLabel = client?.sourceMode ? SOURCE_LABELS[client.sourceMode] : '—';
  const sourceDetail = client?.sourceMode === 'radio'
    ? client.radio
    : client?.sourceMode === 'drive'
      ? client.musicfolder
      : 'Archivos locales';

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <div style={{ fontSize: '2rem' }}>{client!.emoji || '🏪'}</div>
          <h1 className={styles.clientName}>{client!.name}</h1>
          <p className={styles.subtitle}>Gestionado por RadioBiz Pro</p>
        </div>

        {/* Info card */}
        <div className={`${styles.setupCard} glass-panel`} style={{ width: '100%' }}>
          <div className={styles.savedBadge}>✅ Fuente guardada</div>

          <div className={styles.sourceInfo}>
            <div className={styles.sourceInfoLabel}>Fuente de música</div>
            <div className={styles.sourceInfoValue}>{sourceLabel}</div>
            {sourceDetail && (
              <div className={styles.sourceInfoDetail}>{sourceDetail}</div>
            )}
          </div>

          <div className={styles.sourceInfo} style={{ marginTop: '12px' }}>
            <div className={styles.sourceInfoLabel}>Spots / Jingles</div>
            <div className={styles.sourceInfoDetail}>{client!.folder || '—'}</div>
          </div>

          <div className={styles.divider} />

          {/* Player V4 */}
          <button
            onClick={() => window.open(getV4Url(), 'player-v4', 'width=1100,height=750')}
            className={styles.v4Btn}
          >
            🎧 Abrir Player V4
          </button>

          {/* WA Share */}
          <button onClick={handleShareWA} className={styles.waBtn}>
            💬 Compartir por WhatsApp
          </button>

          {/* Change source */}
          <button
            onClick={() => setView('setup')}
            className={styles.changeSourceBtn}
          >
            ⚙️ Cambiar fuente de música
          </button>
        </div>

        <p style={{ fontSize: '0.7rem', color: 'var(--text2)', textAlign: 'center' }}>
          Powered by RadioBiz Pro
        </p>
      </div>
    </div>
  );
}
