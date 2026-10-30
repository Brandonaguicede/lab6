---
type: spec
title: Spec US 01 Auth0 Google
description: Draft WHAT and WHY for social sign-in with Google through Auth0.
tags: [sdd, spec, auth0, google]
timestamp: 2026-10-30T04:15:00Z
topic: sdd
slug: us-01-auth0-google
status: draft
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
- Lab 5 validation and safe rendering remain intact for an authenticated user.

## Non-goals and out of scope

- Creating Auth0 or Google credentials, configuring a tenant, deploying Vercel
  or persisting tokens in this planning cycle.
- Other providers, account linking, roles, profiles or chat persistence.
- Replacing Lab 5 media validation, message limits or error semantics.

## Users and context

A student opens UNA Chat locally or from its future Vercel frontend, completes
Google authentication through Auth0, and expects to chat only while authorized.

## Behaviour

- Main: sign-in succeeds, an authorized realtime connection opens, and the chat
  shows a trusted display identity.
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

## Points to clarify

- **pregunta abierta** — What exact US-01 evidence and acceptance wording does
  `Lab8.docx` require? The document is absent from this workspace.
- **suposicion tomada** — Google is the sole social provider. *Base:* the
  authorized task names Auth0 with Google. *Risk:* a multiple-provider rubric
  changes UI and test scope.
- **decision diferida** — Final Vercel and Socket.IO domains are deployment
  work, explicitly excluded now.
- **area no formulable** — Future user profiles, persistence and roles have no
  concrete requirement yet.

## Clarifications

- 2026-10-30 — The current code has no session, CORS, Auth0 or REST message
  layer. The draft preserves the Socket.IO event boundary.
- 2026-10-30 — Auth0 implementation and credentials are prohibited in this
  phase; this document is a planning artifact only.
