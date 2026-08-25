---
name: code-review-checklist
description: Project-specific checklist for reviewing changes in this repo before considering them done — architecture, types, business rules, security, UX states. Distinct from the built-in /code-review command; use this as the mental checklist while implementing or self-reviewing a change here.
---

# Code review checklist (this project)

## Apply when
Finishing an implementation task and self-reviewing before calling it done, or reviewing
someone else's change in this repo. (This is a project-specific checklist to apply while
working — for the interactive multi-effort review workflow, use the `/code-review` command
instead; this skill is deliberately named to avoid colliding with it.)

## Checklist

**Architecture**
- [ ] New code lives in the right layer (`api`/`hooks`/`schemas`/`types`/`utils`/`components`)
      per `react-project-architecture`.
- [ ] No component calls Supabase directly (`supabase-react`).
- [ ] No new top-level folder or pattern invented without checking existing conventions
      first (CLAUDE.md §9).

**Types**
- [ ] No `any`, no unjustified `as` casts (`typescript-strict`).
- [ ] Domain entities have explicit types; state with real variants uses a discriminated
      union.

**Server state / client state**
- [ ] Server data is in TanStack Query, not duplicated into Zustand or local state
      (`react-query`, `zustand`).
- [ ] Query keys follow the feature's key factory; invalidation is scoped, not global.

**Forms**
- [ ] Zod schema backs the form; validation messages are in Vietnamese
      (`react-hook-form-zod`).
- [ ] Money fields are integer VND; date fields enforce domain rules (expiry > manufacture).

**Business rules**
- [ ] No floating-point money math anywhere in the diff.
- [ ] Stock/batch logic respects FEFO where it allocates against expiry.
- [ ] A business rule isn't duplicated in two places (one util/service, reused).

**Security**
- [ ] No secrets committed; no service-role key in client code (`frontend-security`).
- [ ] File uploads validate MIME + size (`supabase-storage`, `file-upload`).
- [ ] Authorization-sensitive logic isn't "frontend-only" — RLS exists or is noted as a
      follow-up (`supabase-auth`).

**UX states**
- [ ] Loading, error, and empty states are handled explicitly, not assumed away.
- [ ] Destructive actions require confirmation.
- [ ] New tables are paginated/filterable, not unbounded (`table-data-grid`,
      `frontend-performance`).

**Code quality**
- [ ] No dead code, no commented-out code left behind.
- [ ] Components stay focused; nothing ballooned into a 300+ line mixed-concern file.
- [ ] Naming matches CLAUDE.md §4 conventions.

**Verification**
- [ ] `yarn lint` passes.
- [ ] `yarn build` (which runs `tsc -b`) passes with no new type errors.
- [ ] Relevant tests added/updated and passing, once a test runner exists.

## Anti-patterns to reject

- Marking a task done without actually running lint/build.
- A review that only checks "does it look right in the browser" and skips the type/security/
  business-rule checklist above.
