// Next.js Route Handler — Serves Firebase config from env vars (no API key in client code)
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const apiKey = process.env.FIREBASE_API_KEY ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: 'FIREBASE_API_KEY no configurada en el entorno' },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  const config = {
    apiKey,
    authDomain:        process.env.FIREBASE_AUTH_DOMAIN        ?? 'proradiobiz.firebaseapp.com',
    databaseURL:       process.env.FIREBASE_DATABASE_URL       ?? 'https://proradiobiz-default-rtdb.firebaseio.com',
    projectId:         process.env.FIREBASE_PROJECT_ID         ?? 'proradiobiz',
    storageBucket:     process.env.FIREBASE_STORAGE_BUCKET     ?? 'proradiobiz.firebasestorage.app',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID ?? '601173283890',
    appId:             process.env.FIREBASE_APP_ID             ?? '1:601173283890:web:ee0af646f3b06e3878d82b',
  };

  return Response.json(config, { status: 200, headers: CORS_HEADERS });
}
