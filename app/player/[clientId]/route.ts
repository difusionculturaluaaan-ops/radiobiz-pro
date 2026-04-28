import { NextRequest } from 'next/server';

const DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? 'https://proradiobiz-default-rtdb.firebaseio.com';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;

  if (!clientId) {
    return new Response('ID de cliente requerido', { status: 400 });
  }

  try {
    const res = await fetch(`${DB_URL}/clients/${clientId}.json`);
    const c = await res.json();

    if (!c || c.blocked) {
      return new Response(
        `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Acceso no disponible</title></head>
         <body style="background:#07091a;color:#e2e8f0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;gap:16px">
           <div style="font-size:3rem">🚫</div>
           <h1 style="font-size:1.2rem">Acceso no disponible</h1>
           <p style="color:#475569;font-family:monospace;font-size:.85rem">${c?.blocked ? 'Servicio suspendido. Contacta a RadioBiz.' : 'Cliente no encontrado o enlace inválido'}</p>
           <p style="color:#475569;font-size:.7rem;font-family:monospace">Powered by RadioBiz Pro</p>
         </body></html>`,
        { status: 403, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Build the long URL with all player params
    const p = new URLSearchParams({
      nombre:    c.name,
      folder:    c.folder,
      pin:       c.pin,
      intervalo: String(c.intervalo),
      locked:    '1',
      fade:      String(c.fade ?? 2),
      code:      c.code,
      cid:       clientId,
    });

    const src = c.sourceMode ?? (c.radio ? 'radio' : c.musicfolder ? 'drive' : 'local');
    if (src === 'radio' && c.radio)           p.set('radio', c.radio);
    if (src === 'drive' && c.musicfolder)     p.set('musicfolder', c.musicfolder);
    if (c.presentacion)                       p.set('modo', 'presentacion');

    // Redirect to the existing HTML player (same domain on Vercel)
    const playerUrl = '/player-pro-v4.html?' + p.toString();
    return Response.redirect(new URL(playerUrl, 'https://radiobiz-pro.vercel.app'), 302);

  } catch (err) {
    console.error('Player route error:', err);
    return new Response('Error interno del servidor', { status: 500 });
  }
}
