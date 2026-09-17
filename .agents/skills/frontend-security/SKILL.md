---
name: frontend-security
description: Frontend security rules for this project — secrets handling, input validation, file upload safety, XSS avoidance, RLS as the real authorization boundary. Apply whenever handling user input, files, secrets, or auth-sensitive UI.
---

# Frontend security rules

## Apply when
Handling any user input, file upload, secret/env var, or authorization-sensitive UI
decision.

## Rules

1. **Never commit secrets.** `.env` is gitignored; only `.env.example` (placeholder values)
   is committed. Only `VITE_`-prefixed, anon/publishable-safe values ever reach client code.
   The Supabase service role key never appears under `src/` or in any client bundle.
2. **Frontend authorization checks are UX only.** Hiding a button or route from a
   non-privileged user does not substitute for a Postgres RLS policy — every sensitive
   table/action must be enforced server-side (see `supabase-auth`, `supabase-database`).
3. **Validate all user input at the boundary** with Zod schemas before it reaches a mutation
   (see `react-hook-form-zod`) — even though RLS is the real gate, this catches mistakes
   early and gives good error messages. Never trust a value from a form, URL param, or query
   string without validating its shape.
4. **File upload safety** (see `supabase-storage`, `file-upload`): allow-list MIME types,
   enforce max size, never trust the client-reported filename/extension alone, generate
   storage keys server-side or via `crypto.randomUUID()`.
5. **No `dangerouslySetInnerHTML`** without a sanitizer (e.g. DOMPurify) and a documented
   reason. Default to rendering plain text/React children; this app has no clear need for
   rendering arbitrary HTML.
6. **Treat every route param and query string value as attacker-controllable.** An order ID
   or product ID from the URL is validated (format) and authorized (via RLS on the fetch),
   never assumed safe because "it came from our own link."
7. **No sensitive data in client-side logs.** Don't `console.log` full customer records,
   payment details, or auth tokens, even temporarily during development — remove before
   committing.
8. **Escape/parameterize, never string-concatenate, anything that becomes a query filter**
   — use Supabase's query builder methods (`.eq()`, `.match()`), not manually built filter
   strings from raw user input.
9. **CSRF/session:** rely on Supabase Auth's own token handling; don't hand-roll cookie or
   token storage.
10. **Dependencies:** don't add a package to handle something the existing stack already
    covers (see CLAUDE.md §2) — every extra dependency is extra attack surface.

## Anti-patterns to reject in review

- An env var without `VITE_` prefix accidentally holding a secret that then gets exposed
  because Vite only strips non-`VITE_` vars from `import.meta.env`, not from anywhere a
  dev might've hardcoded it — always double check nothing sensitive is prefixed `VITE_`.
- A "download invoice" link built from a public Storage URL for what should be a private,
  signed-URL-only document.
- `dangerouslySetInnerHTML={{ __html: userSuppliedNote }}` for a customer note field.
- A delete button that's simply hidden by role client-side with no RLS policy backing it.
