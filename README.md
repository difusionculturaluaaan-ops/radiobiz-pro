# 📻 RadioBiz Pro

> Sistema de audio y publicidad para negocios — Gestión en tiempo real vía Firebase.

## 🚀 URLs de producción

| URL | Uso |
|-----|-----|
| `tu-dominio.vercel.app/` | Dashboard del operador |
| `tu-dominio.vercel.app/player?...` | Reproductor del cliente |

## 📱 Features

### Dashboard (Operador)
- Gestión de clientes (CRUD)
- Links únicos con código de acceso
- Acortador de URLs (is.gd)
- Bloqueo/activación en tiempo real
- Contador de dispositivos conectados
- Control remoto (play/pause, forzar anuncio, volumen)
- Módulo de pagos: CoDi, manual, historial
- QR + WhatsApp por cliente

### Reproductor (Cliente)
- Validación de acceso contra Firebase
- Jingles desde Google Drive con rotación automática
- Música: MP3 local, radio online, carpeta de Drive
- Fade in/out profesional entre música y anuncios
- Modo quiosco + Wake Lock (pantalla activa)
- Modo claro/oscuro

## 🔧 Stack
- HTML + Vanilla JS (monolítico, sin build step)
- Firebase Realtime Database
- Google Drive API
- is.gd URL Shortener
- Vercel (hosting estático)

## 📄 Documentación
Ver `BUSINESS_LOGIC.md` para la constitución completa del proyecto.
