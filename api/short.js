export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send('ID requerido');

  const dbUrl = process.env.FIREBASE_DATABASE_URL || "https://proradiobiz-default-rtdb.firebaseio.com";

  try {
    const fbRes = await fetch(`${dbUrl}/clients/${id}.json`);
    const c = await fbRes.json();

    if (!c) {
      return res.status(404).send('Cliente no encontrado o enlace invalido');
    }

    // Reconstruir la URL larga
    const p = new URLSearchParams({
      nombre: c.name,
      folder: c.folder,
      pin: c.pin,
      intervalo: c.intervalo,
      locked: '1',
      fade: c.fade || '2',
      code: c.code,
      cid: c.id,
    });

    const src = c.sourceMode || (c.radio ? 'radio' : c.musicfolder ? 'drive' : 'local');
    if (src === 'radio' && c.radio) p.set('radio', c.radio);
    if (src === 'drive' && c.musicfolder) p.set('musicfolder', c.musicfolder);
    if (c.presentacion) p.set('modo', 'presentacion');

    // Redirección relativa al mismo dominio
    const relativeUrl = '/player-pro-v4.html?' + p.toString();
    
    res.redirect(302, relativeUrl);
  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).send('Error interno del servidor');
  }
}
