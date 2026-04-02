# RadioBiz Pro — Project Context (Factory OS)

> Lee este archivo SIEMPRE al inicio de cada sesión antes de tocar cualquier código.

## Qué es este proyecto

**RadioBiz Pro** es un SaaS de audio para negocios. El operador gestiona una cartera de clientes (restaurantes, tiendas, salones) y cada cliente recibe un reproductor web con música ambiental + jingles automáticos, controlable en tiempo real.

**Documentación completa:** Ver `BUSINESS_LOGIC.md`

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML + Vanilla JS (2 archivos monolíticos) |
| Real-time | Firebase Realtime Database |
| Audio source | Google Drive API + Radio streams |
| URL shortener | is.gd |
| Hosting | Vercel (auto-deploy desde GitHub) |
| Repo | github.com/difusionculturaluaaan-ops/radiobiz-pro (privado) |

## Archivos principales

| Archivo | Rol |
|---------|-----|
| `dashboard.html` | Panel del operador (PIN: variable, default 1234) |
| `player-pro-v4.html` | Reproductor del cliente (acceso por link único) |
| `BUSINESS_LOGIC.md` | Fuente de verdad — leer antes de cualquier feature |
| `vercel.json` | Rutas de producción |

## Firebase

- **Proyecto:** `proradiobiz`
- **DB URL:** `https://proradiobiz-default-rtdb.firebaseio.com`
- **Nodos:** `clients/`, `sessions/`, `commands/`, `historial/`
- **Reglas:** Pendiente configurar (actualmente en modo desarrollo)

## URLs de producción

- **Dashboard:** https://radiobiz-pro.vercel.app
- **Reproductor:** https://radiobiz-pro.vercel.app/player-pro-v4.html?...

## Cómo deployar

```bash
# Cualquier cambio → auto-deploy en Vercel
git add .
git commit -m "feat/fix: descripción"
git push origin main
# Vercel redeploya en ~30 segundos
```

## Reglas invariantes (no romper)

1. El `code` del cliente nunca cambia — es la llave del link único
2. Al eliminar cliente → link muere + sesiones eliminadas
3. El bloqueado es en tiempo real — el reproductor responde en segundos
4. `BASE_URL` apunta a `https://radiobiz-pro.vercel.app/player-pro-v4.html`
5. Los links cortos de is.gd se guardan en Firebase (`client.shortUrl`)

## Modelo de negocio

- **Precio:** ~$499 MXN / cliente / mes
- **Cobro:** CoDi o manual — registrado en `client.pagos[]`
- **Estado de pago:** pagado (<35d) / pendiente (35-45d) / vencido (>45d)

## Roadmap pendiente

- [ ] Firebase Security Rules (configurar en consola)
- [ ] Notificaciones push — pagos vencidos
- [ ] Landing page de conversión
- [ ] Dominio propio (radiobiz.mx)
- [ ] Migración a Next.js + Supabase (escala > 100 clientes)
