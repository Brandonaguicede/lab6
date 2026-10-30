# SDD decisions

| Date | Decision | Why |
| --- | --- | --- |
| 2026-10-30 | Treat US-01 as SDD work. | Authentication, an external IdP and realtime authorization interact and need durable review artifacts. |
| 2026-10-30 | Use Auth0 Universal Login with PKCE and validate the API credential in the Socket.IO handshake. | It separates public SPA authentication from server-side authorization without cross-origin session cookies. |
| 2026-10-30 | Keep Socket.IO on a persistent Node service and host the static frontend on Vercel. | The current server broadcasts in memory and calls `http.listen`; Vercel Functions need reconnection and shared pub/sub to scale that safely. |
| 2026-10-30 | Keep US-01 artifacts as drafts. | `Lab8.docx`, Auth0 tenant values and formal constitution/spec approval are unavailable. |
| 2026-10-30 | Ratify constitution v1.0.0. | The repository owner explicitly approved its eight testable principles and Definition of Done before US-01 implementation. |
| 2026-10-30 | Bind Codex hooks to the nested harness directory. | `RSC_PROJECT_CWD` and the `antes/.rsc` script path make memory resolve correctly without moving the Git repository. |
| 2026-10-30 | Approve US-01 specification and plan in autopilot. | The repository owner explicitly requested autonomous implementation and supplied the required authentication, testing and deployment scope. |
| 2026-10-30 | Use the pinned Auth0 SPA browser bundle and a JWT/JWKS backend verifier. | The current frontend has no build step; the browser SDK provides PKCE while the persistent Node service remains the authorization boundary. |
| 2026-10-30 | Permit deterministic test authentication only under `NODE_ENV=test` plus an explicit test flag. | Automated login/logout and Socket.IO tests need no real tenant or token; production must fail closed. |
| 2026-10-30 | Accept only a root Auth0 callback URL. | Express and the Vercel output serve the SPA at `/`; other paths fail configuration instead of returning 404 after login. |
| 2026-10-30 | Test production browser branches with an intercepted Auth0 SDK. | It executes the real client contract deterministically while Google remains a separate external smoke test. |
| 2026-10-30 | Serve the frontend and Socket.IO from one persistent Node service and use `APP_URL` as their canonical origin. | The repository owner no longer wants a Vercel deployment; one origin removes split-deployment and CORS drift while preserving the existing Express and Socket.IO architecture. |
