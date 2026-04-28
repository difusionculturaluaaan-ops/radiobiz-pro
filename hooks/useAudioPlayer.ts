import { useEffect, useRef, useState } from 'react';
import { fbListen, fbSet, fbRemove, Client } from '@/lib/db';

export interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  size: number;
}

export function useAudioPlayer(client: Client) {
  const musicRef = useRef<HTMLAudioElement>(null);
  const adRef = useRef<HTMLAudioElement>(null);
  const wakeLockRef = useRef<any>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const adScheduleRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const countdownRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const jingleIndexRef = useRef(0);
  const bootTsRef = useRef(Date.now());

  const [playing, setPlaying] = useState(false);
  const [adPlaying, setAdPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTrack, setCurrentTrack] = useState({ name: 'Sin pista cargada', duration: '0:00' });
  const [progress, setProgress] = useState(0);
  const [nextAdSecs, setNextAdSecs] = useState(0);
  const [jingles, setJingles] = useState<DriveFile[]>([]);

  // Sincronizar jingles desde Google Drive
  const syncJingles = async () => {
    if (!client.folder) return;
    try {
      const res = await fetch(`/api/drive/${client.folder}`);
      const data = await res.json();
      if (data.files) {
        setJingles(data.files);
      }
    } catch (err) {
      console.error('Error syncing jingles:', err);
    }
  };

  // Cargar música según sourceMode
  const loadMusic = async () => {
    if (!musicRef.current) return;

    try {
      if (client.sourceMode === 'radio' && client.radio) {
        musicRef.current.src = client.radio;
        musicRef.current.load();
      } else if (client.sourceMode === 'drive' && client.musicfolder) {
        const res = await fetch(`/api/drive/${client.musicfolder}`);
        const data = await res.json();
        if (data.files && data.files.length > 0) {
          const file = data.files[Math.floor(Math.random() * data.files.length)];
          musicRef.current.src = `/api/drive/stream/${file.id}`;
          musicRef.current.load();
          setCurrentTrack({ name: file.name, duration: '0:00' });
        }
      }
    } catch (err) {
      console.error('Error loading music:', err);
    }
  };

  // Fade out de la música
  const fadeOut = (cb: () => void) => {
    const secs = client.fade ?? 2;
    if (secs === 0 || !musicRef.current) {
      cb();
      return;
    }

    const startVol = musicRef.current.volume;
    const steps = secs * 20;
    const dec = startVol / steps;
    let step = 0;

    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    fadeIntervalRef.current = setInterval(() => {
      step++;
      if (musicRef.current) {
        musicRef.current.volume = Math.max(0, startVol - dec * step);
      }
      if (step >= steps) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        if (musicRef.current) musicRef.current.volume = 0;
        cb();
      }
    }, 50); // 20 fps
  };

  // Fade in de la música
  const fadeIn = () => {
    const secs = client.fade ?? 2;
    const target = volume / 100;

    if (secs === 0 || !musicRef.current) {
      if (musicRef.current) musicRef.current.volume = target;
      return;
    }

    if (musicRef.current) musicRef.current.volume = 0;

    const steps = secs * 20;
    const inc = target / steps;
    let step = 0;

    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    fadeIntervalRef.current = setInterval(() => {
      step++;
      if (musicRef.current) {
        musicRef.current.volume = Math.min(target, inc * step);
      }
      if (step >= steps) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        if (musicRef.current) musicRef.current.volume = target;
      }
    }, 50);
  };

  // Reproducir anuncio
  const playAd = async () => {
    if (jingles.length === 0) {
      scheduleAd();
      return;
    }

    setAdPlaying(true);

    fadeOut(() => {
      if (musicRef.current) {
        musicRef.current.pause();
      }

      const jingle = jingles[jingleIndexRef.current % jingles.length];
      if (adRef.current) {
        adRef.current.src = `/api/drive/stream/${jingle.id}`;
        adRef.current.load();
        adRef.current.play().catch(err => console.error('Error playing ad:', err));
      }

      jingleIndexRef.current = (jingleIndexRef.current + 1) % jingles.length;
    });
  };

  const onAdEnd = () => {
    setAdPlaying(false);
    if (musicRef.current && playing) {
      musicRef.current.play().catch(err => console.error('Error resuming music:', err));
      fadeIn();
    }
    scheduleAd();
  };

  // Programar siguiente anuncio
  const scheduleAd = () => {
    if (adScheduleRef.current) clearInterval(adScheduleRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    const adIntervalMs = (client.intervalo ?? 10) * 60 * 1000;
    const nextAdAt = Date.now() + adIntervalMs;

    adScheduleRef.current = setTimeout(() => {
      playAd();
    }, adIntervalMs);

    // Countdown cada 500ms
    countdownRef.current = setInterval(() => {
      const remaining = Math.max(0, nextAdAt - Date.now());
      setNextAdSecs(Math.ceil(remaining / 1000));
    }, 500);
  };

  // Play/Pause
  const handlePlayPause = () => {
    if (!musicRef.current) return;

    if (playing) {
      musicRef.current.pause();
      setPlaying(false);
      if (adScheduleRef.current) clearInterval(adScheduleRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    } else {
      loadMusic();
      musicRef.current.play().catch(err => console.error('Error playing:', err));
      setPlaying(true);
      scheduleAd();
    }
  };

  // Cambiar volumen
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = volume / 100;
    }
    if (adRef.current) {
      adRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Wake Lock
  useEffect(() => {
    const handleWakeLock = async () => {
      if (playing && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.error('Wake lock error:', err);
        }
      } else {
        if (wakeLockRef.current) {
          wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
      }
    };

    handleWakeLock();
  }, [playing]);

  // Sesión Firebase + Comandos remotos
  useEffect(() => {
    sessionIdRef.current = `s_${client.id}_${Date.now()}`;
    fbSet(`sessions/${sessionIdRef.current}`, {
      clientId: client.id,
      lastPing: Date.now(),
    });

    // Ping cada 90 segundos
    const pingInterval = setInterval(() => {
      if (sessionIdRef.current) {
        fbSet(`sessions/${sessionIdRef.current}`, {
          clientId: client.id,
          lastPing: Date.now(),
        });
      }
    }, 90 * 1000);

    // Listener de comandos remotos
    const unsubCommands = fbListen(`commands/${client.id}`, (cmd: any) => {
      if (!cmd || !cmd.ts || cmd.ts <= bootTsRef.current) return;

      switch (cmd.action) {
        case 'play_pause':
          handlePlayPause();
          break;
        case 'force_ad':
          playAd();
          break;
        case 'set_volume':
          setVolume(cmd.value);
          break;
        case 'sync_drive':
          syncJingles();
          break;
      }

      // Limpiar comando
      fbRemove(`commands/${client.id}`);
    });

    // Listener de bloqueo de cliente
    const unsubBlocked = fbListen(`clients/${client.id}`, (updatedClient: any) => {
      if (updatedClient && updatedClient.blocked && playing) {
        handlePlayPause();
      }
    });

    // Cleanup
    return () => {
      if (sessionIdRef.current) {
        fbRemove(`sessions/${sessionIdRef.current}`);
      }
      clearInterval(pingInterval);
      unsubCommands();
      unsubBlocked();
    };
  }, [client.id]);

  // Sincronizar jingles al montar
  useEffect(() => {
    syncJingles();
  }, [client.folder]);

  // Time update handler
  const handleTimeUpdate = () => {
    if (musicRef.current) {
      const duration = musicRef.current.duration || 0;
      const currentTime = musicRef.current.currentTime || 0;
      setProgress(duration > 0 ? (currentTime / duration) * 100 : 0);
    }
  };

  return {
    musicRef,
    adRef,
    playing,
    adPlaying,
    volume,
    currentTrack,
    progress,
    nextAdSecs,
    jingles,
    setVolume,
    handlePlayPause,
    setProgress,
    handleTimeUpdate,
    onAdEnd,
  };
}
