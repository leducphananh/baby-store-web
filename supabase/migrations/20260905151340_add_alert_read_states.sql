-- Phase 8.1 — Alert Foundation.
--
-- Stores ONLY user interaction state (has this person seen this alert
-- condition, and as of which occurrence) — never the underlying business
-- fact itself (requirement §14/§26). The business condition ("84 products
-- out of stock") is always derived live from Phase 7.5/7.6's own
-- authoritative summary RPCs; this table never mirrors a count/value.
--
-- One row per (user, alert_key) via the unique constraint below, upserted
-- on every "mark read" — never deleted/recreated. `fingerprint` is what
-- makes recurrence work without a history table (requirement §20/§21):
-- reading the alert stores the fingerprint of the occurrence just seen; if
-- the live fingerprint later differs (the condition changed), the stored
-- row is simply stale and the alert is unread again, with no cleanup job
-- needed (requirement §60). For Phase 8.1's aggregate, count-based alert
-- types, `fingerprint` is `"<count>:<value>"` — an intentionally coarse
-- signal (documented limitation: it cannot distinguish "same N entities
-- still affected" from "a different N entities now affected"; entity-level
-- alerts introduced in Phase 8.2/8.3 should upgrade this to a hash of the
-- affected entity ids for exactness — requirement §22 explicitly allows
-- deferring that until concrete entity-level providers exist).
--
-- RLS is genuinely `auth.uid()`-scoped (`user_id = auth.uid()`) — the
-- first such per-row-owner policy in this schema. Every other table here
-- intentionally grants any authenticated staff member full access (a
-- flat-trust, single-store admin app, see `profiles_all`/`order_payments_all`),
-- which is correct for shared business data but wrong for personal "have I
-- seen this" state (requirement §71/§72): User A marking an alert read
-- must never affect what User B sees as unread.
create table public.alert_read_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alert_key text not null,
  fingerprint text not null,
  read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, alert_key)
);

comment on table public.alert_read_states is
  'Per-user "have I seen this operational alert occurrence" state (Phase 8.1). Never stores business counts/values — those are always derived live from Phase 7.5/7.6 report RPCs. One row per (user_id, alert_key); fingerprint changing makes a stale read become unread again without any cleanup job.';

alter table public.alert_read_states enable row level security;

create policy alert_read_states_select on public.alert_read_states
  for select to authenticated
  using (user_id = auth.uid());

create policy alert_read_states_insert on public.alert_read_states
  for insert to authenticated
  with check (user_id = auth.uid());

create policy alert_read_states_update on public.alert_read_states
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy alert_read_states_delete on public.alert_read_states
  for delete to authenticated
  using (user_id = auth.uid());

revoke all on public.alert_read_states from public;
revoke all on public.alert_read_states from anon;
grant select, insert, update, delete on public.alert_read_states to authenticated;
