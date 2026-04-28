export default function handler(req, res) {
  // CORS Headers for Vercel Serverless Function
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // We read the Firebase configuration from the Environment Variables
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "proradiobiz.firebaseapp.com",
    databaseURL: process.env.FIREBASE_DATABASE_URL || "https://proradiobiz-default-rtdb.firebaseio.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "proradiobiz",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "proradiobiz.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "601173283890",
    appId: process.env.FIREBASE_APP_ID || "1:601173283890:web:ee0af646f3b06e3878d82b"
  };

  if (!firebaseConfig.apiKey) {
    // Para entornos locales donde quizás aún no configuran las variables
    // pero idealmente deberíamos retornar error si falta la API Key.
    // Retornamos un 500 para evidenciar que faltan configurar las variables de entorno.
    return res.status(500).json({ error: 'FIREBASE_API_KEY no configurada en el entorno' });
  }

  res.status(200).json(firebaseConfig);
}
