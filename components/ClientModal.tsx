'use client';

import { useState } from 'react';
import { Client } from '@/lib/db';
import styles from './ClientModal.module.css';

interface Props {
  client: Client | null;
  onSave: (data: Partial<Client>) => void;
  onClose: () => void;
}

export default function ClientModal({ client, onSave, onClose }: Props) {
  const isEditing = client !== null;

  const [name, setName] = useState(client?.name ?? '');
  const [pin, setPin] = useState(client?.pin ?? '1234');
  const [emoji, setEmoji] = useState(client?.emoji ?? '🏪');
  const [plan, setPlan] = useState(client?.plan ?? 'Estándar');
  const [monto, setMonto] = useState(String(client?.monto ?? 499));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), pin, emoji, plan, monto: Number(monto), folder: client?.folder || '' });
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
              <input value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="🏪" maxLength={2} />
            </div>

            {/* PIN */}
            <div className={styles.field}>
              <label>PIN (4 dígitos)</label>
              <input value={pin} onChange={e => setPin(e.target.value)} placeholder="1234" maxLength={4} pattern="\d{4}" required />
            </div>

            {/* Plan */}
            <div className={styles.field}>
              <label>Plan</label>
              <input value={plan} onChange={e => setPlan(e.target.value)} placeholder="Estándar" />
            </div>

            {/* Monto */}
            <div className={styles.field}>
              <label>Monto (MXN)</label>
              <input type="number" value={monto} onChange={e => setMonto(e.target.value)} min={0} />
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="button" className="btn secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn primary">
              {isEditing ? '💾 Actualizar cliente' : '➕ Crear cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
