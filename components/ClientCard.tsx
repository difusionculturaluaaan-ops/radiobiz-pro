'use client';

import { Client, generateLink } from '@/lib/db';
import styles from './ClientCard.module.css';

interface Props {
  client: Client;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggleBlock: () => void;
  onCopyLink: () => void;
  onShareWA: () => void;
}

export default function ClientCard({ client: c, index, onEdit, onDelete, onToggleBlock, onCopyLink, onShareWA }: Props) {
  const isBlocked = c.blocked === true;
  const displayLink = c.shortUrl ?? generateLink(c);

  return (
    <div
      className={`${styles.card} glass-panel animate-in ${isBlocked ? styles.blocked : ''}`}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.avatar}>{c.emoji ?? '🏪'}</div>
        <div className={styles.info}>
          <div className={styles.name}>
            {c.name}
            {isBlocked && <span className={styles.blockedBadge}>BLOQUEADO</span>}
          </div>
          <div className={styles.sub} style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
            PIN: {c.pin} · {c.intervalo} min
          </div>
        </div>
        <button
          className={`${styles.blockBtn} ${isBlocked ? styles.activateBtn : styles.suspendBtn}`}
          onClick={onToggleBlock}
        >
          {isBlocked ? '✅ Activar' : '🚫 Bloquear'}
        </button>
      </div>

      {/* Link */}
      <div className={styles.linkBar} onClick={onCopyLink} title="Clic para copiar">
        <span className={styles.linkText}>{displayLink}</span>
        <span className={styles.linkIcon}>📋</span>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={`${styles.actionBtn} ${styles.copy}`} onClick={onCopyLink}>📋 Copiar</button>
        <button className={`${styles.actionBtn} ${styles.wa}`} onClick={onShareWA}>💬 WA</button>
        <button className={`${styles.actionBtn} ${styles.edit}`} onClick={onEdit}>✏️ Editar</button>
        <button className={`${styles.actionBtn} ${styles.del}`} onClick={onDelete}>🗑️</button>
      </div>
    </div>
  );
}
