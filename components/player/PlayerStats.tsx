'use client';

interface PlayerStatsProps {
  spotCount: number;
  currentSourceMode: 'radio' | 'drive' | 'local';
  onSourceChange: (mode: 'radio' | 'drive' | 'local') => void;
  onLocalFilesSelect: (files: FileList) => void;
  hasRadio?: boolean;
  hasDrive?: boolean;
}

export default function PlayerStats({
  spotCount,
  currentSourceMode,
  onSourceChange,
  onLocalFilesSelect,
  hasRadio = false,
  hasDrive = false,
}: PlayerStatsProps) {
  const fileInputId = 'local-audio-input';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}
      >
        <div
          style={{
            background: 'rgba(52, 211, 153, 0.08)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '10px',
            padding: '12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green)' }}>{spotCount}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text2)', marginTop: '4px' }}>Spots hoy</div>
        </div>
        <div
          style={{
            background: 'rgba(167, 139, 250, 0.08)',
            border: '1px solid rgba(167, 139, 250, 0.3)',
            borderRadius: '10px',
            padding: '12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)' }}>
            {currentSourceMode === 'radio' && '📡'}
            {currentSourceMode === 'drive' && '☁️'}
            {currentSourceMode === 'local' && '🎵'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text2)', marginTop: '4px' }}>
            {currentSourceMode === 'radio' && 'Radio'}
            {currentSourceMode === 'drive' && 'Drive'}
            {currentSourceMode === 'local' && 'Local'}
          </div>
        </div>
      </div>

      {/* Source selector */}
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text2)' }}>
          🎵 Fuente de música
        </label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {hasRadio && (
            <button
              onClick={() => onSourceChange('radio')}
              style={{
                flex: 1,
                padding: '8px 10px',
                background: currentSourceMode === 'radio' ? 'var(--accent)' : 'var(--s2)',
                color: currentSourceMode === 'radio' ? '#fff' : 'var(--text)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              📡 Radio
            </button>
          )}
          {hasDrive && (
            <button
              onClick={() => onSourceChange('drive')}
              style={{
                flex: 1,
                padding: '8px 10px',
                background: currentSourceMode === 'drive' ? 'var(--accent)' : 'var(--s2)',
                color: currentSourceMode === 'drive' ? '#fff' : 'var(--text)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              ☁️ Drive
            </button>
          )}
          <button
            onClick={() => onSourceChange('local')}
            style={{
              flex: 1,
              padding: '8px 10px',
              background: currentSourceMode === 'local' ? 'var(--accent)' : 'var(--s2)',
              color: currentSourceMode === 'local' ? '#fff' : 'var(--text)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🎵 Local
          </button>
        </div>
      </div>

      {/* Local files uploader */}
      {currentSourceMode === 'local' && (
        <div
          style={{
            background: 'rgba(34, 211, 238, 0.08)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            borderRadius: '10px',
            padding: '12px',
          }}
        >
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--accent2)' }}>
            Carga tu música
          </label>
          <button
            onClick={() => document.getElementById(fileInputId)?.click()}
            style={{
              width: '100%',
              padding: '10px',
              background: 'var(--accent2)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            + Agregar archivos
          </button>
          <input
            id={fileInputId}
            type="file"
            accept="audio/*"
            multiple
            onChange={(e) => e.target.files && onLocalFilesSelect(e.target.files)}
            style={{ display: 'none' }}
          />
          {/* TODO: Mostrar lista de archivos cargados */}
        </div>
      )}
    </div>
  );
}
