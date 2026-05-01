# 🔐 Recomendaciones de Seguridad - RADIOBIZ PRO

**Fecha:** 2026-04-30  
**Proyectos:** RADIOBIZ PRO (HTML) + radiobiz-next (Next.js)  
**Estado:** CRÍTICO - Credenciales de Google expuestas

---

## 1. VULNERABILIDADES CRÍTICAS (Impacto Alto)

### 1.1 ❌ CRÍTICO: Exposición de Google Drive API Key
**Riesgo:** Acceso no autorizado a archivos en Google Drive  
**Severidad:** 🔴 CRÍTICA  
**Ubicación:** 
- `player-pro-v4.html:308` (API Key visible en cliente)
- `player/cliente.html:308` (API Key visible en cliente)

**Problema:** API Key `AIzaSyDSXE6uNybHnIHWsemPflDwyVS0dqfBK9o` está hardcodeada en código frontend  
**Impacto:** Cualquiera con esta key puede:
- Listar todos los archivos en cualquier carpeta compartida
- Descargar archivos de Drive sin autorización
- Consumir cuota de API (DDoS)

**Recomendación Inmediata:**
1. **Regenerar API Key en Google Cloud Console:**
   - Ir a https://console.cloud.google.com
   - Proyecto: `proradiobiz`
   - APIs & Services → Credentials
   - Buscar API Key (no service account)
   - Eliminar la key expuesta: `AIzaSyDSXE6uNybHnIHWsemPflDwyVS0dqfBK9o`
   - Crear NUEVA API Key
   
2. **Mover TODA la lógica de Drive a Backend:**
   ```javascript
   // ❌ MAL (actual)
   fetch(`https://www.googleapis.com/drive/v3/files?...`, {
     headers: { 'Authorization': 'Bearer ' + API_KEY }
   })
   
   // ✅ BIEN (nuevo)
   fetch('/api/drive/[folderId]')  // API route (backend)
   ```

3. **Implementar Restricted API Keys:**
   - En la nueva key: Application restrictions → HTTP referrers
   - Agregar solo: `radiobiz-pro.vercel.app/*`
   - Agregar solo: `localhost:3000/*` (para desarrollo local)

4. **Rotación Periódica:**
   - Cambiar API Key cada 90 días
   - Mantener log de regeneraciones
   - Avisar a todos los clientes si se rotó

---

### 1.2 ❌ CRÍTICO: Service Account Expuesto
**Riesgo:** Compromiso total de Google Drive  
**Severidad:** 🔴 CRÍTICA  
**Ubicación:** 
- `server-local.js:15-27` (private_key visible en plain text)
- Posiblemente committed en git history

**Problema:** Private Key de Service Account está en código de servidor local  
**Impacto:** Acceso ilimitado a Google Drive, puede:
- Eliminar/modificar TODOS los archivos
- Acceder sin autenticación
- Personificar la aplicación

**Recomendación Inmediata:**
1. **Regenerar Service Account:**
   - Google Cloud Console → Service Accounts
   - Proyecto: `proradiobiz`
   - Encontrar: `firebase-adminsdk-fbsvc@proradiobiz.iam.gserviceaccount.com`
   - Eliminar keys antiguas
   - Crear NUEVA key (JSON)
   - Descargar solo para .env (NUNCA commitear)

2. **Mover SOLO a Variables de Entorno:**
   ```bash
   # ✅ CORRECTO (.env.local o Vercel Settings)
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   
   # ❌ INCORRECTO (nunca en código)
   const serviceAccount = { ... }
   ```

3. **Asegurar en Git:**
   ```bash
   # Agregar a .gitignore
   .env.local
   .env
   *.pem
   service-account.json
   ```

4. **Limpiar Git History:**
   ```bash
   # Si la key fue commiteada, limpiar historial
   git filter-branch --tree-filter 'rm -f server-local.js' HEAD
   # (esto es destructivo - coordinar con equipo)
   ```

---

### 1.3 ❌ CRÍTICO: PIN de 4 Dígitos (Seguridad Débil)
**Riesgo:** Acceso no autorizado a reproductor del cliente  
**Severidad:** 🔴 CRÍTICA  
**Ubicación:** `player-pro-v4.html:327`, `player/cliente.html:366`

**Problema:** 
- Solo 10,000 combinaciones posibles (0000-9999)
- Sin rate limiting visible
- Ataque por fuerza bruta tarda ~100 segundos

**Impacto:** Un atacante puede acceder a cualquier reproductor

**Recomendación Inmediata:**
1. **Aumentar a 6 dígitos mínimo:**
   - 6 dígitos = 1,000,000 combinaciones
   - 8 dígitos = 100,000,000 combinaciones (recomendado)

2. **Implementar Rate Limiting en AMBOS lados:**
   ```javascript
   // Cliente: bloquear después de 5 intentos fallidos
   if (failedAttempts > 5) {
     lockoutUntil = Date.now() + (15 * 60 * 1000); // 15 min
   }
   
   // Servidor (Firebase): validar intent history
   sessions/{clientId}/pinAttempts = [
     { ts: 1234567890, success: false },
     { ts: 1234567895, success: false }
   ]
   ```

3. **Agregar Exponential Backoff:**
   ```
   Intento 1: delay 0s
   Intento 2: delay 1s
   Intento 3: delay 2s
   Intento 4: delay 4s
   Intento 5: delay 8s
   → Lockout 15 minutos
   ```

4. **Logging de Intentos Fallidos:**
   ```
   logs/{clientId}/pinAttempts = [
     { ts, ip, userAgent, success }
   ]
   // Revisar logs regularmente
   ```

---

### 1.4 ❌ ALTO: SESSION_ID Predecible
**Riesgo:** Session hijacking  
**Severidad:** 🟠 ALTA  
**Ubicación:** `player-pro-v4.html:271`, `player/cliente.html:271`

**Problema:** `'sess_' + Math.random()` NO es criptográficamente seguro

**Recomendación:**
```javascript
// ❌ MAL (actual)
const sessionId = 'sess_' + Math.random().toString(36);

// ✅ BIEN (nuevo)
const sessionId = 'sess_' + crypto.getRandomValues(new Uint8Array(16))
  .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');

// O simplemente (en navegadores modernos)
const sessionId = 'sess_' + crypto.randomUUID();
```

---

## 2. VULNERABILIDADES ALTAS (Impacto Medio)

### 2.1 Validación Débil de Comandos Firebase
**Riesgo:** Inyección de comandos no validados  
**Severidad:** 🟠 ALTA  
**Ubicación:** `player-pro-v4.html:handleFbCmd()`

**Problema:** Comandos Firebase sin validación de tipo/valor

**Recomendación:**
```javascript
const ALLOWED_ACTIONS = ['play_pause', 'force_ad', 'sync_drive', 'set_volume', 'stop'];

function handleFbCmd(cmd) {
  if (!ALLOWED_ACTIONS.includes(cmd.action)) {
    console.error('Invalid action:', cmd.action);
    return;
  }
  
  // Validar value según acción
  if (cmd.action === 'set_volume' && (cmd.value < 0 || cmd.value > 100)) {
    console.error('Invalid volume:', cmd.value);
    return;
  }
  
  // Safe to execute
  executeCommand(cmd);
}
```

### 2.2 Firebase Security Rules Insuficientes
**Riesgo:** Acceso no autorizado a datos de otros clientes  
**Severidad:** 🟠 ALTA

**Recomendación:** Implementar estas rules en Firebase Console:
```json
{
  "rules": {
    "clients": {
      "$clientId": {
        ".read": "root.child('dashboard').child(auth.uid).exists()",
        ".write": "root.child('dashboard').child(auth.uid).exists()"
      }
    },
    "sessions": {
      "$sessionId": {
        ".read": "true",
        ".write": "!data.exists() && now - newData.child('startedAt').val() < 3600000"
      }
    },
    "commands": {
      "$clientId": {
        ".read": "query.limitToFirst(1).getBoolean()",
        ".write": "root.child('dashboard').child(auth.uid).exists()"
      }
    },
    "logs": {
      ".read": "root.child('dashboard').child(auth.uid).exists()",
      ".write": "false"
    }
  }
}
```

### 2.3 localStorage Almacena Datos Sensibles
**Riesgo:** Robo de datos via XSS  
**Severidad:** 🟠 ALTA

**Problema:** localStorage es vulnerable a XSS

**Recomendación:**
```javascript
// ❌ NUNCA
localStorage.setItem('rbz_pin', PIN);
localStorage.setItem('rbz_code', code);

// ✅ OK (datos no-sensibles)
sessionStorage.setItem('rbz_theme', 'dark');
sessionStorage.setItem('rbz_volume', '80');

// ✅ MEJOR (datos sensibles solo en memoria)
let pinInMemory = null;  // useRef en React
```

### 2.4 Generación de Códigos Débil
**Riesgo:** Codes predecibles para acceso a cliente  
**Severidad:** 🟠 ALTA  
**Ubicación:** `dashboard.html:generateCode()`

**Problema:** `Math.random()` no es seguro criptográficamente

**Recomendación:**
```javascript
function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  return Array.from(arr, x => chars[x % chars.length]).join('');
}
```

---

## 3. VULNERABILIDADES MEDIAS (Impacto Bajo)

### 3.1 CORS no Implementado
**Ubicación:** `server-local.js`, futuros API routes

**Recomendación:**
```javascript
// server-local.js
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://radiobiz-pro.vercel.app',
    'http://localhost:3000',
    'http://localhost:8000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
  }
  
  next();
});
```

### 3.2 Rate Limiting Falta
**Ubicación:** Todos los endpoints

**Recomendación (para radiobiz-next):**
```typescript
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"),
});

export async function GET(req: Request) {
  const { success } = await ratelimit.limit("api_key");
  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
  // ... rest
}
```

### 3.3 Logging de Eventos
**Recomendación:**
```javascript
async function logEvent(type, clientId, details) {
  await fbSet(`logs/${Date.now()}`, {
    type,           // 'login', 'failed_pin', 'force_ad', 'drive_sync'
    clientId,
    details,
    timestamp: new Date().toISOString(),
    ip: req.headers.get('x-forwarded-for'),
    userAgent: navigator.userAgent.substring(0, 80)
  });
}

// Ejemplos:
logEvent('failed_pin', clientId, { attempts: 5 });
logEvent('drive_sync', clientId, { filesFound: 12 });
logEvent('command_executed', clientId, { action: 'force_ad' });
```

---

## 4. PLAN DE ACCIÓN - INMEDIATO

### Fase 1: HOYYYYYY (Horas)
- [ ] Regenerar Google Drive API Key
- [ ] Regenerar Service Account
- [ ] Actualizar .env con nuevas credenciales
- [ ] Eliminar server-local.js si no es necesario

### Fase 2: Esta Semana
- [ ] Implementar rate limiting en PIN (5 intentos = 15 min lockout)
- [ ] Aumentar PIN a 6 dígitos mínimo
- [ ] Mejorar Firebase Security Rules
- [ ] Agregar logging de eventos sensibles

### Fase 3: Próximas 2 Semanas (Antes de radiobiz-next)
- [ ] Implementar session ID criptográficamente seguro
- [ ] Validar TODOS los comandos Firebase
- [ ] Agregar CORS headers
- [ ] Implementar rate limiting en API endpoints
- [ ] Auditoría de dependencias (`npm audit`)

### Fase 4: Antes de Production (radiobiz-next)
- [ ] Testing de penetración básico
- [ ] OWASP ZAP scanning
- [ ] Revisión final de Firebase rules
- [ ] Documento de políticas de rotación de keys

---

## 5. PRÓXIMOS PASOS CON radiobiz-next

Cuando estés listo para desplegar radiobiz-next:

### Variables de Entorno Seguras
```bash
# .env.local (NUNCA commitear)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# En Vercel Settings (no en .env)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
GOOGLE_PRIVATE_KEY_ID=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
```

### Recomendaciones de Arquitectura radiobiz-next
1. **Mover Drive API a Backend:**
   - `/api/drive/[folderId]/route.ts` (usar Service Account)
   - `/api/drive/stream/[fileId]/route.ts` (proxy de audio)
   - Remover API Key de frontend

2. **Implementar Validación con zod:**
   ```typescript
   import { z } from 'zod';
   
   const FolderIdSchema = z.string().min(20).max(60);
   const FileIdSchema = z.string().min(20).max(60);
   
   export async function GET(req: Request) {
     const folderId = FolderIdSchema.parse(params.folderId);
     // ... safe to use
   }
   ```

3. **Rate Limiting en Todas las Routes:**
   - `/api/drive/*` → max 100 req/hora
   - `/player/*` → max 1000 req/hora
   - `/api/commands/*` → max 60 req/minuto

4. **Headers de Seguridad (Vercel):**
   ```typescript
   export async function GET(req: Request) {
     return new Response(body, {
       headers: {
         'Content-Type': 'application/json',
         'X-Content-Type-Options': 'nosniff',
         'X-Frame-Options': 'DENY',
         'X-XSS-Protection': '1; mode=block',
         'Strict-Transport-Security': 'max-age=31536000'
       }
     });
   }
   ```

---

## 6. CHECKLIST DE SEGURIDAD

### Antes de Producción
- [ ] Todas las API keys regeneradas
- [ ] Service Account en variables de entorno (no en código)
- [ ] .gitignore tiene: `.env*`, `*.json`, `*.pem`
- [ ] Rate limiting implementado en todos los endpoints
- [ ] Firebase Security Rules validadas
- [ ] PIN aumentado a 6+ dígitos con rate limiting
- [ ] Session IDs usando crypto.randomUUID()
- [ ] CORS configurado
- [ ] Logging de eventos críticos
- [ ] npm audit passed (sin vulnerabilidades críticas)
- [ ] Headers de seguridad en todas las responses

### Rotación Regular
- [ ] API Keys: cambiar cada 90 días
- [ ] Service Account: cambiar cada 6 meses
- [ ] Revisar logs de PIN fallidos: semanal
- [ ] Auditar Firebase rules: mensual

---

## 7. Contacto de Credenciales

**Tu Email Firebase:** difusionculturaluaaan@gmail.com  
**Google Cloud Project:** proradiobiz  
**Base de Datos Firebase:** proradiobiz-default-rtdb

Para regenerar credenciales:
1. Google Cloud Console: https://console.cloud.google.com (Proyecto: proradiobiz)
2. Firebase Console: https://console.firebase.google.com (Proyecto: proradiobiz)
3. Servicios: Drive API, Firebase Realtime Database

---

**Última Actualización:** 2026-04-30  
**Criticidad:** 🔴 CRÍTICA - Ejecutar Fase 1 HOY
