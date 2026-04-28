'use client';

import { useEffect, useState, useCallback } from 'react';
import { fbListen, fbUpdate, fbRemove, fbSet, generateCode, generateLink, Client } from '@/lib/db';
import ClientCard from '@/components/ClientCard';
import ClientModal from '@/components/ClientModal';
import styles from './clientes.module.css';

export default function ClientesPage() {
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    const unsub = fbListen('clients', (data) => {
      setClients((data as Record<string, Client>) ?? {});
    });
    return () => unsub();
  }, []);

  const showToast = useCallback((msg: string, type = '') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  async function handleSave(data: Partial<Client>) {
    try {
      if (editingClient) {
        await fbUpdate('clients/' + editingClient.id, data);
        showToast(`✅ ${data.name} actualizado`, 'success');
      } else {
        const id = 'c_' + Date.now();
        const code = generateCode();
        const newClient: Client = {
          id, code, blocked: false, createdAt: Date.now(),
          name: data.name!, folder: data.folder!, pin: data.pin!,
          intervalo: Number(data.intervalo), fade: Number(data.fade ?? 2),
          emoji: data.emoji ?? '🏪', radio: data.radio, musicfolder: data.musicfolder,
          sourceMode: data.sourceMode,
        };
        await fbSet('clients/' + id, newClient);
        // Auto-generate short URL
        const shortUrl = `https://radiobiz-pro.vercel.app/s/${id}`;
        await fbUpdate('clients/' + id, { shortUrl });
        showToast(`✅ ${data.name} creado`, 'success');
      }
      setModalOpen(false);
      setEditingClient(null);
    } catch (e: unknown) {
      showToast('Error: ' + (e as Error).message, 'error');
    }
  }

  async function handleDelete(id: string) {
    const c = clients[id];
    if (!confirm(`¿Eliminar a ${c?.name}?\n\nSu link dejará de funcionar inmediatamente.`)) return;
    await fbRemove('clients/' + id);
    showToast('Cliente eliminado', 'success');
  }

  async function handleToggleBlock(id: string) {
    const c = clients[id]; if (!c) return;
    await fbUpdate('clients/' + id, { blocked: !c.blocked });
    showToast(c.blocked ? '✅ Cliente activado' : '🚫 Cliente bloqueado', c.blocked ? 'success' : 'error');
  }

  async function handleCopyLink(id: string) {
    const c = clients[id]; if (!c) return;
    if (c.blocked) { showToast('Cliente bloqueado — actívalo primero', 'error'); return; }
    const link = c.shortUrl ?? generateLink(c);
    await navigator.clipboard.writeText(link);
    showToast('📋 Link copiado: ' + c.name, 'success');
  }

  async function handleShareWA(id: string) {
    const c = clients[id]; if (!c) return;
    const link = c.shortUrl ?? generateLink(c);
    const msg = encodeURIComponent(`🎵 *RadioBiz Pro* — Tu reproductor está listo!\n\n*Negocio:* ${c.name} ${c.emoji ?? ''}\n\n👆 Abre este link:\n${link}\n\n📌 PIN: *${c.pin}*\n\n_Powered by RadioBiz Pro_`);
    window.open('https://wa.me/?text=' + msg, '_blank');
  }

  async function handleExportCSV() {
    const list = Object.values(clients);
    if (!list.length) { showToast('No hay clientes para exportar', 'error'); return; }
    const headers = ['ID', 'Nombre', 'Plan', 'Monto', 'Intervalo (min)', 'PIN', 'Folder ID', 'Estado', 'Último Pago', 'URL Corta'];
    const rows = list.map(c => {
      const pagos = c.pagos ?? [];
      const ultimoPago = pagos.length ? new Date(pagos[pagos.length - 1].fecha).toLocaleDateString('es-MX') : 'Sin pagos';
      return [c.id, `"${(c.name ?? '').replace(/"/g, '""')}"`, c.plan ?? 'Estándar', c.monto ?? 499,
        c.intervalo, c.pin, c.folder, c.blocked ? 'Bloqueado' : 'Activo', ultimoPago, c.shortUrl ?? ''].join(',');
    });
    const csv = headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radiobiz_backup_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('📥 Backup exportado', 'success');
  }

  const clientList = Object.values(clients);

  return (
    <div>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Clientes</h1>
          <p className={styles.sub}>Gestiona todos tus negocios</p>
        </div>
        <div className={styles.actions}>
          <button className="btn secondary" onClick={handleExportCSV}>📥 Exportar CSV</button>
          <button className="btn primary" onClick={() => { setEditingClient(null); setModalOpen(true); }}>
            + Nuevo cliente
          </button>
        </div>
      </div>

      {/* Grid */}
      {clientList.length === 0 ? (
        <div className={styles.emptyCard} onClick={() => setModalOpen(true)}>
          <span className={styles.emptyIcon}>➕</span>
          <h3>Agregar primer cliente</h3>
          <p>Haz clic para configurar tu primer negocio</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {clientList.map((c, i) => (
            <ClientCard
              key={c.id}
              client={c}
              index={i}
              onEdit={() => { setEditingClient(c); setModalOpen(true); }}
              onDelete={() => handleDelete(c.id)}
              onToggleBlock={() => handleToggleBlock(c.id)}
              onCopyLink={() => handleCopyLink(c.id)}
              onShareWA={() => handleShareWA(c.id)}
            />
          ))}
          <div className={styles.emptyCard} onClick={() => setModalOpen(true)}>
            <span className={styles.emptyIcon}>➕</span>
            <h3>Nuevo cliente</h3>
            <p>Agregar negocio</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ClientModal
          client={editingClient}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingClient(null); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type ? styles[toast.type] : ''}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
