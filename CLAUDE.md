# Project: Meta Ads Dashboard

> Project memory. Auto-loaded by Claude Code at startup.
> Keep concise and up to date. Extensive content goes in `docs/` and is referenced from here.
> For global principles (Spec-Driven Development, Modular Monolith, DDD, Docs as Code,
> ADRs, API-First, Diátaxis, Security by Design, DevSecOps), see `~/.claude/CLAUDE.md`.
> This file only lists what is project-specific or overrides the global.

---

## Stack

- **Frontend + Backend**: Next.js 15 (App Router), React 19, TypeScript 5.x
- **Styling**: Tailwind CSS 4.x + shadcn/ui
- **Auth**: Auth.js v5 (next-auth@beta) with Meta/Facebook OAuth
- **DB**: Supabase (PostgreSQL 15, free tier)
- **Validation**: Zod 3.x
- **Icons**: lucide-react
- **CI/CD**: GitHub Actions
- **Cloud / hosting**: Vercel (free tier)
- **API Integration**: Meta Marketing API v25.0

## Commands

- Dev: `npm run dev`
- Test: `npm test`
- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- Build: `npm run build`
- Deploy staging: Vercel preview (automatic on PR)
- Deploy prod: **CI only** (Vercel production via GitHub Actions).
  Local production deploys are forbidden — remote backend / pipeline enforces this.

## Workflow

- **Spec-Driven.** Every non-trivial feature starts with a spec in
  `docs/specs/<feature>.md` (goal, contracts, edge cases, acceptance criteria).
  Spec ships in the same PR as the implementation.
- **API-First.** REST contracts in `docs/api/openapi.yaml`, async/event
  contracts in `docs/api/asyncapi.yaml`. Update the contract BEFORE touching
  any handler.
- **Quick threat model (STRIDE)** whenever the attack surface changes
  (new public endpoint, third-party integration, new sensitive data).
- **Observability**: structured logs (JSON or equivalent) with a
  `correlation_id` on every request. Metrics exported to the project's
  observability stack. Unhandled errors reported automatically.
  No ad-hoc stdout debugging in production code.

## Folder structure

- `src/features/<feature>/` — one vertical slice per feature
  - `domain/` — entities, value objects, aggregates, repository interfaces
  - `application/` — use cases (commands/queries), DTOs, ports
  - `infrastructure/` — adapters (DB, cache, HTTP clients, queues),
    implementations of `domain/` interfaces
  - `presentation/` — entry points (HTTP handlers, UI components, CLI, workers)
- `docs/specs/` — feature specs (Spec-Driven)
- `docs/adr/` — Architecture Decision Records (Michael Nygard format)
- `docs/api/` — OpenAPI / AsyncAPI contracts
- `docs/security/` — threat models and security-related docs
- `docs/tutorials/`, `docs/how-to/`, `docs/reference/`, `docs/explanation/` — Diátaxis
- `infra/` (or `terraform/`, `pulumi/`, etc.) — IaC; state directories are off-limits
- `migrations/` — DB migrations; applied migrations are immutable (create a new one)

> Adapt source layout to your language's idioms (e.g. `cmd/` + `internal/` for Go,
> `app/` + `lib/` for Rails) but preserve the slice + DDD layer separation.

## Architecture rules

- **Vertical Slice** per feature in `src/features/<feature>/`.
- **DDD layers** with inward dependency: `presentation` → `application`
  → `domain`. `infrastructure` implements `domain` interfaces. `domain`
  imports nothing from outside.
- **Boundaries are law.** Slices do not import each other's internals —
  communicate via public use cases or domain events.
- **Security by Design (project-specific)**: never log PII; secrets only
  via your stack's secret manager or env vars (never in code); input
  validation at every boundary using your stack's idiomatic validator;
  row-level access control at the DB layer when supported; least
  privilege on all service accounts and credentials.
- **Minimum coverage**: 80% in `domain/` and `application/`.

## Anti-patterns (do not do)

- ❌ Domain logic in `presentation/` (HTTP handlers, UI components, CLI commands)
- ❌ DB driver / ORM client in `domain/` or `application/`
- ❌ Importing directly from another slice — use public use cases or domain events
- ❌ Generic catch-all error handlers swallowing errors without structured logging
- ❌ Dynamic / escape-hatch types (`any`) without a justifying comment
- ❌ Manual DB changes via console — always versioned migration files
- ❌ Hardcoded user-facing strings — always go through the i18n layer
- ❌ Calling production deploy commands from a local machine

## Conventions

- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `sec:`, `refactor:`,
  `test:`, `docs:` (`sec:` is a project extension for security-related changes).
- **Branches**: `feat/<slug>`, `fix/<slug>`, `sec/<slug>`
- **PRs**: open as draft first, CI green before requesting review.
  Spec/ADR ship in the same PR as the change.
- **i18n**: `en-US` is default, `pt-BR` is fallback.
  All user-facing strings go through the i18n layer — never hardcoded in
  responses, templates, or components.
- **Code in English** (variables, functions, comments) — docs and specs
  in English.
- **Migrations**: use the project's migration tool. Always reversible
  (include `down` / rollback). Test rollback before opening PR.

## Files & paths to ignore

- Do not touch IaC state directories (e.g. `terraform/state/**`, `.pulumi/`)
- Do not edit applied `migrations/` (create a new migration instead)
- Do not modify dependency lockfiles manually (`*.lock`, `package-lock.json`,
  `poetry.lock`, `Cargo.lock`, etc.)
- Never run production deploys locally — CI only

## Domain glossary

- **Slice**: end-to-end feature unit (all DDD layers)
- **Bounded Context**: coherent group of slices with their own ubiquitous language
- **Aggregate**: transactional root of the domain
- **Use case**: command/query handler in `application/`
- **ADR**: Architecture Decision Record (`docs/adr/NNNN-title.md`)
- **Spec**: feature document (`docs/specs/<feature>.md`)
- **Threat model**: STRIDE document in `docs/security/threats/<feature>.md`

## Checklist before starting a task

1. Does a spec exist in `docs/specs/`? If not, write it first.
2. Which slice / bounded context does this belong to? If creating a new one, justify.
3. Is there an architectural decision involved? If so, ADR in `docs/adr/`.
4. Is there a new or changed API contract? Update `docs/api/openapi.yaml`
   (or `asyncapi.yaml`) before the handler.
5. New attack surface? Quick threat model (STRIDE) and adjust authz,
   validation, rate limiting, and DB-level access control.

## Definition of Done

Stack-agnostic — concrete commands live in `## Commands`. The criteria
below apply to any language or framework.

Before marking a PR as ready for review:

- [ ] Spec in `docs/specs/` updated (if feature is new or changed)
- [ ] ADR created (if there was an architectural decision)
- [ ] OpenAPI/AsyncAPI updated (if API contract changed)
- [ ] All tests passing (see `## Commands`)
- [ ] Lint + typecheck green (see `## Commands`)
- [ ] Coverage ≥ 80% in `domain/` and `application/` (see `## Commands`)
- [ ] No secrets, credentials, or PII in logs, commits, or git history
- [ ] CHANGELOG.md updated (if user-facing)
- [ ] Threat model updated (if attack surface changed)
- [ ] Diátaxis docs updated (if it affects public usage of the feature)
- [ ] Migration rollback tested (if any migration was added)