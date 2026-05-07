# 0002. Use Auth.js v5 with Meta OAuth and JWT sessions

- **Date**: 2026-05-07
- **Status**: Accepted
- **Deciders**: Project owner
- **Tags**: architecture, security, auth

## Context

The Meta Ads Dashboard requires authentication via Meta (Facebook) OAuth to
access the Marketing API on behalf of the user. We need a solution that:

1. Handles the full OAuth 2.0 flow with Meta (consent, callback, token exchange)
2. Stores Meta access/refresh tokens securely for subsequent API calls
3. Manages user sessions across requests
4. Works with Next.js 15 App Router (server components, middleware)
5. Has zero licensing cost

## Decision

We will use **Auth.js v5** (`next-auth@beta`) with the Facebook provider and
**JWT session strategy**.

- Auth.js handles the OAuth flow, CSRF protection, and session management.
- The Facebook provider is configured with Marketing API scopes
  (`ads_management`, `ads_read`, `business_management`).
- Meta tokens are encrypted with AES-256-GCM before being stored in the JWT.
- Session state is stateless (JWT in a cookie) — no database session table.

## Consequences

### Positive

- Open source, no vendor lock-in, no per-user pricing.
- Direct access to raw Meta access/refresh tokens in the JWT callbacks,
  which we need for Marketing API calls.
- Built-in CSRF, cookie security, and session rotation.
- First-class Next.js App Router support (middleware export, server-side
  `auth()` helper).

### Negative

- Auth.js v5 is in beta — API may change. Mitigated by pinning the exact
  version.
- JWT sessions cannot be revoked server-side without additional
  infrastructure (e.g., a blocklist). Acceptable for MVP.
- JWT payload grows with encrypted tokens — cookies are larger.

### Neutral / follow-ups

- If server-side session revocation is needed later, migrate to database
  sessions (Auth.js supports both strategies).
- Monitor Auth.js v5 release notes for breaking changes.

## Alternatives considered

**Clerk**: Managed auth service with excellent DX. Rejected because (1) free
tier limits apply, (2) does not expose raw Meta OAuth tokens needed for
Marketing API calls, (3) vendor lock-in.

**Supabase Auth**: Built into our database provider. Rejected because (1) the
Facebook provider does not support custom scopes for the Marketing API, (2)
less control over the token exchange flow.

**Custom OAuth implementation**: Build the OAuth flow manually with
`fetch()`. Rejected because it replicates what Auth.js already provides
(CSRF, state validation, token rotation, cookie management) and is more
error-prone.

## References

- Auth.js v5 documentation: https://authjs.dev/
- Meta Marketing API auth: https://developers.facebook.com/docs/marketing-apis/overview/authentication
- Spec: `docs/specs/auth.md`
