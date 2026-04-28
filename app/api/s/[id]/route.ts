// Next.js Route Handler replacing api/short.js
const DB_URL = process.env.FIREBASE_DATABASE_URL ?? 'https://proradiobiz-default-rtdb.firebaseio.com';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) return new Response('ID requerido', { status: 400 });

  try {
    const res = await fetch(`${DB_URL}/clients/${id}.json`);
    const c = await res.json();

    if (!c) return new Response('Cliente no encontrado', { status: 404 });

    const p = new URLSearchParams({
      nombre:    c.name,
      folder:    c.folder,
      pin:       c.pin,
      intervalo: String(c.intervalo),
      locked:    '1',
      fade:      String(c.fade ?? 2),
      code:      c.code,
      cid:       id,
    });

    const src = c.sourceMode ?? (c.radio ? 'radio' : c.musicfolder ? 'drive' : 'local');
    if (src === 'radio' && c.radio)       p.set('radio', c.radio);
    if (src === 'drive' && c.musicfolder) p.set('musicfolder', c.musicfolder);
    if (c.presentacion)                   p.set('modo', 'presentacion');

    return Response.redirect(new URL('/player-pro-v4.html?' + p.toString(), 'https://radiobiz-pro.vercel.app'), 302);
  } catch {
    return new Response('Error interno', { status: 500 });
  }
}
