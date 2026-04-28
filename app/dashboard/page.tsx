'use client';

import { useEffect, useState } from 'react';
import { fbListen, Client } from '@/lib/db';

export default function DashboardPage() {
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [sessions, setSessions] = useState<Record<string, { clientId: string; lastPing: number }>>({});

  useEffect(() => {
    const unsubClients = fbListen('clients', (data) => {
      setClients((data as Record<string, Client>) ?? {});
    });
    return () => unsubClients();
  }, []);

  useEffect(() => {
    const unsubSessions = fbListen('sessions', (data) => {
      setSessions((data as Record<string, { clientId: string; lastPing: number }>) ?? {});
    });
    return () => unsubSessions();
  }, []);

  const totalClients = Object.keys(clients).length;
  const connectedClients = Object.keys(sessions).length;
  const clientsWithJingles = Object.values(clients).filter((c) => c.folder).length;
  const clientsWithLinks = Object.values(clients).filter((c) => c.shortUrl).length;

  const stats = [
    { icon: '🏢', label: 'Clientes', value: totalClients, color: 'var(--accent)' },
    { icon: '🟢', label: 'Conectados ahora', value: connectedClients, color: 'var(--green)' },
    { icon: '🎙️', label: 'Jingles activos', value: clientsWithJingles, color: 'var(--accent2)' },
    { icon: '🔗', label: 'Links generados', value: clientsWithLinks, color: 'var(--info)' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800 }}>
          Bienvenido 👋
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: '4px' }}>
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Live overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {stats.map((card) => (
          <div key={card.label} className="glass-panel animate-in" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{card.icon}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-syne)', color: card.color }}>
              {card.value}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginTop: '4px', fontFamily: 'var(--font-jetbrains-mono)' }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
