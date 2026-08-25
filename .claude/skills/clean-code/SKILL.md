---
name: clean-code
description: General code-quality discipline for this project — file size, naming, dead code, duplication, justified abstraction. Apply continuously while writing or editing any code.
---

# Clean code discipline

## Apply when
Writing or editing any file in this repo — this is a baseline, not a one-off checklist.

## Rules

1. **Small, focused files.** A file does one thing: one component, one hook, one service
   module, one schema group. If a file is doing UI + fetching + business rules, that's a
   signal to split it along the layers in `react-project-architecture`.
2. **Meaningful, unambiguous naming.** `getExpiringBatches(days: number)`, not
   `getData(n)`. Booleans read as a yes/no question (`isExpired`, `canDelete`). Avoid
   abbreviations that aren't domain-standard (`qty` for quantity is fine in this domain;
   `pd` for product is not).
3. **No dead code.** Remove unused exports, unused components, unused branches — don't
   leave them "in case they're needed later." Git history is the place for that, not the
   working tree.
4. **No commented-out code.** Delete it. If it's genuinely useful context, write a real
   comment explaining a decision, not a fossilized code snippet.
5. **No duplicated business rules.** If "how do we know a batch is expiring soon" or "how
   do we format VND" is implemented more than once, that's a bug waiting to happen when one
   copy is updated and the other isn't — extract to one utility and reuse it.
6. **Justify new abstractions.** Don't build a generic/configurable version of something
   until there are at least two real call sites that need the variation. A speculative
   `<GenericEntityForm>` built for one form is premature; a shared `<FormField>` wrapper
   used by ten forms is earned.
7. **Comments explain *why*, not *what*.** Code should be readable enough that a comment
   restating it is unnecessary; reserve comments for non-obvious business reasoning ("FEFO
   order required by store policy, not just convenience") or a documented workaround.
8. **Consistent formatting via the existing tooling** (ESLint) — don't hand-format against
   what the linter/formatter would produce.
9. **Functions do one thing at one level of abstraction.** A function that both fetches
   data and formats it for display is doing two jobs — split it.
10. **Prefer editing existing files over creating new ones for a small addition** — check if
    a new piece of logic belongs in an existing, related file before creating a new one for
    it (but still respect the layering/size rules above).

## Anti-patterns to reject in review

- A 500-line "utils.ts" grab-bag with unrelated helpers.
- Two different files computing "is this batch expiring soon" with slightly different
  thresholds.
- A generic, heavily-configurable component built for a single current use case.
- Large blocks of commented-out old implementation left "just in case."
