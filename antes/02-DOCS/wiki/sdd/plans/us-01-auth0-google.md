---
type: plan
title: Plan US 01 Auth0 Google
description: Approved technical blueprint for Auth0 Google social login in UNA Chat.
tags: [sdd, plan, auth0, google, socket.io, node]
timestamp: 2026-10-30T04:20:00Z
topic: sdd
slug: us-01-auth0-google
status: approved-autopilot
approved_at: 2026-10-30
---

# Plan US 01 Auth0 Google

> Spec: [US-01](../specs/us-01-auth0-google.md) · Status: approved in autopilot.
> Credentials and deployment remain external actions.

## 0. Global constraints

- Preserve Node.js, Express `4.22.3`, Socket.IO `4.8.4` and Lab 5 behaviour.
- Commit no secrets, private keys, Google credentials or raw long-lived tokens.
- Server authorization derives identity from a verified credential, never from a
  client-asserted username.
- `npm test` and `npm run test:e2e` remain release gates.
- Work stays on `feat/lab8-auth0`; no merge occurs.

## 1. Context and constraints

The current application is a single Express-served page and in-memory Socket.IO
broadcast path. It has no session, CORS, data store or authentication. The
ratified constitution requires TDD, server-verified identity and preservation of
all Lab 5 validation. Missing tenant values block only the real-provider smoke
test and deployment, not deterministic implementation and automated tests.

## 2. Architecture

### Amendment 2026-10-30 — unified Node service

The repository owner replaced the split Vercel/Node deployment with one
persistent Node service. Express serves the SPA and runtime configuration from
the same public origin used by Socket.IO. `APP_URL` is the canonical public
origin and derives callback, logout, web-origin, Socket.IO and exact CORS
values. This removes cross-origin deployment configuration without changing the
Auth0 PKCE flow or JWT authorization boundary.

```text
[Browser: Express-served frontend]
  <- [same-origin public runtime configuration]
  -> [Auth0 Universal Login] <-> [Google connection]
  -> [Socket.IO handshake auth.token]
  -> [persistent Express + Socket.IO token middleware]
  -> [socket principal] -> [existing validarMensaje] -> [broadcast]
```

- **Browser identity client** — exposes signed-out, signing-in and error state;
  uses Auth0 SPA JS, requests an API credential after Universal Login and keeps
  the token in memory.
- **Public runtime configuration** — exposes only domain, client ID, audience,
  redirect URI and Socket.IO URL from environment variables; no secret is
  emitted.
- **Auth0 Universal Login** — owns Google redirect and provider credentials.
- **Socket authorization middleware** — validates a handshake credential and
  binds a minimal principal to live socket state.
- **Existing chat service** — retains Lab 5 validation and safe rendering.

**Decision:** use a public SPA flow with Authorization Code plus PKCE and
server-side access-token validation at Socket.IO connection time. Load the
pinned Auth0-owned browser bundle because the existing client has no build step;
use a JWT/JWKS verifier in the persistent Node service. The same service serves
the browser assets and Socket.IO from one HTTPS origin in production.

## 3. Interfaces and contracts

```text
getChatCredential() -> AccessToken | LoginRequired
validateHandshake(token) -> Principal | Unauthorized
connect(auth.token) -> Connected(Principal) | ConnectError
publish(payload, Principal) -> Broadcast | ValidationError | Unauthorized
logout() -> Disconnected
publicRuntimeConfig(env) -> PublicConfig | ConfigurationError
```

- `validateHandshake` verifies signature, issuer, audience, expiry and allowed
  signing algorithm; it never logs or emits the token.
- `publish` preserves the existing validator and derives authenticated identity
  from `Principal`, not from the payload name.
- Missing runtime values keep the chat locked and display a generic
  configuration error; they never activate an authentication bypass.

## 4. Data model and flow

- **Principal:** provider subject and display fields needed only during a live
  socket. No profile database is introduced.
- **Access credential:** ephemeral browser proof for the handshake; never
  persisted, broadcast or logged by UNA Chat.
- **Runtime configuration:** public identifiers and exact allowed origins;
  environment-specific and separated from secrets.
- **Test authentication:** available only when `NODE_ENV=test` and an explicit
  test flag are both present; it uses deterministic fake tokens and cannot be
  enabled in production.

Flow: sign-in -> Auth0/Google redirect -> browser obtains API credential ->
handshake validates it -> socket stores principal -> existing message validation
and broadcast execute -> logout or token failure disconnects the client.

## 5. Testing strategy

| Criterion | Level | Evidence |
| --- | --- | --- |
| No unauthenticated publish | Integration | Handshake rejection; observer sees no broadcast. |
| Valid authenticated chat | Integration | Verified principal connects and current event succeeds. |
| Missing or invalid token fails closed | Unit and integration | Missing, malformed and bad-signature negatives. |
| JWT claims are enforced | Unit | Issuer, audience, expiry and algorithm negatives with generated test keys. |
| Lab 5 stays protected | Unit, integration and E2E | Existing XSS, media and validation suites pass. |
| Logout ends access | E2E and integration | Disconnect then new sign-in required. |
| Origin policy is exact | Configuration test | Allowed origins pass; others fail. |
| Unified service is configurable | Unit and integration | `APP_URL` derives callback, socket URL and exact allowed origin without exposing secrets. |

CI uses deterministic verifier fixtures. A manual non-secret Auth0 development
tenant smoke test covers Google redirect, callback and logout before release.

## 6. Sequencing and dependencies

1. Add secret-safe configuration policy and failing verifier/config tests.
2. Add JWT/JWKS validation and deterministic test fixtures.
3. Add failing Socket.IO authentication and trusted-identity tests, then the
   handshake gate.
4. Add failing browser session/login/logout tests, then accessible client state.
5. Add public-configuration artifacts and operator documentation.
6. Run all unit, integration and E2E evidence plus a secret scan.
7. Configure Auth0/Google and run a manual smoke test outside Git when external
   values and deployment authorization are available.

These steps are serial because client, handshake and identity propagation share
one security contract.

## 7. Risks and open decisions

| Risk | Mitigation |
| --- | --- |
| Missing Lab 8 rubric | Implement the explicit approved scope; reconcile the document when supplied. |
| Incorrect callback/web origins | Maintain exact local and production URL checklist outside Git. |
| Incomplete token validation | Add negative fixtures for every required claim. |
| Token disclosure | Secret scan and no-token logging review. |
| In-memory Socket.IO limits horizontal scaling | Keep one persistent instance, or add a shared adapter before enabling multiple replicas. |

- Open: final tenant, API audience and domains; these are external configuration.
- Decided: broadcast identity replaces the client-provided name and is derived
  from verified claims, with subject identifier as the safe fallback.

## Sources

- https://auth0.com/blog/introducing-auth0-single-page-apps-spa-js-sdk/
- https://developer.auth0.com/resources/guides/api/express/basic-authorization
- https://socket.io/docs/v3/middlewares
- https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections

## Tasks
<!-- generated by tasks on 2026-10-30; IDs are stable, do not renumber -->

| ID | [P] | Task | Done-check | Depends-on | Trace |
| --- | --- | --- | --- | --- | --- |
| T001 |  | Write failing runtime configuration and JWT verifier tests | `npm run test:unit` fails only because auth config/verifier modules do not exist | — | Spec: protected chat and rejected-token criteria |
| T002 |  | Implement secret-safe config and JWT/JWKS verification | `npm run test:unit` passes missing, malformed, expired, issuer, audience and algorithm cases | T001 | Spec: token rejection and environment configuration |
| T003 |  | Write failing authenticated Socket.IO integration tests | `npm run test:integration` fails on missing handshake gate and trusted identity | T002 | Spec: authenticated/rejected connections and two-user chat |
| T004 |  | Implement Socket.IO authorization and trusted identity binding | `npm run test:integration` passes authentication and existing Lab 5 cases | T003 | Spec: protected chat and server-derived identity |
| T005 |  | Write failing browser login, session and logout tests | `npm run test:e2e` fails only on missing authentication UI/state | T004 | Spec: login, visible identity and logout |
| T006 |  | Implement SPA authentication state and protected chat | `npm run test:e2e` passes auth flow plus existing XSS and media scenarios | T005 | Spec: browser behaviour and Lab 5 preservation |
| T007 |  | Add split-deployment runtime config and Auth0 operator instructions (superseded by T009) | Historical task completed before the owner changed deployment | T006 | Original deployment scope |
| T008 |  | Run full verification and update SDD evidence | `npm test` and `npm run test:e2e` pass; `git diff --check` is clean | T007 | All acceptance criteria |
| T009 |  | Unify frontend and Socket.IO deployment | `APP_URL` derives all public origins; obsolete Vercel artifacts are absent; full verification passes | T008 | Owner deployment amendment |

### Task interfaces

**T002 — Interfaces**
- Produces: `loadAuthConfig(env) -> {issuer, audience, jwksUri, algorithms,
  allowedOrigins} | ConfigurationError`.
- Produces: `verifyAccessToken(token) -> Promise<{sub, displayName}> |
  AuthenticationError`.

**T004 — Interfaces**
- Consumes: `verifyAccessToken(token)` from T002.
- Produces: `createServer({tokenVerifier?, publicConfig?})`; rejected sockets get
  generic `AUTHENTICATION_REQUIRED`; accepted sockets store a principal in
  `socket.data` and overwrite the untrusted message name before broadcast.

**T006 — Interfaces**
- Consumes: `window.UNA_CHAT_CONFIG` and the Auth0 SPA SDK global.
- Produces: signed-out, signing-in, authenticated and error UI states;
  `auth.token` in the Socket.IO handshake; logout disconnects the socket.

## Review Workload Forecast

| Dimension | Forecast | Why |
| --- | --- | --- |
| Estimated changed lines | 500-800 | Security middleware, browser state, fixtures, tests and docs. |
| Files / areas | 10-15 | Server, auth modules, HTML/client, unified deployment config, three test levels and docs. |
| Review risk | high | Identity crosses browser, OAuth, JWT and realtime boundaries. |
| Suggested delivery | staged commits | Separate SDD, backend auth, browser auth and verification evidence. |
