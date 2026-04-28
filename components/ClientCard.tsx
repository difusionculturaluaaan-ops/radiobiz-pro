'use client';

import { Client } from '@/lib/db';
import styles from './ClientCard.module.css';

interface Props {
  client: Client;
  index: number;
  sessionCount?: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggleBlock: () => void;
  onProgram: () => void;
  onRenewLink: () => void;
}

export default function ClientCard({ client: c, index, sessionCount = 0, onEdit, onDelete, onToggleBlock, onProgram, onRenewLink }: Props) {
  const isBlocked = c.blocked === true;

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
            PIN: {c.pin} · {c.intervalo} min · {sessionCount > 0 ? `🟢 ${sessionCount}` : '⚫ 0'}
          </div>
        </div>
        <button
          className={`${styles.blockBtn} ${isBlocked ? styles.activateBtn : styles.suspendBtn}`}
          onClick={onToggleBlock}
        >
          {isBlocked ? '✅ Activar' : '🚫 Bloquear'}
        </button>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={`${styles.actionBtn} ${styles.program}`} onClick={onProgram}>🎵 Programar</button>
        <button className={`${styles.actionBtn} ${styles.renew}`} onClick={onRenewLink}>🔄 Renovar link</button>
        <button className={`${styles.actionBtn} ${styles.edit}`} onClick={onEdit}>✏️ Editar</button>
        <button className={`${styles.actionBtn} ${styles.del}`} onClick={onDelete}>🗑️</button>
      </div>
    </div>
  );
}
