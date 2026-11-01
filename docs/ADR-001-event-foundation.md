# ADR-001: Independent event foundation with database-enforced registration

Status: Implemented for review, not accepted or deployed. Date: 1 November 2026.

## Context

Solid Rock needs a church-owned app with guest access and reliable event registration. The existing repository held only a roadmap. Liberty is archived and its identity, AI and navigation assumptions do not match the church's operational needs.

## Options and decision

Use a minimal independent Expo client, Next.js office and Supabase PostgreSQL, as proposed in the existing roadmap. Do not import Liberty's AI/graph infrastructure. Deterministic SQL handles identity, capacity, duplication and audit. A custom application server would duplicate transaction and identity machinery for this increment.

Mutable workflows run through invoker RPC wrappers delegating to private, non-exposed definer functions. Definer privileges are necessary because clients have no table-write grants and a capacity count must see all reservations. Each function explicitly checks caller identity or protected staff roles; fixed empty search paths, fully qualified objects and narrowed execute grants prevent accidental public privilege exposure. RLS protects reads. Event-row locks serialise registration, cancellation and capacity changes. The unique event/user key supplies retry idempotency.

A confirmed development Auth account can register; church membership verification is explicitly deferred. Confirmation is stored and shown in-app, avoiding unapproved external communications. ChMeetings remains untouched; this development database must not become a competing operational record system without an integration decision.

## Risks and review triggers

PGlite tests verify SQL lifecycle and RLS, not simultaneous independent Postgres connections or Supabase HTTP/Auth configuration. Before pilot: run hosted integration and concurrency tests, confirm membership/access policy, require staff MFA, review native token storage, test physical devices, and obtain store ownership and data-retention decisions. If API scope or ChMeetings capabilities require a different source of truth, revisit this ADR before importing records.
