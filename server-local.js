#!/usr/bin/env node
/**
 * Local development server for RADIOBIZ PRO
 * Serves HTML files + Google Drive API endpoint
 */

const express = require('express');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = 8000;

// Service account credentials
const serviceAccount = {
  "type": "service_account",
  "project_id": "proradiobiz",
  "private_key_id": "b26f1ebd1ef5a600ccefc76b32354981470bb272",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDxjHlIinLbutLl\nB3tA/Ahjs09VwJDcUDB33H1XpY+b1WmFPVGnl919dbdzmeCAoHbvzCplWLXawLUk\nHrzomb9AlL0qYtNNG84iDppFRDw242F8b5KawexF6mVwrjRBR7lJ8s5OKntnnSvx\nyJuStp2yV/pDeUpJXkq/IIybrIRCjHEkQNPFmzByyQxP2LXpoc+sjYQUxESYCZqJ\nrSkJm7g++7aNLt7xwCa2m4dcDfE3I5iyK2doucen9mwVZtkNDLMOB7WSriTaymqP\nDbrSlg7xSMtus5aNWcD1DoquPPI4VesNDlgax2JQ9c8lS+a2+YrJwgkLXjbEvDIr\n0JgNQTabAgMBAAECggEAddEMv0M4btCbWTbi+Xl1Jhwp0CvS/ILogS48vOl2OI5J\nn8Ge+F3snOs0BeDCTjr2iFRPQYuZeA+SywFrJxEG5hsmgWweoHe1fYsd2DdGH4ec\n3zMUkQORmTCRNfriZgzz5YvW8O1rr8hLzO0KZO9Jz9l1qj+Y6lxhnQPlUXE+Oa6Q\nUtRO4T4x/fZD9fTbL4ixRRKmAPXYpoGmvg6Xe0/kea62IWzAPgZxeID000xVoHHW\nrLdBa33FuFHNTwimPs8rAWfX9s8+aNamMhAvpSegFTY8iJc95hG0XIuvCZgw1CUN\nCh2DOaYuzYVfQg2jI610NOo7E2AUUDiMZg548pTRgQKBgQD6EpnhyMqzJsB7pwLb\njgg3/bE5vRvnzRNzXhauasZR02bZnwv0oQZYqL71WAeFd6uDbSE1OQm2cMMo6FBX\nj14ImNDarqdu9T9i6P/bw3F4HKkEGdLRRLWkCjh7Ri97gKaMLiySuWIQScQgF7sN\nNmTJWm71PrPAznexqI1zPcWtOwKBgQD3RiaehsbB2TzH+wMbn8DcHBCwgIjHsAS8\nCOZ4v0oBc84DYtA0wZec04YyKvgcO7OLmVaEG3sSwKVnFF+9zKKGxHGUFxxfLgss\ne2nwgchWVt85XbigyVdKuVfdjR9FckzfWY1FQELlb2IlIpKumSFizalH8CJh+Ggu\n1k20/LuGIQKBgFy69RECkheosQupPKgJnQaWLlfIxkZIh4PqSeLXeT7yc1sTXS2T\nYHUT7euwfumBHLqZhwzjX7SlT9klfFVbtnTdpeTRiwjcLGsTF314leUCS7JXmRM8\ntVZk69jah9T2OcwVezXVRIXhtLZp1lTp7Km1vRt36tP+O+hHJlyrdVftAoGAHUdh\nK0QqJKnkWImQRKUV4Poxv7R4fayJ4vnq0EFWMfXUXvJEVPrXSOqC6U3NMwqep9jw\nNZRLbl0BOMNg0sh4Nhzslexmn56EFDBIywGTByYiKFjAk8lDXMW1cbZUDZULJScl\nYx3IzgHyTRNa6vGW0mwnryzv5UnUjDcz3EpQqgECgYEAg9GFKCYUQWk8enzIq4jf\nq+oNJkklpuOeGH5S9ap/Av/CrWb+bMo/255+nWUYEkpt5DgtPYRO5I8lvI1P19cI\niSsalosu7HxCo8a6DJ1bYSNmBrUgJ3gDApHODrIvHh9Ue1gW96YA92i2k+Q/OkLa\nmCqHXXvjErAvaDhZr4lAyiE=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@proradiobiz.iam.gserviceaccount.com",
  "client_id": "103183522774499716508",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40proradiobiz.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Serve static files
app.use(express.static(path.join(__dirname)));

// API endpoint: get spots from folder
app.get('/api/drive/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Get all files in folder
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name, mimeType)',
      pageSize: 500,
    });

    const audioMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
    let files = [];

    // Add direct audio files
    (response.data.files || []).forEach((file) => {
      if (audioMimeTypes.includes(file.mimeType || '')) {
        files.push({
          id: file.id,
          name: file.name,
        });
      }
    });

    // Search in subfolders
    const subfolders = (response.data.files || []).filter(
      (f) => f.mimeType === 'application/vnd.google-apps.folder'
    );

    for (const subfolder of subfolders) {
      if (!subfolder.id) continue;
      try {
        const subResponse = await drive.files.list({
          q: `'${subfolder.id}' in parents and trashed=false`,
          spaces: 'drive',
          fields: 'files(id, name, mimeType)',
          pageSize: 500,
        });

        (subResponse.data.files || []).forEach((file) => {
          if (audioMimeTypes.includes(file.mimeType || '')) {
            files.push({
              id: file.id,
              name: file.name,
            });
          }
        });
      } catch (e) {
        // Skip folders that fail
      }
    }

    res.json({ files });
  } catch (error) {
    console.error('Drive API error:', error.message);
    res.status(500).json({
      error: 'Failed to list files',
      details: error.message,
    });
  }
});

// API endpoint: stream audio file from Google Drive
app.get('/api/drive/stream/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    response.data.pipe(res);
  } catch (error) {
    console.error('Drive stream error:', error.message);
    res.status(500).json({
      error: 'Failed to stream file',
      details: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ RADIOBIZ PRO Server running at http://localhost:${PORT}`);
  console.log(`\n📍 URLs:`);
  console.log(`   Dashboard:  http://localhost:${PORT}/dashboard.html`);
  console.log(`   Player V4:  http://localhost:${PORT}/player-pro-v4.html`);
  console.log(`   Player V5:  http://localhost:${PORT}/player/cliente.html`);
  console.log(`\n🎵 API Endpoint:`);
  console.log(`   http://localhost:${PORT}/api/drive/[folderId]`);
  console.log(`\n`);
});
