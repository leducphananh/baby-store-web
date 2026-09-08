-- Phase 8.2 — Low-stock & Out-of-stock Alerts.
--
-- Improves on Phase 8.1's coarse "count[:value]" fingerprint (documented
-- limitation: couldn't detect a changed affected-product SET at the same
-- count) with a fingerprint built from stable product identity, AND solves
-- the harder same-set-reoccurrence problem (requirement §21/§22) with a
-- small store-wide occurrence-lifecycle table — without any cron,
-- trigger, or Realtime: the lifecycle bookkeeping is a side effect of
-- calling this same read RPC (a "materialize on read" upsert), which
-- already happens on every Bell mount, Dashboard visit, Alert Center
-- visit, and mutation-triggered refetch. No background job was added.
--
-- Authoritative source: `product_inventory_overview.stock_status`
-- (Phase 7.5) — this function does not recompute quantity/threshold
-- logic; it only groups that view's own already-correct classification
-- by status and reads product identity out of it.
--
-- alert_condition_states is STORE-WIDE (no user_id) — deliberately
-- distinct from Phase 8.1's per-user `alert_read_states`. It tracks only
-- lifecycle metadata (is this condition currently active, and which
-- "occurrence" of it is this), never a business count/value as source of
-- truth. RLS matches this schema's own established convention for shared
-- business/operational tables (`orders_all`, `profiles_all`, etc.): any
-- authenticated user, full access — this is internal bookkeeping with no
-- per-user sensitivity, not personal interaction state like
-- `alert_read_states`.
create table public.alert_condition_states (
  alert_key text primary key,
  fingerprint text not null,
  is_active boolean not null default false,
  occurrence_version integer not null default 0,
  activated_at timestamptz,
  resolved_at timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.alert_condition_states is
  'Store-wide operational-alert occurrence lifecycle (Phase 8.2). occurrence_version increments only on an inactive->active transition, so a condition that resolves and later reoccurs with the exact same affected-entity set still produces a different fingerprint (fixing the same-set-reoccurrence gap Phase 8.1 could not solve). Never stores business counts/values as source of truth — those always come fresh from product_inventory_overview.';

alter table public.alert_condition_states enable row level security;

create policy alert_condition_states_all on public.alert_condition_states
  for all to authenticated
  using (true)
  with check (true);

revoke all on public.alert_condition_states from public;
revoke all on public.alert_condition_states from anon;
grant select, insert, update on public.alert_condition_states to authenticated;

-- ============================================================
-- get_inventory_alert_conditions(): the one place inventory alert
-- occurrence data is computed. Returns one row per inventory alert type
-- (currently out_of_stock/low_stock; Phase 8.3 can add expiry rows to the
-- same VALUES list without a redesign), each with a fingerprint that
-- changes whenever EITHER the affected product-id set changes OR the
-- condition just reactivated after being fully resolved.
-- ============================================================
create or replace function public.get_inventory_alert_conditions()
returns table (
  alert_type text,
  affected_count integer,
  fingerprint text,
  sample_product_names text[]
)
language plpgsql
security invoker
set search_path to 'public'
as $function$
declare
  v_source record;
  v_prev_version integer;
  v_prev_active boolean;
  v_now_active boolean;
  v_new_version integer;
  v_ids_joined text;
  v_fingerprint text;
  v_activated_at timestamptz;
  v_resolved_at timestamptz;
begin
  for v_source in
    select
      status_row.alert_type,
      coalesce(array_agg(v.product_id order by v.product_id) filter (where v.product_id is not null), '{}')::uuid[] as ids,
      coalesce((array_agg(v.name order by v.name) filter (where v.product_id is not null))[1:3], '{}')::text[] as sample_names
    from (values ('inventory_out_of_stock', 'out_of_stock'), ('inventory_low_stock', 'low_stock'))
      as status_row(alert_type, stock_status)
    left join public.product_inventory_overview v on v.stock_status = status_row.stock_status
    group by status_row.alert_type
  loop
    v_ids_joined := array_to_string(v_source.ids, ',');
    v_now_active := coalesce(array_length(v_source.ids, 1), 0) > 0;

    select s.occurrence_version, s.is_active into v_prev_version, v_prev_active
    from public.alert_condition_states s
    where s.alert_key = v_source.alert_type;

    if not found then
      v_prev_version := 0;
      v_prev_active := false;
    end if;

    if v_now_active and not v_prev_active then
      v_new_version := v_prev_version + 1;
    else
      v_new_version := v_prev_version;
    end if;

    -- Fingerprint = occurrence version + the affected id set — either one
    -- changing on its own is enough to make this differ from a previously
    -- stored read-state fingerprint (requirement §13/§14/§22).
    v_fingerprint := v_new_version::text || ':' || v_ids_joined;

    v_activated_at := case when v_now_active and not v_prev_active then now() else null end;
    v_resolved_at := case when (not v_now_active) and v_prev_active then now() else null end;

    insert into public.alert_condition_states
      (alert_key, fingerprint, is_active, occurrence_version, activated_at, resolved_at, updated_at)
    values
      (v_source.alert_type, v_fingerprint, v_now_active, v_new_version, v_activated_at, v_resolved_at, now())
    on conflict (alert_key) do update set
      fingerprint = excluded.fingerprint,
      is_active = excluded.is_active,
      occurrence_version = excluded.occurrence_version,
      activated_at = coalesce(excluded.activated_at, public.alert_condition_states.activated_at),
      resolved_at = coalesce(excluded.resolved_at, public.alert_condition_states.resolved_at),
      updated_at = now();

    alert_type := v_source.alert_type;
    affected_count := coalesce(array_length(v_source.ids, 1), 0);
    fingerprint := v_fingerprint;
    sample_product_names := v_source.sample_names;
    return next;
  end loop;
end;
$function$;

comment on function public.get_inventory_alert_conditions() is
  'Current out_of_stock/low_stock alert occurrence data, grouped from product_inventory_overview.stock_status (Phase 7.5 authoritative semantics, not recomputed here). Side effect: upserts alert_condition_states to track occurrence_version, so a fully-resolved-then-reoccurring condition gets a fresh fingerprint even if the affected product set is identical to before. No cron/trigger/Realtime — this runs only when a caller queries current alert conditions.';

revoke all on function public.get_inventory_alert_conditions() from public;
revoke all on function public.get_inventory_alert_conditions() from anon;
grant execute on function public.get_inventory_alert_conditions() to authenticated;
