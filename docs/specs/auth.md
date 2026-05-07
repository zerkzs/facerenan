# Spec: Authentication (Meta OAuth)

> Spec-Driven Development: this document is written **before** the implementation.
> It ships in the same PR as the implementation. Update it whenever the contract
> or scope changes.

## 1. Goal

Enable users to authenticate with their Meta (Facebook) account via OAuth 2.0,
granting the application delegated access to the Meta Marketing API on their
behalf. The login page is the single entry point to the dashboard. Upon
successful authentication, Meta access and refresh tokens are stored encrypted
and used for all subsequent Marketing API calls.

## 2. Non-goals

- Email/password authentication
- Multi-tenancy admin panel or role-based access control
- Sign-up flow (Meta OAuth handles identity creation)
- Social login with providers other than Meta
- Two-factor authentication (delegated to Meta's own 2FA)

## 3. Users / actors

- **Anonymous user** — unauthenticated visitor, sees login page only
- **Authenticated user** — has a valid Meta OAuth session, accesses dashboard
- **Meta OAuth** — external identity provider (Facebook Login)

## 4. User stories

- As an anonymous user, I want to sign in with my Meta account, so that I can
  manage my ad campaigns from a custom dashboard.
- As an authenticated user, I want my session to persist across browser closes,
  so that I do not re-authenticate every visit.
- As an authenticated user, I want to sign out, so that my session is terminated
  and tokens are cleared.

## 5. Contracts

### HTTP API

- See `docs/api/openapi.yaml` — operations: `authSignIn`, `authCallback`,
  `getSession`, `authSignOut`

### Events (if any)

None for MVP.

### Domain model

- `Entity.User` — id (UUID), metaId, name, email, image. Invariant: metaId is
  unique.
- `ValueObject.MetaTokenPair` — accessToken (encrypted), refreshToken
  (encrypted), expiresAt. Validation: both tokens non-empty, expiresAt in the
  future at creation time.
- `ValueObject.SessionInfo` — userId, sessionToken, expires.

## 6. Acceptance criteria

- [ ] Given an anonymous user, when they visit `/login`, then they see the
      login page with a "Continue with Meta" button.
- [ ] Given an anonymous user, when they click "Continue with Meta", then they
      are redirected to Meta's OAuth consent screen requesting
      `ads_management`, `ads_read`, `business_management` permissions.
- [ ] Given Meta returns an auth code, when the callback is processed, then a
      session is created and the user is redirected to `/dashboard`.
- [ ] Given an authenticated user, when they visit `/login`, then they are
      redirected to `/dashboard`.
- [ ] Given an authenticated user, when they click "Sign Out", then the
      session is destroyed and they are redirected to `/login`.
- [ ] Given Meta OAuth fails or user denies consent, when the callback is
      processed, then an error message is displayed on the login page.
- [ ] Given a user with an expired Meta token, when the system detects it,
      then it attempts a refresh; if refresh fails, the user is redirected
      to `/login`.

## 7. Edge cases

- **Token expired**: Attempt refresh via Meta's token refresh endpoint; if
  refresh fails, force re-login.
- **Meta API downtime**: Show clear error message, allow retry.
- **Concurrent sessions**: Allowed (no limit; each browser gets its own
  session).
- **Invalid/revoked token**: Detect on first API call, redirect to login.
- **OAuth state mismatch**: Reject callback, show error on login page.
- **User revokes app permissions on Meta**: Next API call fails, redirect to
  login with descriptive error.

## 8. Security considerations

- **Authentication**: Meta OAuth 2.0 with PKCE (when supported) or state
  parameter for CSRF protection.
- **Authorization**: Any authenticated user can access their own ad accounts
  only (scoped by their Meta token).
- **Data classification**: Meta access/refresh tokens are credentials — stored
  encrypted at rest (AES-256-GCM). User name and email are PII — never
  logged.
- **Session cookies**: `httpOnly`, `secure`, `sameSite=lax`.
- **Threat model**: See `docs/security/threats/auth.md`.

## 9. Observability

- Logs: `auth.login.success`, `auth.login.failure`, `auth.logout`,
  `auth.token.refresh`, `auth.token.refresh.failure` — all with
  `correlation_id`, never with PII or tokens.
- Metrics: `auth_login_total` (counter), `auth_login_errors_total` (counter
  by error type), `auth_token_refresh_total` (counter).
- Alerts: `auth_login_errors_total > 10/min` triggers alert.

## 10. Rollout plan

- No feature flag needed (this is the foundational auth layer).
- Migration: `001_create_users_and_tokens.sql` creates the initial tables.
- Backwards compatibility: N/A (greenfield project).
- Rollback: Drop the migration, remove Auth.js config.

## 11. Open questions

- Should we store sessions in the database (Supabase) or use stateless JWTs?
  **Decision: JWT for MVP** (simpler, no session table needed; revisit if we
  need server-side session revocation).

## 12. References

- ADR: `docs/adr/0002-auth-nextauth-meta-oauth.md`
- Threat model: `docs/security/threats/auth.md`
- Meta Marketing API docs: https://developers.facebook.com/docs/marketing-apis/
- Auth.js v5 docs: https://authjs.dev/
