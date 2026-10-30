---
type: review
title: Review — US-01 unified deployment — 2026-10-30
description: Adversarial review against the amended spec, plan and constitution.
tags: [sdd, review, auth0, socket.io, deployment]
timestamp: 2026-10-30T23:40:00Z
topic: sdd
slug: us-01-auth0-google
source_state: b4a58e9
---

# Review — US-01 unified deployment — 2026-10-30

## Verdict: APPROVE

No blocker or should-fix finding survived review.

## Attack list

- Spec fidelity: one persistent Node service and one canonical origin are implemented; Vercel runtime artifacts are removed.
- Correctness: valid HTTPS and local HTTP origins normalize consistently; paths, credentials, query, fragments and non-local HTTP fail closed.
- Contracts: public runtime config still exposes the browser fields expected by `client.js`, now derived from `APP_URL`.
- Security: JWT/JWKS validation, in-memory token handling and exact Socket.IO origin checks remain unchanged; no secret was introduced.
- Tests: the new behavior failed before implementation and passes at unit and integration levels; all 16 E2E scenarios remain green.
- Constitution: Lab 5 behavior, feature-branch workflow and external-credential boundary remain intact.

## Residual external risks

- A real Auth0/Google smoke test still requires tenant values and a configured Google connection.
- Multiple Node replicas require a shared Socket.IO adapter; the documented deployment is one persistent instance.
