# SDD decisions

| Date | Decision | Why |
| --- | --- | --- |
| 2026-10-30 | Treat US-01 as SDD work. | Authentication, an external IdP and realtime authorization interact and need durable review artifacts. |
| 2026-10-30 | Use Auth0 Universal Login with PKCE and validate the API credential in the Socket.IO handshake. | It separates public SPA authentication from server-side authorization without cross-origin session cookies. |
| 2026-10-30 | Keep Socket.IO on a persistent Node service and host the static frontend on Vercel. | The current server broadcasts in memory and calls `http.listen`; Vercel Functions need reconnection and shared pub/sub to scale that safely. |
| 2026-10-30 | Keep US-01 artifacts as drafts. | `Lab8.docx`, Auth0 tenant values and formal constitution/spec approval are unavailable. |
| 2026-10-30 | Ratify constitution v1.0.0. | The repository owner explicitly approved its eight testable principles and Definition of Done before US-01 implementation. |
