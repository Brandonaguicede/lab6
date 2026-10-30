---
type: plan
title: Plan US 01 Auth0 Google
description: Draft technical blueprint for Auth0 Google social login in UNA Chat.
tags: [sdd, plan, auth0, google, socket.io, vercel]
timestamp: 2026-10-30T04:20:00Z
topic: sdd
slug: us-01-auth0-google
status: draft
---

# Plan US 01 Auth0 Google

> Spec: [US-01](../specs/us-01-auth0-google.md) · Status: draft. No code,
> credentials or deployment changes are authorized by this plan.

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
missing Lab 8 rubric, tenant and production origins keep this plan draft.

## 2. Architecture

```text
[Browser: local Express or Vercel static frontend]
  -> [Auth0 Universal Login] <-> [Google connection]
  -> [Socket.IO handshake auth.token]
  -> [Express + Socket.IO token middleware]
  -> [socket principal] -> [existing validarMensaje] -> [broadcast]
```

- **Browser identity client** — exposes signed-out, signing-in and error state;
  requests an API credential after Universal Login.
- **Auth0 Universal Login** — owns Google redirect and provider credentials.
- **Socket authorization middleware** — validates a handshake credential and
  binds a minimal principal to live socket state.
- **Existing chat service** — retains Lab 5 validation and safe rendering.

**Decision:** use a public SPA flow with Authorization Code plus PKCE and
server-side access-token validation at Socket.IO connection time. Host the
frontend on Vercel and retain Socket.IO as a persistent Node service. A
Vercel-Function Socket.IO deployment is deferred because it needs reconnect,
duration and shared pub/sub design beyond this feature.

## 3. Interfaces and contracts

```text
getChatCredential() -> AccessToken | LoginRequired
validateHandshake(token) -> Principal | Unauthorized
connect(auth.token) -> Connected(Principal) | ConnectError
publish(payload, Principal) -> Broadcast | ValidationError | Unauthorized
logout() -> Disconnected
```

- `validateHandshake` verifies signature, issuer, audience, expiry and allowed
  signing algorithm; it never logs or emits the token.
- `publish` preserves the existing validator and derives authenticated identity
  from `Principal`, not from the payload name.

## 4. Data model and flow

- **Principal:** provider subject and display fields needed only during a live
  socket. No profile database is introduced.
- **Access credential:** ephemeral browser proof for the handshake; never
  persisted, broadcast or logged by UNA Chat.
- **Runtime configuration:** public identifiers and exact allowed origins;
  environment-specific and separated from secrets.

Flow: sign-in -> Auth0/Google redirect -> browser obtains API credential ->
handshake validates it -> socket stores principal -> existing message validation
and broadcast execute -> logout or token failure disconnects the client.

## 5. Testing strategy

| Criterion | Level | Evidence |
| --- | --- | --- |
| No unauthenticated publish | Integration | Handshake rejection; observer sees no broadcast. |
| Valid authenticated chat | Integration | Verified principal connects and current event succeeds. |
| Invalid token fails closed | Unit and integration | Issuer, audience, expiry, signature and algorithm negatives. |
| Lab 5 stays protected | Unit, integration and E2E | Existing XSS, media and validation suites pass. |
| Logout ends access | E2E and integration | Disconnect then new sign-in required. |
| Origin policy is exact | Configuration test | Allowed origins pass; others fail. |

CI uses deterministic verifier fixtures. A manual non-secret Auth0 development
tenant smoke test covers Google redirect, callback and logout before release.

## 6. Sequencing and dependencies

1. Reconcile `Lab8.docx`, ratify constitution, and approve spec/plan.
2. Add secret-safe configuration policy and fixtures.
3. Add client authentication state and accessible controls.
4. Add JWT validation, CORS and Socket.IO handshake gate.
5. Bind validated principal to chat events without weakening Lab 5 checks.
6. Add unit, integration and E2E evidence.
7. Configure Auth0/Google and run a manual smoke test outside Git.

These steps are serial because client, handshake and identity propagation share
one security contract.

## 7. Risks and open decisions

| Risk | Mitigation |
| --- | --- |
| Missing Lab 8 rubric | Reconcile it before tasking or implementation. |
| Incorrect callback/web origins | Maintain exact local and production URL checklist outside Git. |
| Incomplete token validation | Add negative fixtures for every required claim. |
| Token disclosure | Secret scan and no-token logging review. |
| Vercel Function scaling limits | Keep persistent Socket.IO service initially. |

- Open: final tenant, API audience and domains; these are external configuration.
- Open: whether trusted display name replaces or merely accompanies the existing
  non-authoritative name field.

## Sources

- https://auth0.com/blog/introducing-auth0-single-page-apps-spa-js-sdk/
- https://developer.auth0.com/resources/guides/api/express/basic-authorization
- https://socket.io/docs/v3/middlewares
- https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections
