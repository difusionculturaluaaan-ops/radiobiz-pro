/**
 * GET /api/drive/stream/:fileId
 * Redirige al stream de audio en Google Drive.
 * La API key vive en variables de entorno — nunca aparece en el código fuente del player.
 */
module.exports = async function handler(req, res) {
  const { fileId } = req.query;
  const key = process.env.GOOGLE_DRIVE_API_KEY;

  if (!key) {
    return res.status(500).json({ error: 'GOOGLE_DRIVE_API_KEY no configurada en entorno' });
  }
  if (!fileId) {
    return res.status(400).json({ error: 'fileId param requerido' });
  }

  // Redirect temporal — la URL con key queda en tráfico de red pero NO en código fuente
  const streamUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${key}`;
  res.redirect(302, streamUrl);
};
