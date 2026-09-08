-- Phase 8.3 — Expiry Alerts.
--
-- Extracts Phase 8.2's inline occurrence-lifecycle upsert into one shared
-- helper (`_advance_alert_occurrence`) so `get_inventory_alert_conditions()`
-- and the new `get_expiry_alert_conditions()` share IDENTICAL lifecycle
-- semantics rather than two independently-maintained copies (requirement
-- §25/§104) — same store-wide `alert_condition_states` table, no schema
-- change needed there (it was already keyed by a generic `alert_key text`).
-- `get_inventory_alert_conditions()` is re-created to call the helper; its
-- external behavior (return shape, fingerprint format, reconciliation with
-- get_inventory_value_summary()) is unchanged — verified by regression
-- test after this migration, not just by inspection.
--
-- The helper is SECURITY INVOKER and granted to `authenticated`, same as
-- every RPC that calls it — exposing it as a directly-callable RPC adds no
-- new capability beyond what `alert_condition_states`'s own RLS already
-- grants any authenticated user (direct table INSERT/UPDATE), per this
-- schema's established flat-trust, single-store convention.
create or replace function public._advance_alert_occurrence(
  p_alert_key text,
  p_ids_joined text,
  p_now_active boolean
) returns text
language plpgsql
security invoker
set search_path to 'public'
as $function$
declare
  v_prev_version integer;
  v_prev_active boolean;
  v_new_version integer;
  v_fingerprint text;
  v_activated_at timestamptz;
  v_resolved_at timestamptz;
begin
  select s.occurrence_version, s.is_active into v_prev_version, v_prev_active
  from public.alert_condition_states s
  where s.alert_key = p_alert_key;

  if not found then
    v_prev_version := 0;
    v_prev_active := false;
  end if;

  -- occurrence_version increments ONLY on inactive -> active (a fully
  -- resolved condition reoccurring, even with the identical entity set) —
  -- never on active -> active (a merely-changed entity set is already
  -- covered by p_ids_joined differing), and never on repeated reads of an
  -- unchanged condition (requirement §87/§88/§89: idempotent, no churn).
  if p_now_active and not v_prev_active then
    v_new_version := v_prev_version + 1;
  else
    v_new_version := v_prev_version;
  end if;

  v_fingerprint := v_new_version::text || ':' || p_ids_joined;
  v_activated_at := case when p_now_active and not v_prev_active then now() else null end;
  v_resolved_at := case when (not p_now_active) and v_prev_active then now() else null end;

  insert into public.alert_condition_states
    (alert_key, fingerprint, is_active, occurrence_version, activated_at, resolved_at, updated_at)
  values
    (p_alert_key, v_fingerprint, p_now_active, v_new_version, v_activated_at, v_resolved_at, now())
  on conflict (alert_key) do update set
    fingerprint = excluded.fingerprint,
    is_active = excluded.is_active,
    occurrence_version = excluded.occurrence_version,
    activated_at = coalesce(excluded.activated_at, public.alert_condition_states.activated_at),
    resolved_at = coalesce(excluded.resolved_at, public.alert_condition_states.resolved_at),
    updated_at = now();

  return v_fingerprint;
end;
$function$;

revoke all on function public._advance_alert_occurrence(text, text, boolean) from public;
revoke all on function public._advance_alert_occurrence(text, text, boolean) from anon;
grant execute on function public._advance_alert_occurrence(text, text, boolean) to authenticated;

-- Re-create get_inventory_alert_conditions() to call the shared helper
-- (refactor only — same predicates from product_inventory_overview, same
-- return shape, same fingerprint format as before this migration).
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
  v_ids_joined text;
  v_now_active boolean;
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

    alert_type := v_source.alert_type;
    affected_count := coalesce(array_length(v_source.ids, 1), 0);
    fingerprint := public._advance_alert_occurrence(v_source.alert_type, v_ids_joined, v_now_active);
    sample_product_names := v_source.sample_names;
    return next;
  end loop;
end;
$function$;

-- ============================================================
-- get_expiry_alert_conditions(): expired / expiring-soon / missing-expiry
-- occurrence data. Predicates copied VERBATIM from get_expiry_summary()/
-- get_expiry_batch_list() (Phase 7.6) — same `remaining_quantity > 0`
-- eligibility, same Vietnam-business-date arithmetic, same three-way
-- classification — to guarantee zero semantic drift and exact
-- reconciliation, rather than re-deriving the rule a third time. Batch
-- identity is `product_batches.id` (never `product_id` — one product can
-- have both an expired batch and a fresh one; requirement §8/§9).
--
-- `p_horizon_days` defaults to 30 (the same `EXPIRING_SOON_DAYS` default
-- Phase 4/7.6 already use) but the frontend always passes it explicitly
-- from the one shared `ALERT_EXPIRY_HORIZON_DAYS` constant
-- (`use-operational-alerts.ts`) — this is the app's one fixed *operational*
-- horizon, never the Expiry Report's user-selectable 7/30/60/90 analysis
-- horizon (requirement §13/§14/§15/§16).
create or replace function public.get_expiry_alert_conditions(p_horizon_days integer default 30)
returns table (
  alert_type text,
  affected_count integer,
  fingerprint text,
  sample_previews text[]
)
language plpgsql
security invoker
set search_path to 'public'
as $function$
declare
  v_business_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_source record;
  v_ids_joined text;
  v_now_active boolean;
begin
  for v_source in
    select
      status_row.alert_type,
      coalesce(array_agg(b.batch_id order by b.batch_id) filter (where b.batch_id is not null), '{}')::uuid[] as ids,
      coalesce(
        (array_agg(
          coalesce(p.name, '(lô không gắn sản phẩm)') ||
          case when b.lot_number is not null then ' — Lô ' || b.lot_number else '' end
          order by b.expiration_date asc nulls first, b.batch_id
        ) filter (where b.batch_id is not null))[1:3],
        '{}'
      )::text[] as previews
    from (values ('inventory_expired'), ('inventory_expiring_soon'), ('inventory_missing_expiry'))
      as status_row(alert_type)
    left join lateral (
      select pb.id as batch_id, pb.expiration_date, pb.lot_number, pb.product_id
      from public.product_batches pb
      where pb.remaining_quantity > 0
        and (
          (status_row.alert_type = 'inventory_expired'
            and pb.expiration_date is not null and pb.expiration_date < v_business_today)
          or (status_row.alert_type = 'inventory_expiring_soon'
            and pb.expiration_date is not null
            and pb.expiration_date >= v_business_today
            and pb.expiration_date <= v_business_today + p_horizon_days)
          or (status_row.alert_type = 'inventory_missing_expiry'
            and pb.expiration_date is null)
        )
    ) b on true
    left join public.products p on p.id = b.product_id
    group by status_row.alert_type
  loop
    v_ids_joined := array_to_string(v_source.ids, ',');
    v_now_active := coalesce(array_length(v_source.ids, 1), 0) > 0;

    alert_type := v_source.alert_type;
    affected_count := coalesce(array_length(v_source.ids, 1), 0);
    fingerprint := public._advance_alert_occurrence(v_source.alert_type, v_ids_joined, v_now_active);
    sample_previews := v_source.previews;
    return next;
  end loop;
end;
$function$;

comment on function public.get_expiry_alert_conditions(integer) is
  'Current expired/expiring-soon/missing-expiry alert occurrence data (Phase 8.3), predicates copied verbatim from get_expiry_summary()/get_expiry_batch_list() (Phase 7.6) — remaining_quantity > 0 eligibility, Vietnam business-date arithmetic, mutually exclusive classification. Batch identity (product_batches.id), not product_id. Side effect: upserts alert_condition_states via _advance_alert_occurrence(), same lifecycle mechanism as get_inventory_alert_conditions() (Phase 8.2).';

revoke all on function public.get_expiry_alert_conditions(integer) from public;
revoke all on function public.get_expiry_alert_conditions(integer) from anon;
grant execute on function public.get_expiry_alert_conditions(integer) to authenticated;
