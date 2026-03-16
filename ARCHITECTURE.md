# Gallagher Monitor — Architecture

## Overview

This application provides real-time monitoring of alarms and events from Gallagher Command Centre REST API. It consists of a backend proxy and a React frontend.

## Why a proxy?

Gallagher API requires an API key that must remain secret. Exposing it in browser JavaScript would compromise security. The backend acts as a secure middleware that:

- Stores the Gallagher API key in environment variables
- Adds proper authentication headers
- Optionally handles client TLS certificates
- Provides a simple internal token (`X-Internal-Token`) for frontend-to-backend auth
- Normalizes Gallagher's responses into clean models
- Hides Gallagher's HATEOAS `href` complexity

## Data flow

1. Frontend loads → calls backend `/api/alarms` and `/api/events`
2. Backend forwards to Gallagher with auth, returns normalized JSON
3. Frontend renders tables
4. For realtime updates:
   - Backend stores `updates.href` from Gallagher response
   - Periodic `GET /api/events/updates` (or alarms) fetches new items
   - Only new events/alarms are returned by Gallagher (long-poll)
5. Frontend updates state; UI reflects new rows automatically

## Key decisions

- **TypeScript** everywhere: strict typing prevents runtime errors
- **Express** for simplicity; NestJS would be overkill for this scope
- **node-fetch** instead of Axios in backend to keep dependencies small
- **Zustand** for frontend state: lightweight, no boilerplate
- **TailwindCSS** for rapid, clean UI
- **Docker** optional but provided for consistent deployment

## Security model

- Gallagher API key never leaves backend
- Frontend uses `X-Internal-Token` shared secret to talk to backend
- CORS restricted to configured origins
- No secrets in logs
- Backend can run behind HTTPS reverse proxy (nginx)

## Polling strategy

Gallagher uses long-poll `updates` endpoints. The backend:

1. On first call to `/api/alarms` or `/api/events`, store `nextHref`
2. Frontend triggers `/updates` every 15s
3. Backend calls stored `nextHref`, returns any new items, updates `nextHref`
4. If `nextHref` fails (expired), backend refetches full list

This reduces load on Gallagher server compared to naive polling with full queries.

## Normalization

Raw Gallagher payloads contain many nested fields and sometimes inconsistent types. We map to:

- `AlarmRecord`
- `EventRecord`

This makes the frontend simpler and resilient to Gallagher version differences.

## Error handling

- Backend catches errors from Gallagher and returns `500` with JSON `{error: message}`
- Frontend displays error banner and allows retry
- Polling failures reset cursor to force full reload next cycle

## Future extensions

- WebSocket push from backend to frontend (instead of polling)
- Acknowledgment/comment persistence to database
- Multi-user with proper auth (JWT)
- Advanced filter UI (date pickers, dropdowns from Gallagher metadata)
- PWA for mobile
- Role-based access control

## File map

Key files:
- Backend: `backend/src/clients/gallagher.client.ts` — low-level API client
- Services: `backend/src/services/*.service.ts` — business logic
- Frontend hooks: `frontend/src/hooks/useGallagherAlarms.ts`, `useGallagherEvents.ts`
- Store: `frontend/src/store/filtersStore.ts`

## Assumptions

- Gallagher version supports `/events` and `/alarms` endpoints (>= 8.10)
- `updates` endpoints exist and are licensed (RESTEvents)
- Network latency < 30s for updates response
- Relatively moderate event volume (hundreds, not millions)

## Performance considerations

- We only request `fields` that are needed to minimize bandwidth
- Deduplication in frontend prevents duplicate rows on race conditions
- Cursor-based continuation avoids re-downloading old events
- Backend does not cache aggressively (Gallagher data is real-time)

## Deployment

See main README. In production, consider:

- Running backend behind a process manager (PM2, systemd)
- Configuring HTTPS termination (nginx, Traefik)
- Setting appropriate timeouts
- Monitoring logs (Winston can be configured with additional transports)
