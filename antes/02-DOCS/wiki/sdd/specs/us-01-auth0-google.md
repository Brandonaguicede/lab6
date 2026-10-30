---
type: spec
title: Spec US 01 Auth0 Google
description: Approved WHAT and WHY for social sign-in with Google through Auth0.
tags: [sdd, spec, auth0, google]
timestamp: 2026-10-30T04:15:00Z
topic: sdd
slug: us-01-auth0-google
status: approved-autopilot
approved_at: 2026-10-30
---

# Spec US 01 Auth0 Google

## Problem and why

UNA Chat accepts an arbitrary name from any browser and has no authenticated
identity. A student who needs to join using a recognizable Google identity has
no supported, secure sign-in path, and the server cannot distinguish an
authenticated participant from an anonymous socket.

## Cost of not building it

US-01 remains unmet, chat identity stays client-asserted, and a production
deployment cannot enforce authorization before realtime messages are accepted.

## The cheapest alternative

Keep the username field and ask users to type their Google display name. That
does not authenticate the person or let the server verify their identity.

## Goals

- A visitor can start Google sign-in through Auth0-hosted Universal Login.
- A successfully authenticated participant joins the chat with trusted identity.
- The server refuses an unauthenticated or invalid realtime connection before a
  message can be broadcast.
- A participant can see their authenticated identity and end their session.
- Lab 5 validation and safe rendering remain intact for an authenticated user.

## Non-goals and out of scope

- Creating Auth0 or Google credentials, configuring a tenant, publishing the
  external service or persisting tokens in this repository.
- Other providers, account linking, roles, profiles or chat persistence.
- Replacing Lab 5 media validation, message limits or error semantics.

## Users and context

A student opens UNA Chat from its unified Node service, completes Google
authentication through Auth0, and expects to chat only while authorized.

## Behaviour

- Main: sign-in succeeds, an authorized realtime connection opens, and the chat
  shows a trusted display identity.
- Main: chat controls stay unavailable until the visitor has an authenticated
  session.
- Edge: missing, expired, malformed, wrongly issued or wrongly targeted
  credentials prevent connection and message publication.
- Error: cancelling sign-in or a rejected handshake leaves the visitor outside
  the chat with a retry path that reveals no token or provider detail.
- Logout: ending local authenticated state closes the chat connection.

## Acceptance criteria

- Given an unauthenticated visitor, when they open the chat, then they cannot
  publish a Socket.IO message before sign-in.
- Given a configured Google connection and allowed origin, when sign-in
  completes, then the user connects and the current chat message flow works.
- Given a missing, invalid, expired, wrongly issued or wrongly targeted access
  credential, when a socket connects, then the server rejects it and broadcasts
  no message for that socket.
- Given an authenticated participant, when they submit text or allowed media,
  then existing Lab 5 validation and safe rendering still apply.
- Given logout or unusable authenticated state, when the client reconnects,
  then it must authenticate again before publishing.
- Given an unauthenticated visitor, when they attempt to use chat controls,
  then no message is sent and a sign-in action is available.
- Given a successful configured Google sign-in, when the redirect returns to
  UNA Chat, then the authenticated identity is visible and chat becomes usable.
- Given a user selects logout, when local authenticated state is cleared, then
  their socket closes and chat is protected again.
- Given a token is missing, invalid, expired or addressed to another audience,
  when a realtime connection is attempted, then it is rejected without a
  message broadcast or token detail exposed to the browser.
- Given two authenticated participants, when one sends an allowed message,
  then the other receives it with a server-derived identity.
- Given an authenticated participant submits HTML, a disallowed URL, an allowed
  image or an allowed video, when the message is processed, then the existing
  Lab 5 XSS and multimedia outcomes remain unchanged.

## Points to clarify

- **decision diferida** — Reconcile any rubric wording in `Lab8.docx` when it
  becomes available. The document is absent from this workspace; the explicit
  continuation request is the implementation scope until then.
- **suposicion tomada, validada** — Google is the sole social provider. *Base:*
  the continuation request explicitly requires Google through Auth0. *Risk:* a
  multiple-provider rubric changes UI and test scope.
- **decision diferida** — The final HTTPS `APP_URL` is external deployment
  configuration; frontend and Socket.IO will use that same origin.
- **area no formulable** — Future user profiles, persistence and roles have no
  concrete requirement yet.

## Clarifications

- 2026-10-30 — The current code has no session, CORS, Auth0 or REST message
  layer. The draft preserves the Socket.IO event boundary.
- 2026-10-30 — The repository owner authorized autonomous continuation for
  US-01, with human approval reserved for external credentials and deployment.
  This spec is approved in autopilot, not by a separate manual review.
- 2026-10-30 — The clarified contract requires session state, visible trusted
  identity, logout, protected chat, explicit token rejection cases and Lab 5
  XSS/media regression coverage.
- 2026-10-30 — The owner selected one persistent Node service instead of a
  split Vercel/Socket.IO deployment. `APP_URL` is the canonical public origin.
