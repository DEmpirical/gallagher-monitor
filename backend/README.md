# Gallagher Monitor — Backend

Proxy backend seguro para la API REST de Gallagher Command Centre.

## Características

- Autenticación mediante API key de Gallagher (nunca se expone al frontend)
- Endpoints proxy para alarmas y eventos
- Soporte de long-polling para actualizaciones en tiempo real siguiendo `updates.href`
- Filtros de eventos enviados directamente a Gallagher
- Normalización de datos a tipos TypeScript consistentes
- Logging estructurado con Winston
- CORS configurable
- Health checks

## Requisitos

- Node.js 18+
- Acceso a Gallagher Command Centre REST API (con licencias RESTEvents y RESTCreateEvents para crear eventos si se necesita)

## Configuración

1. Copiar `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Editar `.env`:
   - `GALLAGHER_HOST`: URL del servidor CC (ej: `https://gallagher-server:8443`)
   - `GALLAGHER_API_KEY`: API key generada en Command Centre (formato `GGL-API-KEY` o token)
   - Opcional: certificados cliente si se requiere mTLS

3. Instalar dependencias:
   ```bash
   npm install
   ```

4. Compilar (para producción) o usar dev:
   ```bash
   npm run build   # compila a dist/
   npm start       # ejecuta dist/
   ```

   Desarrollo:
   ```bash
   npm run dev     # ts-node-dev con hot reload
   ```

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `GALLAGHER_HOST` | URL base de Gallagher API (required) |
| `GALLAGHER_API_KEY` | API key / Bearer token (required) |
| `GALLAGHER_CLIENT_CERT` | Ruta al certificado cliente (opcional) |
| `GALLAGHER_CLIENT_KEY` | Ruta a clave privada (opcional) |
| `GALLAGHER_CA_CERT` | Ruta a CA certificate (opcional) |
| `PORT` | Puerto del servidor Express (default: 3001) |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos (coma separada) |
| `POLL_INTERVAL_MS` | Intervalo de polling de respaldo (default 30000) |
| `LOG_LEVEL` | Nivel de logging: debug/info/warn/error (default info) |

## Endpoints API

**Interna** (requiere cabecera `X-Internal-Token` configurada en entorno)

### Alarmas

- `GET /api/alarms` — carga inicial de alarmas activas
- `GET /api/alarms/updates` — long-poll para nuevas/actualizadas alarmas
- `POST /api/alarms/:id/acknowledge` — acknowledger alarma
- `POST /api/alarms/:id/clear` — silenciar/clear alarma

### Eventos

- `GET /api/events` — carga inicial con filtros en query string
  - Filtros soportados: `group`, `type`, `cardholder`, `division`, `directDivision`, `relatedItem`, `source`, `after`, `before`, `top`, `fields`
- `GET /api/events/updates` — long-poll para nuevos eventos

### Health

- `GET /health` — health del backend
- `GET /health/gallagher` — conectividad con Gallagher

## Diferencias entre eventos y alarmas

- **Alarmas**: `GET /api/alarms` no acepta query parameters de filtro; el filtrado debe hacerse en UI sobre los datos recibidos. El backend provee `updates.href` para mantenerse actualizado.
- **Eventos**: `GET /api/events` **sí** acepta filtros en la query. Para paginación/continuación follow `_links.next.href`.

## Modelos de datos normalizados

- `AlarmRecord` — campos relevantes de una alarma
- `EventRecord` — campos relevantes de un evento

Ver `src/services/types.ts`.

## Seguridad

- La API key de Gallagher **nunca** sale del backend.
- El frontend debe enviar un `X-Internal-Token` (valor en `INTERNAL_TOKEN` env) para autenticarse contra este proxy.
- Configure CORS只 para orígenes de su frontend.
- Logs no capturan secretos.

## Producción

- Usar HTTPS delante del backend (nginx, cloud load balancer)
- Considerar rate limiting
- Habilitar logs en nivel `info` o `warn` (no `debug`)
- Compilar con `npm run build` y ejecutar con `node dist/index.js`
- Usar process manager (PM2, systemd)

## Desarrollo

```bash
npm run dev
```

El servidor corre en `http://localhost:3001`.

## Testing

TBD — se recomienda añadir Jest tests para servicios y cliente.

## Troubleshooting

- **401 de Gallagher**: Verificar API key y permisos del REST Client en Command Centre.
- **No recibo updates**: Algunas versiones de CC requieren licencia específica para updates.
- **CORS error**: Añadir origen del frontend a `ALLOWED_ORIGINS`.
- **Timeout**: Ajustar `REQUEST_TIMEOUT_MS` si la red es lenta.
