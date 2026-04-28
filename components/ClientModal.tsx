'use client';

import { useState, useEffect } from 'react';
import { Client } from '@/lib/db';
import styles from './ClientModal.module.css';

interface Props {
  client: Client | null;
  onSave: (data: Partial<Client>) => void;
  onClose: () => void;
}

const RADIO_PRESETS = [
  { label: 'SomaFM Groove Salad', url: 'https://somafm.com/groovesalad256.pls' },
  { label: 'SomaFM Drone Zone', url: 'https://somafm.com/dronezone256.pls' },
  { label: 'SomaFM Indie Pop', url: 'https://somafm.com/indiepop.pls' },
];

export default function ClientModal({ client, onSave, onClose }: Props) {
  const isEditing = client !== null;

  const [name, setName] = useState('');
  const [folder, setFolder] = useState('');
  const [pin, setPin] = useState('1234');
  const [intervalo, setIntervalo] = useState('10');
  const [fade, setFade] = useState('2');
  const [emoji, setEmoji] = useState('🏪');
  const [sourceMode, setSourceMode] = useState<'radio' | 'drive' | 'local'>('radio');
  const [radio, setRadio] = useState('');
  const [musicfolder, setMusicfolder] = useState('');

  useEffect(() => {
    if (client) {
      setName(client.name);
      setFolder(client.folder);
      setPin(client.pin);
      setIntervalo(String(client.intervalo));
      setFade(String(client.fade ?? 2));
      setEmoji(client.emoji ?? '🏪');
      setSourceMode(client.sourceMode ?? 'radio');
      setRadio(client.radio ?? '');
      setMusicfolder(client.musicfolder ?? '');
    }
  }, [client]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const match = folder.match(/folders\/([a-zA-Z0-9_-]+)/);
    const cleanFolder = match ? match[1] : folder.trim();
    onSave({ name: name.trim(), folder: cleanFolder, pin, intervalo: Number(intervalo), fade: Number(fade), emoji, sourceMode, radio: sourceMode === 'radio' ? radio : undefined, musicfolder: sourceMode === 'drive' ? musicfolder : undefined });
  }

  return (
    <div className={styles.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} glass-panel`}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2>{isEditing ? `✏️ Editar: ${client.name}` : '➕ Nuevo cliente'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            {/* Nombre */}
            <div className={`${styles.field} ${styles.full}`}>
              <label>Nombre del negocio</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Cafetería El Sol" required />
            </div>

            {/* Emoji */}
            <div className={styles.field}>
              <label>Emoji</label>
              <input value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="🏪" />
            </div>

            {/* PIN */}
            <div className={styles.field}>
              <label>PIN (4 dígitos)</label>
              <input value={pin} onChange={e => setPin(e.target.value)} placeholder="1234" maxLength={4} pattern="\d{4}" />
            </div>

            {/* Intervalo */}
            <div className={styles.field}>
              <label>Intervalo anuncios (min)</label>
              <input type="number" value={intervalo} onChange={e => setIntervalo(e.target.value)} min={1} max={120} />
            </div>

            {/* Fade */}
            <div className={styles.field}>
              <label>Fade (seg)</label>
              <input type="number" value={fade} onChange={e => setFade(e.target.value)} min={0} max={10} />
            </div>

            {/* Folder Drive */}
            <div className={`${styles.field} ${styles.full}`}>
              <label>Folder ID de Google Drive (anuncios)</label>
              <input value={folder} onChange={e => setFolder(e.target.value)} placeholder="ID o URL de la carpeta" />
            </div>

            {/* Source Mode */}
            <div className={`${styles.field} ${styles.full}`}>
              <label>Fuente de música</label>
              <select value={sourceMode} onChange={e => setSourceMode(e.target.value as typeof sourceMode)}>
                <option value="radio">📻 Radio en línea</option>
                <option value="drive">☁️ Google Drive</option>
                <option value="local">📁 MP3 locales</option>
              </select>
            </div>

            {/* Radio URL */}
            {sourceMode === 'radio' && (
              <div className={`${styles.field} ${styles.full}`}>
                <label>URL de la radio</label>
                <input value={radio} onChange={e => setRadio(e.target.value)} placeholder="https://..." />
                <div className={styles.presets}>
                  {RADIO_PRESETS.map(p => (
                    <button type="button" key={p.url} className={styles.preset} onClick={() => setRadio(p.url)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Music Folder */}
            {sourceMode === 'drive' && (
              <div className={`${styles.field} ${styles.full}`}>
                <label>Folder ID Música (Drive)</label>
                <input value={musicfolder} onChange={e => setMusicfolder(e.target.value)} placeholder="ID de la carpeta de música" />
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <button type="button" className="btn secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn primary">
              {isEditing ? '💾 Actualizar' : '💾 Guardar y crear link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
