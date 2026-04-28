'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './PlayerCard.module.css';

interface PlayerCardProps {
  playing: boolean;
  onPlayPause: () => void;
  currentTrack?: { name: string; duration: string };
  progress: number;
  onProgressChange: (value: number) => void;
  volume: number;
  onVolumeChange: (value: number) => void;
}

export default function PlayerCard({
  playing,
  onPlayPause,
  currentTrack,
  progress,
  onProgressChange,
  volume,
  onVolumeChange,
}: PlayerCardProps) {
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    setIsRotating(playing);
  }, [playing]);

  return (
    <div className={`glass-panel animate-in ${styles.card}`}>
      {/* Header */}
      <div className={styles.header}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>▶ REPRODUCIENDO AHORA</span>
      </div>

      {/* Vinyl Disc */}
      <div className={`${styles.vinyl} ${isRotating ? styles.spinning : ''}`}>
        <div className={styles.vinylLabel}>♫</div>
        <div className={styles.vinylCenter} />
      </div>

      {/* Track Info */}
      <div className={styles.trackInfo}>
        <h2 className={styles.trackName}>{currentTrack?.name || 'Sin pista cargada'}</h2>
        <p className={styles.trackSub}>Selecciona una fuente</p>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        <span className={styles.timeCode}>0:00</span>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => onProgressChange(Number(e.target.value))}
          className={styles.progressBar}
        />
        <span className={styles.timeCode}>{currentTrack?.duration || '0:00'}</span>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <button className={styles.controlBtn} title="Anterior">
          ⏮
        </button>
        <button className={`${styles.playBtn} ${playing ? styles.playing : ''}`} onClick={onPlayPause}>
          {playing ? '⏸' : '▶'}
        </button>
        <button className={styles.controlBtn} title="Siguiente">
          ⏭
        </button>
      </div>

      {/* Volume Control */}
      <div className={styles.volumeContainer}>
        <span style={{ fontSize: '0.8rem' }}>🔊</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className={styles.volumeSlider}
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>{volume}%</span>
      </div>

      {/* Next Spot Info */}
      <div className={styles.nextSpot}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text2)' }}>📢 PRÓXIMO ANUNCIO</div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>00:32 seg</div>
      </div>
    </div>
  );
}
