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
- **Ventana de configuración** para host, puerto, API key, TLS, timeout, polling interval, fields
- Soporte para **certificado cliente en Windows Store** (thumbprint)
- Seguridad: API key de Gallagher nunca se expone al navegador

## Requisitos

- Node.js 18+
- Gallagher Command Centre con licencias RESTEvents
- API Key generada en Command Centre (REST Client item)
- **Si requiere certificado cliente**: instalado en el store de Windows (solo Windows backend)

## Configuración rápida

### 1. Backend

```bash
cd backend
cp .env.example .env
# Editar .env:
# GALLAGHER_HOST=https://tu-gallagher:8443
# GALLAGHER_PORT=8443
# GALLAGHER_API_KEY=GGL-API-KEY-xxxx
# GALLAGHER_CLIENT_CERT_THUMBPRINT=8e99a51f3c5a9e20258e9610345507bbea00abfb
# GALLAGHER_IGNORE_SERVER_CERT=true  (si certificado autofirmado)
# INTERNAL_TOKEN=secreto123
npm install
npm run dev
```

Backend corre en `http://localhost:3001`.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_INTERNAL_TOKEN=secreto123  (igual que INTERNAL_TOKEN del backend)
npm install
npm run dev
```

Frontend corre en `http://localhost:5173`.

### 3. Configuración inicial (vía UI)

- Al abrir la app por primera vez, se muestra la pantalla de configuración.
- Ingresa:
  - **Host**: URL de Gallagher (ej: `https://192.168.1.78`)
  - **Puerto**: puerto de la API (ej: `8443`)
  - **API Key**: tu clave (debe empezar con `GGL-API-KEY`)
  - **Validar certificados**: marcar si el certificado de Gallagher es válido
  - **Ignorar errores de certificado**: marcar si usas certificado autofirmado
  - Timeout e intervalo de polling
  - Campos por defecto para eventos
- Click "🔗 Probar conexión" para validar.
- Click "💾 Guardar configuración".
- La app guarda la configuración en `backend/config.json`.

## Flujo de configuración

1. Si no hay configuración guardada, la app redirige automáticamente a la pantalla de configuración.
2. El usuario completa y prueba la conexión.
3. Al guardar, el backend escribe `config.json` (en el directorio de trabajo del backend).
4. El frontend detecta `isConfigured=true` y muestra el dashboard.
5. Si cambias la configuración, los servicios de polling se reinician automáticamente al recargar.

## Configuración de entorno

### Backend `.env`

| Variable | Descripción |
|----------|-------------|
| `GALLAGHER_HOST` | Hostname o IP del servidor Gallagher (sin puerto) |
| `GALLAGHER_PORT` | Puerto HTTP/S (default 8443) |
| `GALLAGHER_API_KEY` | API Key (prefijo `GGL-API-KEY`) |
| `GALLAGHER_CLIENT_CERT_THUMBPRINT` | Thumbprint del certificado cliente en Windows Store (solo Windows) |
| `GALLAGHER_IGNORE_SERVER_CERT` | `true` para aceptar certificados autofirmados |
| `PORT` | Puerto del backend (default 3001) |
| `INTERNAL_TOKEN` | Secreto compartido con frontend |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos (coma separada) |
| `POLL_INTERVAL_MS` | Intervalo de polling (default 15000) |
| `REQUEST_TIMEOUT_MS` | Timeout de peticiones (default 30000) |
| `LOG_LEVEL` | Nivel de logging (info, warn, error, debug) |

### Frontend `.env`

| Variable | Descripción |
|----------|-------------|
| `VITE_INTERNAL_TOKEN` | Debe coincidir con `INTERNAL_TOKEN` del backend |

## Certificados en Windows

Para usar certificado cliente:

1. Instala el certificado en Windows (doble clic en `.pfx` → instalar en **Personal**)
2. Obtén el thumbprint:
   - Ejecuta `certmgr.msc`
   - Busca el certificado en *Personal → Certificates*
   - Doble clic → Detalles → Thumbprint
   - Copia los caracteres hex (sin espacios)
3. En `.env` del backend:
   ```env
   GALLAGHER_CLIENT_CERT_THUMBPRINT=8e99a51f3c5a9e20258e9610345507bbea00abfb
   GALLAGHER_IGNORE_SERVER_CERT=true  # si Gallagher usa cert autofirmado
   ```
4. El backend buscará el certificado en el store automáticamente.

## Endpoints API

**Interna** (requiere cabecera `X-Internal-Token`)

### Configuración

- `GET /api/config` — obtiene configuración actual (apiKey enmascarada)
- `POST /api/config` — guarda configuración (parcial)
- `POST /api/config/test` — prueba conexión sin guardar
- `DELETE /api/config` — limpia configuración

### Alarmas

- `GET /api/alarms` — carga inicial
- `GET /api/alarms/updates` — long-poll updates
- `POST /api/alarms/:id/acknowledge` — acknowledge
- `POST /api/alarms/:id/clear` — clear

### Eventos

- `GET /api/events` — con filtros query
- `GET /api/events/updates` — long-poll

### Health

- `GET /health` — backend health
- `GET /health/gallagher` — conectividad Gallagher

## Modelo de configuración

```json
{
  "gallagher": {
    "host": "https://192.168.1.78",
    "port": 8443,
    "apiKey": "GGL-API-KEY-...",
    "strictSsl": true,
    "ignoreSsl": false,
    "timeout": 30000,
    "pollInterval": 15000,
    "defaultFields": "defaults,source,eventType,division,cardholder,priority,occurrences"
  }
}
```

## Seguridad

- La API key de Gallagher **nunca** sale del backend.
- El frontend usa `X-Internal-Token` para autenticarse contra el proxy.
- CORS restringido a orígenes configurados.
- Logs no capturan secretos.

## Troubleshooting

- **401 Gallagher**: Verificar API key y permisos del REST Client.
- **Certificado no encontrado**: Verificar thumbprint y que esté en *Personal* store.
- **CORS error**: Añadir origen a `ALLOWED_ORIGINS`.
- **Sin updates**: Verificar licencia RESTEvents y versión CC.
- **Timeouts**: Ajustar `REQUEST_TIMEOUT_MS` y `POLL_INTERVAL_MS`.

## Producción

- Usar HTTPS delante del backend (nginx)
- Configurar `ALLOWED_ORIGINS` apropiadamente
- Compilar: `npm run build` y ejecutar con `node dist/index.js`
- Usar process manager (PM2, systemd)
- Proteger `config.json` (chmod 600)

## Licencia

MIT.

---

Creado por Bizarro, ecosistema Redhood.
