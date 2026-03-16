# Gallagher Monitor

Aplicación de monitorización en tiempo real de alarmas y eventos para Gallagher Command Centre.

## Arquitectura

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Comunicación**: Backend actúa como proxy seguro hacia la API de Gallagher

## Características

- Dashboard en tiempo real con actualizaciones automáticas (long-poll)
- Vista de alarmas activas con acciones ACK/CLEAR
- Vista de eventos con múltiples filtros
- Filtrado por división, source, tipo, cardholder, rango de fechas
- Estado persistente de filtros (localStorage)
- Diseño responsive y profesional
- **Ventana de configuración** para host, API key, SSL, timeout, polling interval, fields
- Seguridad: API key de Gallagher nunca se expone al navegador

## Requisitos

- Node.js 18+
- Gallagher Command Centre con licencias RESTEvents (y RESTCreateEvents si se crearán eventos)
- API Key generada en Command Centre (REST Client item)

## Configuración rápida

### 1. Backend

```bash
cd backend
cp .env.example .env
# Editar .env con:
# GALLAGHER_HOST=https://tu-gallagher:8443
# GALLAGHER_API_KEY=tu-api-key
# INTERNAL_TOKEN=secreto-compartido-con-frontend
npm install
npm run dev
```

Backend corre en `http://localhost:3001`.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_INTERNAL_TOKEN=igual-al-de-backend
npm install
npm run dev
```

Frontend corre en `http://localhost:5173`.

### 3. Configuración inicial (vía UI)

- Al abrir la app por primera vez, se muestra la pantalla de configuración.
- Ingresa:
  - Host de Gallagher
  - API Key
  - Validación SSL (según tu entorno)
  - Timeout e intervalo de polling
  - Campos por defecto para eventos
- Click "🔗 Probar conexión" para validar.
- Click "💾 Guardar configuración".
- La app guarda la configuración en `backend/config.json` (archivo ignorado por git).

**Nota:** La API Key se almacena en texto plano en `config.json`. Para entornos de producción, se recomienda cifrar este archivo o usar un vault. La estructura está lista para añadir cifrado.

## Flujo de configuración

1. Si no hay configuración guardada, la app redirige automáticamente a la pantalla de configuración.
2. El usuario completa y prueba la conexión.
3. Al guardar, el backend escribe `config.json` (en el directorio de trabajo del backend).
4. El frontend detecta `isConfigured=true` y muestra el dashboard.
5. Si cambias la configuración, los servicios de polling se reinician automáticamente al recargar.

## Endpoints API

**Interna** (requiere cabecera `X-Internal-Token` configurada en `.env`)

### Configuración

- `GET /api/config` — obtiene configuración actual (apiKey enmascarada)
- `POST /api/config` — guarda configuración (solo campos proporcionados)
- `POST /api/config/test` — prueba conexión sin guardar
- `DELETE /api/config` — limpia configuración

### Alarmas

- `GET /api/alarms` — carga inicial de alarmas activas
- `GET /api/alarms/updates` — long-poll para nuevas/actualizadas alarmas
- `POST /api/alarms/:id/acknowledge` — recognecer alarma
- `POST /api/alarms/:id/clear` — silenciar/clear alarma

### Eventos

- `GET /api/events` — carga inicial con filtros query
  - Filtros soportados: `group`, `type`, `cardholder`, `division`, `directDivision`, `relatedItem`, `source`, `after`, `before`, `top`, `fields`
- `GET /api/events/updates` — long-poll para nuevos eventos

### Health

- `GET /health` — health del backend
- `GET /health/gallagher` — conectividad con Gallagher

## Filtros de eventos soportados

Consulta los parámetros que Gallagher acepta en `GET /api/events`:

- `group`, `type`, `cardholder`, `division`, `directDivision`
- `relatedItem`, `source`, `after`, `before`
- `top`, `fields`

Ejemplo: `/api/events?division=123&after=2025-01-01T00:00:00Z&fields=defaults,source,eventType`

## Estructura de carpetas

```
gallagher-monitor/
├── backend/
│   ├── src/
│   │   ├── clients/      # Cliente Gallagher
│   │   ├── config/       # Configuración (env)
│   │   ├── middleware/   # Auth, errors
│   │   ├── routes/       # API routes
│   │   ├── services/     # Lógica de negocio
│   │   └── utils/        # Logger, etc.
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # ConfigPage, etc.
│   │   ├── services/     # API client
│   │   ├── store/        # Zustand store
│   │   └── types/        # TypeScript types
│   └── ...
├── README.md
└── ARCHITECTURE.md
```

## Modelo de configuración

Almacenado en `backend/config.json` (generado automáticamente):

```json
{
  "gallagher": {
    "host": "https://gallagher-server:8443",
    "apiKey": "tu-api-key-aquí",
    "strictSsl": true,
    "timeout": 30000,
    "pollInterval": 15000,
    "defaultFields": "defaults,source,eventType,division,cardholder,priority,occurrences"
  }
}
```

**Seguridad:**
- El archivo `config.json` debe tener permisos restringidos (chmod 600).
- En producción, considera cifrar el campo `apiKey`.
- El backend expone solo la versión enmascarada (`apiKeyMasked`) en `GET /api/config`.

## Seguridad

- La API key de Gallagher **nunca** sale del backend.
- El frontend usa `X-Internal-Token` para autenticarse contra el proxy.
- CORS restringido a orígenes configurados en `ALLOWED_ORIGINS`.
- Logs no capturan secretos.

## Personalización de polling

Los intervalos de polling se ajustan desde la configuración:

- `timeout`: tiempo máximo de espera en peticiones a Gallagher (default 30000 ms)
- `pollInterval`: cada cuánto se consultan updates (default 15000 ms)

Estos valores se pueden cambiar desde la UI y se guardan en `config.json`.

## Producción

- Usar HTTPS delante del backend (nginx, cloud load balancer)
- Considerar rate limiting
- Habilitar logs en nivel `info` o `warn` (no `debug`)
- Compilar con `npm run build` y ejecutar con `node dist/index.js`
- Usar process manager (PM2, systemd)
- Asegurar que `config.json` esté protegido

## Troubleshooting

- **401 de Gallagher**: Verificar API key y permisos del REST Client en Command Centre.
- **CORS error**: Añadir origen del frontend a `ALLOWED_ORIGINS` en backend `.env`.
- **Sin updates**: Verificar licencia RESTEvents y versión CC (>=8.50 recomendado).
- **Timeouts**: Ajustar `REQUEST_TIMEOUT_MS` y `POLL_INTERVAL_MS` en backend `.env`.
- **Configuración no persistida**: Verificar permisos de escritura en directorio de `config.json`.

## Mejoras futuras

- Autenticación de usuarios finales (login)
- Página de configuración de filtros guardados
- Exportación de datos a CSV/PDF
- Multi-servidor Gallagher
- Alertas por Telegram/email
- Gráficos y métricas
- Ajuste automático de `top` basado en volumen
- Cifrado de API key en `config.json`

## Licencia

MIT — adapta a tu organización.

---

Creado por Bizarro, ecosistema Redhood.
