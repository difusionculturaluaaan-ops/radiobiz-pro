/**
 * GET /api/drive/:folderId
 * Lista archivos de audio en una carpeta de Google Drive.
 * La API key vive en variables de entorno — nunca llega al navegador.
 */
module.exports = async function handler(req, res) {
  const { folder } = req.query;
  const key = process.env.GOOGLE_DRIVE_API_KEY;

  if (!key) {
    return res.status(500).json({ error: 'GOOGLE_DRIVE_API_KEY no configurada en entorno' });
  }
  if (!folder) {
    return res.status(400).json({ error: 'folder param requerido' });
  }

  const url =
    `https://www.googleapis.com/drive/v3/files` +
    `?q=%27${folder}%27+in+parents+and+mimeType+contains+%27audio%27` +
    `&key=${key}` +
    `&fields=files(id,name,modifiedTime,size)` +
    `&orderBy=name`;

  try {
    const upstream = await fetch(url);
    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json(data);
    }

    // Cache 2 minutos — Drive no cambia tan seguido
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
