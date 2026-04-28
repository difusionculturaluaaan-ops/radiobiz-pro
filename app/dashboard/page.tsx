export default function DashboardPage() {
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

      {/* Placeholder overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { icon: '🏢', label: 'Clientes', value: '—', color: 'var(--accent)' },
          { icon: '🟢', label: 'Conectados ahora', value: '—', color: 'var(--green)' },
          { icon: '🎙️', label: 'Jingles activos', value: '—', color: 'var(--accent2)' },
          { icon: '🔗', label: 'Links generados', value: '—', color: 'var(--info)' },
        ].map((card) => (
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
