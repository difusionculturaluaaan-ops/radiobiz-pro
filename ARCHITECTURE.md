# RadioBiz Pro — Arquitectura Completa del Sistema

## 1. Visión General

**RadioBiz Pro** es una plataforma SaaS que permite a operadores (RadioBiz) controlar reproducción de música + anuncios en negocios clientes, en tiempo real, desde un dashboard.

```
┌─────────────────────────────────────────────────────────────────┐
│                     RADIOBIZ PRO SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐              ┌──────────────────────┐   │
│  │  OPERADOR        │              │  CLIENTE (Negocio)   │   │
│  │  (RadioBiz)      │◄─────────────►│  (Reproductor)       │   │
│  │                  │   Firebase    │                      │   │
│  │  dashboard.html  │   Real-time   │  player-pro-v4.html  │   │
│  └──────────────────┘               └──────────────────────┘   │
│         │                                     │                 │
│         │                                     │                 │
│         ▼                                     ▼                 │
│  ┌──────────────────────────────────────────────────┐           │
│  │         Firebase Realtime Database               │           │
│  │  (clientes, sesiones, comandos, pagos)           │           │
│  └──────────────────────────────────────────────────┘           │
│                     │                                            │
│                     ▼                                            │
│  ┌──────────────────────────────────────────────────┐           │
│  │         Google Drive API                         │           │
│  │  (Música, Jingles, Contenido)                    │           │
│  └──────────────────────────────────────────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Componentes Principales

### 2.1 Frontend — Dashboard (Operador)

**Archivo:** `dashboard.html` (1,208 líneas)

**Secciones:**

| Sección | Función | Datos |
|---------|---------|-------|
| **PIN Screen** | Autenticación del operador | PIN de 4 dígitos (hash SHA-256) |
| **Overview** | Stats generales | Clientes totales, dispositivos conectados, pagos pendientes |
| **Clientes** | CRUD de clientes | Crear, editar, bloquear, generar QR, compartir WhatsApp |
| **Control Remoto** | Comandos en tiempo real | Play/Pause, Volumen, Forzar jingle, Cambiar intervalo, Bloqueo |
| **Pagos** | Gestión de cobros | Montos, fechas, métodos (CoDi, manual), histórico |
| **Settings** | Configuración | Base URL, cambiar PIN |

**Flujos principales:**
```
Operador entra PIN
    ↓
Firebase valida PIN
    ↓
Lee lista de clientes en tiempo real
    ↓
Operador puede:
  • Crear cliente → genera código único + genera QR + acorta URL
  • Editar cliente → cambia intervalo, fade, folder
  • Bloquear cliente → reproductor muestra "suspendido"
  • Control remoto → envía comandos a reproductor en tiempo real
  • Registrar pago → actualiza estado de cliente
```

---

### 2.2 Frontend — Reproductor (Cliente)

**Archivo:** `player-pro-v4.html` (1,300+ líneas)

**Secciones:**

| Sección | Función | Características |
|---------|---------|-----------------|
| **PIN Screen** | Acceso al reproductor | PIN único por cliente |
| **Player** | Reproducción de audio | Vinyl animado, progreso, fade in/out |
| **Pestaña MP3** | Archivos locales | Upload, lista, selector |
| **Pestaña Drive** | Google Drive | Carga automática, selector, sincronización cada 2 min |
| **Pestaña Radio** | Streams online | Presets configurables |
| **Cola de Jingles** | Anuncios | Sincronización automática, contador |
| **Stats** | Estadísticas | Anuncios hoy, jingle actual, archivos en Drive |
| **Modo Kiosko** | Bloqueo UI | Oculta controles, Wake Lock |

**Flujo de reproducción:**
```
Usuario abre reproductor
    ↓
Valida PIN en Firebase
    ↓
Se registra sesión en Firebase
    ↓
Carga carpeta de jingles (Google Drive)
    ↓
Carga carpeta de música (Google Drive)
    ↓
Selecciona primer track y lo carga
    ↓
Reproduce música
    ↓
Timer: cada N minutos (intervalo)
    ├─ Fade out música
    ├─ Play jingle
    ├─ Fade in música
    └─ Repite...
    ↓
Escucha comandos Firebase en tiempo real
    ├─ Play/Pause
    ├─ Set Volume
    ├─ Force Ad
    ├─ Sync Drive
    ├─ Set Interval
    └─ Lock
```

---

## 3. Base de Datos — Firebase Realtime Database

**Proyecto:** `proradiobiz` (estructura de árbol)

### 3.1 Estructura de Datos

```javascript
/
├── clients/
│   ├── c_1777329107082/
│   │   ├── name: "CARNES LA CALZADA"
│   │   ├── emoji: "🍖"
│   │   ├── folder: "1nz5_DEJ1-yBuuYAI2wrs-j4-xxH19DG2"  // Jingles
│   │   ├── musicfolder: "1VhlljA_DVs6K_HpncB_jWd6sNRoympU1"  // Música
│   │   ├── pin: "[SHA-256 hash de 4 dígitos]"
│   │   ├── intervalo: "1"  // Minutos entre anuncios
│   │   ├── fade: "2"  // Segundos
│   │   ├── radio: "https://stream.example.com"  // (opcional)
│   │   ├── code: "HQQRY9OF"  // Código único e irrevocable
│   │   ├── blocked: false
│   │   ├── monto: 499  // Precio mensual MXN
│   │   ├── plan: "Estándar"
│   │   ├── createdAt: 1777329107082
│   │   ├── shortUrl: "https://is.gd/abc123"
│   │   └── pagos/
│   │       ├── 0/
│   │       │   ├── fecha: "2026-05-01"
│   │       │   ├── monto: 499
│   │       │   ├── metodo: "CoDi"
│   │       │   └── notas: "Cobro exitoso"
│   │       └── 1/
│   │           └── ...
│   └── c_XXXX.../
│       └── ...
│
├── sessions/
│   ├── sess_abc123/
│   │   ├── clientId: "c_1777329107082"
│   │   ├── lastPing: 1715516234567
│   │   └── userAgent: "Mozilla/5.0..."
│   └── sess_def456/
│       └── ...
│
└── commands/
    ├── c_1777329107082/
    │   ├── action: "play_pause"
    │   ├── value: true
    │   └── ts: 1715516234567
    └── c_XXXX.../
        └── ...
```

### 3.2 Acciones en Base de Datos

| Acción | Quién | Cuándo | Datos |
|--------|-------|--------|-------|
| **Crear cliente** | Operador | Manual desde dashboard | Todos los campos del cliente |
| **Editar cliente** | Operador | Manual desde dashboard | Intervalo, fade, folders, etc. |
| **Bloquear cliente** | Operador | Manual desde dashboard | Set `blocked: true` |
| **Registrar sesión** | Reproductor | Al cargar el reproductor | Session ID, client ID, timestamp |
| **Ping de sesión** | Reproductor | Cada 30 segundos | Update lastPing |
| **Enviar comando** | Operador | Manual desde control remoto | Escribe a `/commands/{clientId}` |
| **Escuchar comando** | Reproductor | Siempre | onValue listener en `/commands/{clientId}` |
| **Registrar pago** | Operador | Manual desde pagos | Pushea a `/clients/{id}/pagos` |

---

## 4. APIs Externas

### 4.1 Google Drive API v3

**Base URL:** `https://www.googleapis.com/drive/v3`

**Endpoints usados:**

```javascript
// Listar archivos en una carpeta
GET /files?q='FOLDER_ID'+in+parents+and+mimeType='audio/mpeg'
    &key=API_KEY
    &fields=files(id,name,modifiedTime,size)
    &orderBy=name

// Descargar/Reproducir archivo
GET /files/{FILE_ID}?alt=media&key=API_KEY
    → Devuelve URL directa para <audio src="">

// Extensiones soportadas
audio/mpeg    (.mp3)
audio/wav     (.wav)
audio/ogg     (.ogg)
audio/mp4     (.m4a)
audio/x-m4a   (.m4a)
```

**Rate limits:**
- 1,000 requests por 100 segundos por usuario
- Player sincroniza cada 2 minutos (480 req/día max)

**Seguridad:**
- API key pública (restricción de dominios: `*.vercel.app`)
- No requiere OAuth ni credenciales del usuario
- Carpetas deben ser accesibles públicamente O usar Service Account

---

### 4.2 Firebase Authentication API

**Proyecto:** `proradiobiz`

**Métodos usados:**

```javascript
// Autenticación anónima (reproductor)
signInAnonymously(fbAuth)

// Validación de código de cliente
GET /clients/{cid}
   Comparar PARAMS.code === client.code

// Token renewal
POST https://securetoken.googleapis.com/v1/token
     ?key=API_KEY
```

**Restricciones configuradas:**
- API key: `AIzaSyC0WNKPe5Ob_ssmJv3PccIbg5hbl7eFfCc`
- Servicios: Firebase Authentication, Google Drive, Firebase Realtime DB
- Dominios: `*.vercel.app`, `radiobiz.vercel.app`, `localhost`

---

### 4.3 URL Shortener — is.gd

**Base URL:** `https://is.gd/create.php`

**Uso:**
```javascript
// Acortar URL de cliente
POST https://is.gd/create.php?format=json&url=...
     → Respuesta: { shorturl: "https://is.gd/abc123" }
```

**Problemas conocidos:**
- CORS issues en algunos navegadores
- Rate limiting en requests rápidas
- Fallback: si falla, mostrar URL original

---

## 5. Tecnologías y Stack

### 5.1 Frontend

| Tecnología | Uso | Versión |
|------------|-----|---------|
| **HTML5** | Markup | Estándar |
| **CSS3** | Estilos | Custom (variables CSS, grid, flex) |
| **JavaScript Vanilla** | Lógica | ES6+ (async/await, fetch, modules) |
| **Firebase SDK** | Real-time DB, Auth | 10.8.0 |
| **Web Crypto API** | Hash SHA-256 | Nativa |
| **Web Audio API** | Reproducción, fade | Nativa |
| **Wake Lock API** | Pantalla activa | Nativa |

### 5.2 Backend

| Tecnología | Uso |
|------------|-----|
| **Firebase Realtime DB** | Base de datos principal |
| **Firebase Auth** | Autenticación |
| **Google Drive API** | Almacenamiento de archivos |
| **Vercel** | Hosting estático |

### 5.3 Herramientas

| Herramienta | Uso |
|------------|-----|
| **Git** | Control de versiones |
| **GitHub** | Repositorio |
| **Vercel** | CI/CD y hosting |
| **Google Cloud Console** | Gestión de APIs y credenciales |

---

## 6. Flujos de Datos Principales

### 6.1 Creación de Cliente (Operador)

```
Dashboard (Operador)
    ↓
Rellena formulario CreateClientModal
    ├─ nombre
    ├─ emoji
    ├─ folder (Drive jingles)
    ├─ musicfolder (Drive música, opcional)
    ├─ pin (4 dígitos)
    ├─ intervalo (minutos)
    ├─ fade (segundos)
    └─ radio (stream URL, opcional)
    ↓
Genera código único: code = random()
    ↓
Hash PIN: pin_hash = SHA256(pin)
    ↓
Genera ID: clientId = "c_" + timestamp
    ↓
Escribe a Firebase:
    /clients/{clientId} = {
        name, emoji, folder, musicfolder, pin: pin_hash,
        intervalo, fade, radio, code, blocked: false,
        monto: 499, plan: "Estándar", createdAt: timestamp
    }
    ↓
Genera QR con link:
    BASE_URL/p?nombre=X&folder=Y&musicfolder=Z&pin=P&code=C&cid=ID&intervalo=I&fade=F
    ↓
Acorta URL con is.gd
    ↓
Guarda shortUrl en Firebase: /clients/{clientId}/shortUrl
    ↓
Copia link/QR/WhatsApp
```

---

### 6.2 Acceso a Reproductor (Cliente)

```
Cliente abre link (o QR)
    ↓
Extrae parámetros de URL:
    ├─ cid = client ID
    ├─ code = código de acceso
    ├─ nombre = nombre del negocio
    ├─ folder = carpeta jingles
    ├─ musicfolder = carpeta música
    ├─ pin = PIN del cliente
    ├─ intervalo = minutos entre anuncios
    ├─ fade = duración fade
    └─ locked = modo cliente (si/no)
    ↓
Firebase valida: code === client.code?
    ├─ SI → Continúa
    └─ NO → Muestra "Acceso denegado"
    ↓
Carga PIN Screen
    ↓
Usuario digita PIN
    ↓
Hash PIN local: hash = SHA256(input)
    ↓
Compara: hash === client.pin?
    ├─ SI → Muestra reproductor
    └─ NO → "PIN incorrecto", reintentar
    ↓
Registra sesión en Firebase:
    /sessions/{SESSION_ID} = {
        clientId, lastPing: timestamp, userAgent
    }
    ↓
Carga jingles de Drive (carpeta: folder)
    ↓
Carga música de Drive (carpeta: musicfolder)
    ↓
Selecciona primer track
    ↓
Reproduce música
    ↓
Escucha comandos Firebase: onValue(/commands/{cid})
```

---

### 6.3 Ciclo de Reproducción (Reproductor)

```
Reproduce música
    ↓
Timer = intervalo * 60000 ms
    ↓
[Cada intervalo]
    ├─ Fade Out música (gradual, 1-5 segundos)
    ├─ Play jingle
    ├─ Countdown visual (circulito)
    ├─ Al terminar jingle:
    │   ├─ Incrementa contador de anuncios hoy
    │   └─ Fade In música
    └─ Reset timer, repite...

[Si usuario presiona comandos remotos]
    ├─ Play/Pause → pausa/reanuda música
    ├─ Set Volume → cambia volumen 0-100
    ├─ Force Ad → jingle inmediato
    ├─ Sync Drive → recarga archivos de Drive
    ├─ Set Interval → cambia intervalo
    └─ Lock → muestra PIN screen, bloquea todo
```

---

### 6.4 Comando Remoto (Operador → Reproductor)

```
Operador en Control Remoto
    ↓
Mueve slider de volumen o presiona botón
    ↓
Escribe comando a Firebase:
    /commands/{clientId} = {
        action: "set_volume",
        value: 75,
        ts: timestamp
    }
    ↓
Reproductor escucha: onValue(/commands/{clientId})
    ↓
Recibe comando
    ↓
Ejecuta:
    if (action === 'set_volume')
        musicAudio.volume = value / 100
    ...
    ↓
Actualiza UI y logs
```

---

## 7. Ciclos de Sincronización

### 7.1 Sesiones

```
Al cargar reproductor:
    Crea: /sessions/{SESSION_ID}
    ↓
Cada 30 segundos:
    Ping: /sessions/{SESSION_ID}/lastPing = now()
    ↓
Dashboard escucha: onValue(/sessions)
    ├─ Cuenta sesiones vivas: lastPing < 3 minutos
    └─ Actualiza contador de dispositivos conectados
    ↓
Sesiones sin ping > 3 min → se eliminan automáticamente
```

### 7.2 Google Drive (Jingles + Música)

```
Al cargar reproductor:
    loadDriveMusic(folder) + syncDrive(folder)
    ↓
Cada 2 minutos:
    GET /files?q='FOLDER_ID'+in+parents&key=API_KEY
    ↓
Compara con archivos conocidos: knownFileIds set
    ├─ Nuevos archivos → Notificación toast + log
    └─ Archivos eliminados → Automáticamente ignorados
    ↓
Actualiza lista en UI
    ↓
Si está reproduciendo:
    Valida que archivo actual aún exista
```

---

## 8. Seguridad

### 8.1 Autenticación

| Nivel | Método | Validación |
|-------|--------|-----------|
| **Operador (Dashboard)** | PIN de 4 dígitos | Hash SHA-256 comparado en navegador |
| **Cliente (Reproductor)** | PIN + código único | Firebase valida código primero, luego PIN |
| **Firebase Anonymous** | signInAnonymously() | Generada automáticamente |

### 8.2 Autorización

| Recurso | Quién accede | Restricción |
|---------|-------------|-------------|
| `/clients/*` | Operador | PIN del dashboard |
| `/clients/{cid}` | Cliente | code === client.code |
| `/sessions/{cid}` | Cliente | code === client.code |
| `/commands/{cid}` | Operador | PIN del dashboard |
| Google Drive folders | Cualquiera | Públicamente accesibles |

### 8.3 Credenciales

| Credencial | Tipo | Ubicación | Seguridad |
|------------|------|-----------|----------|
| API Key Drive | Pública | player-pro-v4.html | Restricción de dominios |
| API Key Firebase Auth | Pública | player-pro-v4.html | Restricción de dominios |
| Firebase Project ID | Público | Ambos archivos | N/A |
| PIN Cliente | Privado | Firebase (hash) | SHA-256 |
| PIN Operador | Privado | localStorage (hash) | SHA-256 |

### 8.4 Problemas de Seguridad Resueltos

| Problema | Solución | Estado |
|----------|----------|--------|
| API keys en texto plano | Restricción de dominios en Google Cloud | ✅ Implementado |
| Firebase token expiry | Configurar dominios para renovación | ✅ Resuelto |
| PIN en localStorage | Hash SHA-256 antes de guardar | ✅ Implementado |
| Acceso sin autenticación | Validar code antes de acceder | ✅ Implementado |

---

## 9. Estadísticas y Monitoreo

### 9.1 En Reproductor

```javascript
// LocalStorage (persiste entre recargas)
rbz_stats_today    = número de anuncios emitidos hoy
rbz_stats_date     = fecha del último reset
rbz_theme          = tema actual (light/dark)
rbz_known_files_*  = IDs de archivos conocidos en Drive
rbz_music_folder   = ID de última carpeta de música usada

// Mostrado en UI
Anuncios hoy: 23
Jingles en Drive: 12
Jingle actual: #5 "Espacio de Belleza"
```

### 9.2 En Dashboard

```javascript
Clientes totales: 15
Dispositivos conectados: 8 (en tiempo real)
Ingresos mensuales: $7,485 MXN
Pagos pendientes: 3 clientes
Pagos vencidos: 1 cliente
```

---

## 10. Mantenimiento y Escalabilidad

### 10.1 Limitaciones Actuales

| Recurso | Límite | Impacto |
|---------|--------|--------|
| Clientes por dashboard | ~100-200 | Rendimiento UI |
| Archivos en Drive por carpeta | Ilimitado | Google Drive limit (1M) |
| Sesiones simultáneas | Ilimitado | Firebase reads/writes |
| Comandos/segundo | ~100 | Firebase throughput |
| Archivos en localStorage | ~5-10MB | Browser storage |

### 10.2 Mejoras Futuras

1. **Paginación en lista de clientes** — para +200 clientes
2. **Caché local de Drive** — reducir API calls
3. **Notificaciones push** — alertas de pagos vencidos
4. **Multi-operador** — soporte para varios usuarios
5. **Analytics** — horas reproducidas, ubicación de dispositivos
6. **App móvil** — control desde celular del operador
7. **Integración Stripe** — pagos automáticos

---

## 11. Archivos del Proyecto

```
RADIOBIZ PRO/
├── dashboard.html           (1,208 líneas — Panel operador)
├── player-pro-v4.html       (1,300+ líneas — Reproductor cliente)
├── BUSINESS_LOGIC.md        (Modelo de negocio completo)
├── ARCHITECTURE.md          (Este documento)
├── INSTRUCCIONES_CLIENTE.md (Guía para clientes)
├── SECURITY_RECOMMENDATIONS.md (Auditoría de seguridad)
├── vercel.json              (Config de deploy Vercel)
├── package.json             (Dependencias [si aplica])
└── .git/                    (Control de versiones)
```

---

## 12. Resumen de Tecnologías por Rol

### Operador (Dashboard)

```
[Navegador]
├── HTML/CSS/JS Vanilla
├── Firebase Auth (PIN)
├── Firebase Realtime DB (listeners)
├── Web Crypto (hash SHA-256)
└─ LocalStorage (PIN caché)
        ↓
[Firebase Console]
├── Authentication (anónimo)
├── Realtime Database (árbol JSON)
└─ Security Rules (lectura/escritura controlada)
```

### Cliente (Reproductor)

```
[Navegador]
├── HTML/CSS/JS Vanilla
├── Firebase Auth (anónimo)
├── Firebase Realtime DB (comandos, sesiones)
├── Google Drive API (jingles + música)
├── Web Crypto (PIN hash)
├── Web Audio API (reproducción, fade)
├── Wake Lock API (pantalla activa)
└─ LocalStorage (stats, configuración)
```

---

## 13. Endpoints Clave

| Endpoint | Método | Autenticación | Datos |
|----------|--------|---------------|-------|
| `radiobiz.vercel.app/p` | GET | code + PIN | Parámetros de cliente en URL |
| `radiobiz.vercel.app/dashboard` | GET | PIN | Dashboard panel |
| `securetoken.googleapis.com/v1/token` | POST | API Key | Token de Firebase |
| `www.googleapis.com/drive/v3/files` | GET | API Key | Lista de archivos |
| `is.gd/create.php` | POST | Pública | URL a acortar |

---

## 14. Diagrama de Interacciones

```
┌─────────────────────────────────────────────────────────────┐
│                  RADIOBIZ PRO FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  OPERADOR                                  CLIENTE          │
│  (Dashboard)                             (Reproductor)      │
│                                                              │
│   Login ─────────────────────────────────────────────────┐  │
│     │                                                     │  │
│     ├─ Crear Cliente ──────────────────────────────┐    │  │
│     │   │                                          │    │  │
│     │   └─► Firebase: /clients/{id} = {...}       │    │  │
│     │       ├─ Genera QR/Link                      │    │  │
│     │       └─ Acorta URL (is.gd)                  │    │  │
│     │                                              │    │  │
│     ├─ Control Remoto ◄─────────────────────────────────┤  │
│     │   │                                          │    │  │
│     │   ├─ Play/Pause ──────────────────────────────────┼─►│
│     │   ├─ Set Volume ──────────────────────────────────┼─►│
│     │   ├─ Force Ad ─────────────────────────────────────┼─►│
│     │   └─ Commands: /commands/{cid}               │    │  │
│     │                                              │    │  │
│     └─ Ver Pagos ◄─────────────────────────────────────┤  │
│                                                         │  │
│                                                   Opens Link│
│                                                         │  │
│                                                   PIN Screen│
│                                                         │  │
│                                                   Reproductor│
│                                                         │  │
│                                                   Load Drive │
│                                                   jingles +  │
│                                                   música     │
│                                                         │  │
│                                                   Reproduce  │
│                                                   Loop:      │
│                                                   Fade-      │
│                                                   Play Ad-   │
│                                                   Fade Back  │
│                                                         │  │
└─────────────────────────────────────────────────────────────┘
```

---

*Documento actualizado: 2026-05-13*
*RadioBiz Pro v4 — Sistema de música y publicidad automática*
