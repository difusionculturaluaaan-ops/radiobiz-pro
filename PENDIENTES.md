# 📋 Pendientes RadioBiz Pro

## Sistema Básico (EN PROGRESO)
- ✅ Player page con PIN authentication
- ✅ Programar page (música + intervalo + fade)
- ✅ Dashboard con stats en vivo
- ✅ Session count indicator (🟢 conexiones)
- ✅ Botón "Renovar link" (invalida sesiones)
- ⏳ **Registrar sesiones en Firebase cuando se abre el player** (para que contador sea real)
  - Crear sesión al autenticar PIN
  - Actualizar lastPing periódicamente
  - Limpiar sesión al cerrar
- ⏳ Reposicionar botón de WhatsApp share (actualmente removido)

## Protección contra Abuso (FASE 2)
- 🔴 Detección de múltiples negocios con 1 link
  - Monitorear conexiones simultáneas por cliente
  - Alertar si excede plan
- 🔴 Sistema de notificación inteligente
  - Mostrar alerta en dashboard
  - Opción upgrade automático
- 🔴 Bloqueo progresivo
  - Día 1-3: Notificación
  - Día 4-7: Desconexiones aleatorias
  - Día 8+: Bloqueo total
- 🔴 Cobro automático por sobrepaso

## Control Remoto (A REVISAR)
- Verificar que funciona desde `/dashboard/control`
- Testing con múltiples clientes

## Audio (TESTING NECESARIO)
- Verificar Google Drive music source
- Verificar Radio online source
- Verificar Jingles playback
- Testing fade in/out

## UI/UX
- Diseño responsive en mobile
- Dark mode consistente
- Loading states en todas las acciones

## Deployment
- Build verificado en Vercel
- Environment variables configuradas
- Backups de datos en Firebase

---
**Última actualización:** 2026-04-28
**Estado:** Sistema básico funcional, siguientes pasos: registrar sesiones reales
