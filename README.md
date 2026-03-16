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
- Validación de formato de API Key (debe empezar con `GGL-API-KEY`)
- Control de validación TLS (checkbox para aceptar certificados autofirmados)

## Requisitos

- Node.js 18+
- Gallagher Command Centre con licencias RESTEvents (y RESTCreateEvents si se crearán eventos)
- API Key generada en Command Centre (REST Client item) — formato: `GGL-API-KEY-XXXXX`

## Configuración rápida

### 1. Backend

```bash
cd backend
cp .env.example .env
# Editar .env con:
# GALLAGHER_HOST= (no se usa, se configura por UI)
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

Al abrir la app por primera vez, se muestra la pantalla de configuración.

**Campos:**

- **Host / Base URL**: URL completa del servidor Gallagher. Ej: `https://192.168.1.78:8443`. Debe incluir `https://` y puerto si aplica. Se valida como URL.
- **API Key**: Clave de API generada en Command Centre. **Debe comenzar con `GGL-API-KEY`**. Si no, no se permite guardar.
- **Validar certificados HTTPS/TLS**: 
  - Activado (predeterminado): se validan los certificados del servidor (producción).
  - Desactivado: se permiten certificados autofirmados (entornos de prueba).
- **Timeout (ms)**: Tiempo máximo de espera en peticiones a Gallagher (default 30000).
- **Polling interval (ms)**: Intervalo entre consultas de actualizaciones (default 15000).
- **Default fields**: Campos solicitados por defecto para eventos (separados por coma).

**Botones:**

- **🔗 Probar conexión**: Valida host, formato API key y conectividad con Gallagher (GET `/api`). No guarda.
- **💾 Guardar configuración**: Guarda la configuración en `backend/config.json`. Si la API key es correcta y la conexión funciona, se redirige al dashboard.

**Comportamiento:**

- Si faltan campos obligatorios o el formato es incorrecto, se muestra error claro.
- La API Key **nunca** se muestra completa después de guardar; se enmascara (ej: `GGL-API-KEY••••••••••`).
- El frontend consulta `GET /api/config` al iniciar; si `isConfigured` es `false`, se redirige automáticamente a la pantalla de configuración.

**Persistencia:**

- La configuración se guarda en `backend/config.json` (archivo ignorado por git).
- Permisos recomendados: `chmod 600 config.json`.
- Para producción, considerar cifrado del campo `apiKey`. La estructura está lista para añadir cifrado.

## Flujo de configuración

1. Usuario ingresa host y API key (con formato correcto).
2. Opcional: desactiva "Validar certificados" si usa certificados autofirmados.
3. Click "Probar conexión" → valida credentials y conectividad.
4. Si éxito, click "Guardar configuración" → backend escribe `config.json`.
5. Frontend detecta `isConfigured=true` y muestra dashboard.
6. Si se modifica la configuración, los servicios de polling usan los nuevos valores automáticamente (config dinámica).

## Endpoints API

**Interna** (requiere cabecera `X-Internal-Token` configurada en `.env`)

### Configuración

- `GET /api/config` — obtiene configuración actual (`apiKey` enmascarada, `isConfigured`)
- `POST /api/config` — guarda configuración (parcial). Solo actualiza campos enviados.
- `POST /api/config/test` — prueba conexión **sin guardar**. Valida host, API key (formato `GGL-API-KEY`) y conectividad.
- `DELETE /api/config` — limpia configuración (elimina `config.json`).

### Alarmas

- `GET /api/alarms` — carga inicial de alarmas activas
- `GET /api/alarms/updates` — long-poll para nuevas/actualizadas alarmas
- `POST /api/alarms/:id/acknowledge` — reconocer alarma
- `POST /api/alarms/:id/clear` — silenciar/clear alarma

### Eventos

- `GET /api/events` — carga inicial con filtros query
  - Filtros soportados: `group`, `type`, `cardholder`, `division`, `directDivision`, `relatedItem`, `source`, `after`, `before`, `top`, `fields`
- `GET /api/events/updates` — long-poll para nuevos eventos

### Health

- `GET /health` — health del backend
- `GET /health/gallagher` — conectividad con Gallagher

## Modelo de configuración

Almacenado en `backend/config.json` (generado automáticamente):

```json
{
  "gallagher": {
    "host": "https://gallagher-server:8443",
    "apiKey": "GGL-API-KEY-...",
    "strictSsl": true,
    "timeout": 30000,
    "pollInterval": 15000,
    "defaultFields": "defaults,source,eventType,division,cardholder,priority,occurrences"
  }
}
```

**Validaciones aplicadas:**

- `host`: debe ser URL válida (con `https://`).
- `apiKey`: debe comenzar con `GGL-API-KEY`.
- `strictSsl`: controla validación TLS (true=validar, false=aceptar autofirmados).

## Seguridad

- La API key de Gallagher **nunca** sale del backend.
- El frontend usa `X-Internal-Token` para autenticarse contra el proxy.
- CORS restringido a orígenes configurados en `ALLOWED_ORIGINS`.
- Logs no capturan secretos.
- TLS: el backend respeta `strictSsl` usando `https.Agent` con `rejectUnauthorized`.

## Personalización de polling

Los intervalos de polling se ajustan desde la configuración:

- `timeout`: tiempo máximo de espera en peticiones a Gallagher (default 30000 ms)
- `pollInterval`: cada cuánto se consultan updates (default 15000 ms)

Estos valores se pueden cambiar desde la UI y se guardan en `config.json`.

## Producción

- Usar HTTPS delante del backend (nginx, cloud load balancer)
- Considerar rate limiting
- Habilitar logs en nivel `info` o `warn` (no `debug`)
- Compilar backend: `npm run build` y ejecutar con `node dist/index.js`
- Compilar frontend: `npm run build` y servir con nginx
- Usar process manager (PM2, systemd)
- Asegurar que `config.json` esté protegido (chmod 600)
- Plantéase usar un vault (HashiCorp Vault, AWS Secrets Manager) para `apiKey`

## Troubleshooting

- **401 de Gallagher**: Verificar API key, formato GGL-API-KEY y permisos del REST Client en Command Centre.
- **CORS error**: Añadir origen del frontend a `ALLOWED_ORIGINS` en backend `.env`.
- **Sin updates**: Verificar licencia RESTEvents y versión CC (>=8.50 recomendado).
- **Timeouts**: Ajustar `timeout` y `pollInterval` desde la UI o `config.json`.
- **Error "Host debe ser una URL válida"**: Asegúrate de incluir `https://` y puerto.
- **Error "API Key debe comenzar con GGL-API-KEY"**: Revisa que la clave no haya sido recortada o mal copiada.
- **Configuración no persistida**: Verificar permisos de escritura en directorio de `config.json`.

## Mejoras futuras

- Autenticación de usuarios finales (login)
- Página de configuración de filtros guardados
- Exportación de datos a CSV/PDF
- Multi-servidor Gallagher
- Alertas por Telegram/email
- Gráficos y métricas
- Ajuste automático de `top` basado en volumen
- Cifrado de API key en `config.json` (por ejemplo, con `crypto` y master password)

## Licencia

MIT — adapta a tu organización.

---

Creado por Bizarro, ecosistema Redhood.