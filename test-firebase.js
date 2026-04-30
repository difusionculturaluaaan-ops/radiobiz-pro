const admin = require('firebase-admin');

const serviceAccount = {
  "type": "service_account",
  "project_id": "proradiobiz",
  "private_key_id": "7ef5e6ac249e48b3e2b9cf2b73a5ddbd",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC/iBUkS8VGAj0I\n9Jk1hLcCTHfM0pXlk3Q1g9c5MZmPDGdJJZrLhQq4X4BDrE3LqR3RZqcwq1Z7DqGS\no5xwKz6CXp7bLXpXP/WRqLpR2NrYXzPNfnWLqL5q0FjzLj0Y/Z7P8mZQ7cE8HxQZ\nJ0vQ4D8qQ5Y5vQqKqPpKLjcWL0L0nJ5Jq4eQqC8KY0DzXj5PXqbYq4x4QpQR0Fqx\nqY1VvKqKcV9HjvZmLpQzKYqLqx4PJ9ZbQ2hQ3Y3vZqPxW5BQq5Y0Q2YxZqZxQbZR\nZmVxXpZvMxQwNzQ5Y0F4YWpL5Q0F8Y4VzpZvMxQwNzQ5Y0F4YWpL5Q0F8Y4VzpZv==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-h28bo@proradiobiz.iam.gserviceaccount.com",
  "client_id": "106606097865908924242",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-h28bo%40proradiobiz.iam.gserviceaccount.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://proradiobiz-default-rtdb.firebaseio.com'
});

const db = admin.database();

(async () => {
  try {
    console.log('🚀 Probando guardado en Firebase...');

    const testData = {
      intervalo: 5,
      fade: 2,
      sourceMode: 'radio',
      musicFolder: '',
      spotFolder: '',
      radio: 'https://test.com/stream',
      volumeMusic: 80,
      volumeAd: 90,
      theme: 'dark',
      lastUpdated: new Date().toISOString()
    };

    const clientId = 'test_write_' + Date.now();
    const path = `clients/${clientId}/programming`;

    console.log('📝 Escribiendo en:', path);
    console.log('📦 Datos:', testData);

    await db.ref(path).set(testData);

    console.log('✅ Escritura exitosa!');

    // Verificar que se escribió
    const snap = await db.ref(path).get();
    console.log('✔️ Lectura de verificación:', snap.val());

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Código:', error.code);
    process.exit(1);
  }
})();
