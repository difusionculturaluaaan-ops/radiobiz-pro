# RadioBiz Pro — Business Logic (Constitución del Proyecto)

> *"El negocio pone el anuncio. El cliente escucha la música. RadioBiz Pro hace que todo suceda automáticamente."*

**Versión:** 1.1  
**Fecha:** 2026-04-01  
**Stack actual:** HTML monolítico + Firebase Realtime DB + Google Drive API + is.gd  
**Stack objetivo (SaaS Factory):** Next.js 16 + Firebase + Supabase Auth + Vercel  

---

## 1. Qué Problema Resuelve

Los negocios (restaurantes, tiendas, salones, consultorios) necesitan música ambiental + publicidad propia reproducida automáticamente en sus pantallas. Hoy:

- No tienen control de lo que suena en sus locales
- No saben si el reproductor está funcionando o apagado
- Contratan servicios caros o usan YouTube con anuncios ajenos

**RadioBiz Pro** es un sistema SaaS que le da al operador (RadioBiz) control total de lo que se reproduce en cada negocio cliente, en tiempo real, desde un solo dashboard.

---

## 2. Modelo de Negocio

| Concepto | Detalle |
|----------|---------|
| **Precio** | ~$499 MXN / cliente / mes |
| **Cliente** | Negocios: restaurantes, tiendas, salones, consultorios |
| **Unidad de venta** | Por negocio (1 cliente = 1 reproductor) |
| **Canal de venta** | WhatsApp directo + link QR listo para enviar |
| **Prueba** | Se puede activar/desactivar remotamente |
| **Cobro** | CoDi o manual (efectivo, transferencia) |
| **Margen bruto** | ~95% (solo costo Firebase) |

---

## 3. Los Dos Actores del Sistema

### 3.1 Operador / Admin (RadioBiz — tú)
Accede al **Dashboard** (`dashboard.html`) con PIN de 4 dígitos.

**Features confirmadas ✅:**
- ✅ Firebase — sincronización real time entre dispositivos
- ✅ Gestión de clientes (crear, editar, borrar)
- ✅ Links con código único — al borrar el cliente el link muere
- ✅ Acortador de URLs automático con is.gd
- ✅ Bloqueo/activación de clientes
- ✅ Contador de dispositivos conectados en tiempo real
- ✅ Módulo de pagos — CoDi, manual, historial
- ✅ Control remoto en tiempo real
- ✅ QR + WhatsApp por cliente
- ✅ Modo claro/oscuro

### 3.2 Cliente / Negocio (Reproductor)
Abre el **Reproductor** (`player-pro-v4.html`) en cualquier pantalla vía el link único.

**Features confirmadas ✅:**
- ✅ Validación de acceso contra Firebase
- ✅ Sesión registrada — aparece en contador del dashboard
- ✅ Comandos en tiempo real desde el dashboard
- ✅ Bloqueo instantáneo si el cliente es suspendido
- ✅ Jingles desde Google Drive con rotación automática
- ✅ Música desde Drive (pestaña ☁️ Drive)
- ✅ Radio online con presets
- ✅ Fade in/out profesional
- ✅ Modo quiosco + Wake Lock
- ✅ Modo claro/oscuro

---

## 4. Arquitectura Actual (Monolítica HTML)

```
RADIOBIZ PRO/
├── dashboard.html     (1,208 líneas — Panel del operador)
│   ├── Firebase SDK    → Realtime listener de clientes/sessions/commands
│   ├── PIN Screen      → Acceso con PIN de 4 dígitos
│   ├── Overview        → Stats: clientes, links, dispositivos conectados
│   ├── Clients         → CRUD + bloqueo + QR + WhatsApp + link corto
│   ├── Control         → Comandos remotos en tiempo real por cliente
│   ├── Pagos           → CoDi + manual + historial + badge alertas
│   └── Settings        → BASE_URL + cambio de PIN
│
└── player-pro-v4.html  (1,274 líneas — Reproductor del cliente)
    ├── Firebase SDK    → Validación de código, sesiones, comandos
    ├── PIN Screen      → Acceso con PIN único por cliente
    ├── Player          → Vinyl animado, progreso, fade, volumen dual
    ├── Cola de jingles → Sync con Google Drive (API key pública)
    ├── Música          → MP3 local / Radio stream / Google Drive folder
    ├── Stats           → Anuncios hoy, jingle actual, archivos en Drive
    ├── Kiosko          → Oculta configuración, wake lock pantalla
    └── Admin Commands  → localStorage polling + Firebase listeners
```

---

## 5. Modelo de Datos (Firebase Realtime DB)

### Cliente
```typescript
interface Client {
  id: string           // 'c_' + timestamp
  name: string         // Nombre del negocio
  emoji: string        // Ícono del negocio (🏪🍕💇)
  folder: string       // Google Drive Folder ID (jingles)
  musicfolder?: string // Google Drive Folder ID (música)
  radio?: string       // URL de stream de radio
  pin: string          // PIN de 4 dígitos para el cliente
  intervalo: string    // Minutos entre anuncios
  fade: string         // Duración del fade en segundos
  code: string         // Código único de acceso (validado en Firebase)
  blocked: boolean     // true = link muerto, reproductor bloqueado
  monto?: number       // Mensualidad ($499 default)
  plan?: string        // 'Estándar' | 'Premium' | etc.
  pagos?: Pago[]       // Historial de pagos
  shortUrl?: string    // URL acortada por is.gd
  createdAt: number    // timestamp
}
```

### Pago
```typescript
interface Pago {
  fecha: string    // ISO date
  monto: number
  metodo: string   // 'CoDi' | 'Efectivo' | 'Transferencia' | etc.
  notas: string
}
```

### Sesión (dispositivo conectado)
```
/sessions/{SESSION_ID}
```
```typescript
interface Session {
  clientId: string
  lastPing: number    // timestamp — activo si < 3 minutos
  userAgent: string
}
```

### Comandos remotos
```
/commands/{clientId}
```
```typescript
interface Command {
  action: 'play_pause' | 'force_ad' | 'sync_drive' | 'lock' | 'set_interval' | 'set_volume'
  value: any
  ts: number
}
```

### Reglas de negocio:
- Al eliminar cliente → se eliminan sus sesiones activas
- Al bloquear cliente → el reproductor muestra pantalla de acceso denegado en tiempo real
- El `code` es generado al crear el cliente y nunca cambia (garantiza que el link sea único e irrevocable)
- Si Firebase no responde → el reproductor permite acceso (fallback tolerante)

---

## 6. Flujo del Link Único

```
1. Admin crea cliente → se genera {id, code} aleatorio
2. URL = BASE_URL + ?nombre=X&folder=Y&pin=Z&code=ABC&cid=c_123...
3. URL se acorta con is.gd → se guarda en Firebase como shortUrl
4. Admin envía link por WhatsApp o muestra QR
5. Cliente abre link → player valida {cid+code} en Firebase
6. Si bloqueado → pantalla "Servicio suspendido"
7. Si válido → se registra sesión en /sessions/SESSION_ID
```

---

## 7. Reproductor — Lógica de Música + Anuncios

```
Estado inicial:
  - Carga jingles de Google Drive (carpeta del cliente)
  - Carga música: MP3 local, radio stream, o Drive folder

Ciclo de reproducción:
  - Reproduce música continuamente (shuffle o en orden)
  - Timer: cada N minutos → fade out música → play jingle → fade in música
  - Stats: contador de anuncios hoy (reset al día siguiente)
  - Notificación visual cuando aparece jingle nuevo en Drive

Fade:
  - Música baja de volumen gradualmente (1s, 2s, 3s, 5s)
  - Jingle inicia, muestra countdown circular (ad-ring)
  - Al terminar jingle → fade in de regreso a música

Drive Sync:
  - Cada 2 minutos revisa nuevos archivos en la carpeta
  - Solo descarga los que no existían antes (knownFileIds)
  - Notificación toast + visual cuando encuentra jingles nuevos

Wake Lock:
  - Solicita Screen Wake Lock API para evitar que la pantalla se apague
  - Muestra indicador verde si activo
```

---

## 8. Control Remoto en Tiempo Real

```
Dashboard escribe en /commands/{clientId}
Reproductor escucha con onValue()

Comandos disponibles:
  play_pause  → Pausa o reanuda la música
  force_ad    → Fuerza el próximo jingle inmediatamente
  sync_drive  → Fuerza re-sincronización de Drive
  lock        → Muestra pantalla de bloqueo en el cliente
  set_interval → Cambia el intervalo de anuncios
  set_volume  → Cambia el volumen (0-100)
```

---

## 9. Módulo de Pagos

| Estado | Criterio |
|--------|----------|
| ✅ Al corriente | Último pago < 35 días |
| ⏳ Pendiente | Último pago 35-45 días |
| 🚫 Vencido | Último pago > 45 días |

- **CoDi:** Genera QR con datos del cobro (Banorte / CLABE del operador)
- **Manual:** Registro de monto, fecha, método, notas
- **Badge de alerta** en sidebar cuando hay clientes pendientes/vencidos
- **Total mensual** calculado sumando todos los montos configurados

---

## 10. Rutas de la Aplicación (Actual)

| Archivo | Rol | Usuario |
|---------|-----|---------|
| `dashboard.html` | Panel de control | Operador (RadioBiz) |
| `player-pro-v4.html` | Reproductor de música | Cliente (negocio) |

### Rutas futuras (Next.js SaaS):

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page — conversión a clientes |
| `/login` | Auth del operador |
| `/dashboard` | Overview + stats |
| `/dashboard/clientes` | CRUD de clientes |
| `/dashboard/control` | Control remoto |
| `/dashboard/pagos` | Gestión de cobros |
| `/dashboard/settings` | Configuración |
| `/player/[clientId]` | Reproductor único por cliente |

---

## 11. Invariantes del Sistema

1. **El `code` del cliente nunca cambia** — garantiza que el link es único
2. **Al eliminar cliente → el link muere inmediatamente** — Firebase valida en cada carga
3. **El bloqueado se refleja en tiempo real** — el reproductor responde en segundos
4. **La mensualidad default es $499** — puede editarse por cliente
5. **Sessions expiran a los 3 minutos** sin ping — contador de dispositivos es confiable

---

## 12. Análisis de Deuda Técnica (Rigor SaaS Factory)

### ❌ Problemas Críticos

| Problema | Impacto | Solución |
|---------|---------|---------|
| Firebase API key en texto plano en HTML público | Seguridad crítica | Variables de entorno en Next.js |
| Google Drive API key expuesta en HTML | Seguridad crítica | Endpoint backend `/api/drive/[folder]` |
| Todo en 2 archivos HTML (1,200+ líneas c/u) | Mantenibilidad nula | Arquitectura Feature-First |
| Sin autenticación real del operador | Cualquiera con PIN accede | Supabase Auth + sesiones |
| PIN del dashboard en localStorage | Fácil de extraer | Auth backend |
| Sin HTTPS garantizado (archivo local) | Funciona solo en browser | Deploy en Vercel |

### ⚠️ Problemas Importantes

| Problema | Impacto | Solución |
|---------|---------|---------|
| is.gd puede rechazar requests (CORS, rate limit) | Links no se acortan | Propio shortener o alternativa |
| Sin paginación de clientes | Lento con 50+ clientes | Virtualización + paginación |
| Historial de pagos como array en Firebase | No escalable | Subcolección o Supabase tabla |
| Sin notificaciones push al operador (pagos vencidos) | Se olvidan cobros | FCM o email |
| Sin backup/export | Pérdida de datos | Export CSV + Firebase rules |

### ✅ Lo que Funciona Muy Bien

- Sincronización real-time Firebase (excelente implementación)
- Control remoto en tiempo real (bidireccional, confiable)
- Fade in/out de música/anuncio (bien implementado)
- Wake Lock API (pantalla no se apaga)
- Modo kiosk (configuración oculta al cliente)
- UI/UX premium (dark/light mode, animaciones, diseño consistente)
- QR + WhatsApp integrado
- Contador de dispositivos conectados

---

## 13. Roadmap Priorizado

### Fase 1 — Estabilizar y Proteger (Inmediato)
- [ ] Mover API keys a variables de entorno
- [ ] Crear proxy `/api/drive` para ocultar Google API key
- [ ] Deploy en Vercel (HTTPS garantizado, URL estable)
- [ ] Supabase Auth para el operador (reemplaza PIN del dashboard)

### Fase 2 — Escalar (Próximo sprint)
- [ ] Migrar a Next.js con arquitectura Feature-First
- [ ] Internacionalización de pagos (Stripe MXN)
- [ ] Notificaciones push: pagos vencidos, dispositivos desconectados
- [ ] Landing page de conversión

### Fase 3 — Crecer (Futuro)
- [ ] Multi-operador (otros RadioBiz pueden usar el sistema)
- [ ] Analytics: horas de reproducción, anuncios emitidos
- [ ] App móvil del operador (PWA)
- [ ] Integración con Twilio/FCM para alertas SMS

---

*Este documento es la fuente de verdad del proyecto. Cualquier feature nueva debe ser consistente con estas reglas antes de implementarse.*
