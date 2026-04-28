// Shared Firebase CRUD helpers for Realtime Database
import { ref, set, get, update, remove, onValue } from 'firebase/database';
import { db } from './firebase';

export async function fbSet(path: string, data: unknown) {
  await set(ref(db, path), data);
}
export async function fbGet(path: string) {
  const s = await get(ref(db, path));
  return s.exists() ? s.val() : null;
}
export async function fbUpdate(path: string, data: object) {
  await update(ref(db, path), data);
}
export async function fbRemove(path: string) {
  await remove(ref(db, path));
}
export function fbListen(path: string, cb: (val: unknown) => void) {
  return onValue(ref(db, path), (s) => cb(s.exists() ? s.val() : null));
}

export function generateCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function generateLink(c: Client): string {
  const BASE = 'https://radiobiz-pro.vercel.app/player-pro-v4.html';
  const p = new URLSearchParams({
    nombre:    c.name,
    folder:    c.folder,
    pin:       c.pin,
    intervalo: String(c.intervalo),
    locked:    '1',
    fade:      String(c.fade ?? 2),
    code:      c.code,
    cid:       c.id,
  });
  const src = c.sourceMode ?? (c.radio ? 'radio' : c.musicfolder ? 'drive' : 'local');
  if (src === 'radio' && c.radio) p.set('radio', c.radio);
  if (src === 'drive' && c.musicfolder) p.set('musicfolder', c.musicfolder);
  if (c.presentacion) p.set('modo', 'presentacion');
  return BASE + '?' + p.toString();
}

export interface Pago {
  fecha: string;
  monto: number;
  metodo: string;
  notas?: string;
}

export interface Client {
  id: string;
  name: string;
  folder: string;
  pin: string;
  intervalo: number;
  fade?: number;
  emoji?: string;
  radio?: string;
  musicfolder?: string;
  sourceMode?: 'radio' | 'drive' | 'local';
  code: string;
  blocked?: boolean;
  presentacion?: boolean;
  shortUrl?: string;
  createdAt?: number;
  monto?: number;
  plan?: string;
  pagos?: Pago[];
}
