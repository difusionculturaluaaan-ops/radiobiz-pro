'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { fbGet, fbListen, Client } from '@/lib/db';
import PinScreen from '@/components/player/PinScreen';
import PlayerCard from '@/components/player/PlayerCard';
import styles from './player.module.css';

export default function PlayerPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pinAuthenticated, setPinAuthenticated] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch client on mount
  useEffect(() => {
    const loadClient = async () => {
      try {
        const c = (await fbGet(`clients/${clientId}`)) as Client | null;
        if (!c) {
          setError('Cliente no encontrado');
          return;
        }
        if (c.blocked) {
          setError('Servicio suspendido. Contacta a RadioBiz.');
          return;
        }
        setClient(c);
      } catch (err) {
        setError('Error cargando cliente');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  // Handle PIN submission
  const handlePinSubmit = (enteredPin: string) => {
    if (client && enteredPin === client.pin) {
      setPinAuthenticated(true);
    }
  };

  // Play/Pause handler
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((err) => {
          console.error('Playback error:', err);
        });
      }
      setPlaying(!playing);
    }
  };

  // Error screen
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorModal}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚫</div>
          <h1 style={{ marginBottom: '8px' }}>Acceso no disponible</h1>
          <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>{error}</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Powered by RadioBiz Pro</p>
        </div>
      </div>
    );
  }

  // Loading screen
  if (loading || !client) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Cargando reproductor...</p>
      </div>
    );
  }

  // PIN Screen
  if (!pinAuthenticated) {
    return <PinScreen pin={client.pin} onSubmit={handlePinSubmit} />;
  }

  // Player Screen
  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div className={styles.header}>
          <div style={{ fontSize: '1rem' }}>{client.emoji || '🏪'}</div>
          <h1 className={styles.clientName}>{client.name}</h1>
          <p className={styles.subtitle}>Gestionado por RadioBiz</p>
        </div>

        <PlayerCard
          playing={playing}
          onPlayPause={handlePlayPause}
          currentTrack={{
            name: 'Selecciona una fuente',
            duration: '0:00',
          }}
          progress={progress}
          onProgressChange={setProgress}
          volume={volume}
          onVolumeChange={setVolume}
        />

        {/* Hidden Audio Elements */}
        <audio ref={audioRef} crossOrigin="anonymous" />
      </div>
    </div>
  );
}
