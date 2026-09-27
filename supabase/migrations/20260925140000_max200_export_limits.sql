-- 2026-09-25 round: three operator requests in one migration.
--
-- 1. MAX 200 cards per queue (was 100) — table constraint + RPC guard.
-- 2. Export fix: read_auction_snapshot was returning EVERY row of EVERY
--    table — with accumulated test data it hit the Supabase function
--    timeout (57014 "canceling statement due to statement timeout").
--    Now bounded per table (bids 50k, events 5k, everything else 10k) —
--    more than any real auction produces in 1 day of retention.
-- 3. Cleanup stays 30d in the RPC (flexible); the BOT default changes to
--    1 day (BOT_CLEANUP_DAYS env, see bot/service.mjs).
begin;

-- ---------------------------------------------------------------------------
-- 1) Max 200 items per queue (was 100).
-- ---------------------------------------------------------------------------
alter table public.auction_publish_queues
  drop constraint if exists auction_publish_queues_total_items_check;
alter table public.auction_publish_queues
  add constraint auction_publish_queues_total_items_check
  check (total_items between 1 and 200);

-- ---------------------------------------------------------------------------
-- 2) read_auction_snapshot: LATEST body is 20260923093000 (which added the 3
--    warning tables). Copied VERBATIM with ONLY the marked addition: every
--    jsonb_agg gets a bounded subselect (LIMIT) so a big test database can
--    never hit the function timeout again.
-- ----------------------------------------------------------------------------
create or replace function public.read_auction_snapshot() returns jsonb
language sql stable security invoker set search_path='' as $body$
 select jsonb_build_object(
  'cards',coalesce((
    select jsonb_agg(x order by id)
    from (select * from public.cards limit 10000) x
  ),'[]'::jsonb),
  'participants',coalesce((
    select jsonb_agg(x order by id)
    from (select * from public.participants limit 10000) x
  ),'[]'::jsonb),
  'participant_identities',coalesce((
    select jsonb_agg(x order by identity)
    from (select * from public.participant_identities limit 10000) x
  ),'[]'::jsonb),
  'auctions',coalesce((
    select jsonb_agg(x order by created_at desc)
    from (select * from public.auctions limit 10000) x
  ),'[]'::jsonb),
  'bids',coalesce((
    select jsonb_agg(x order by processed_at desc)
    from (select * from public.bids limit 50000) x
  ),'[]'::jsonb),
  'purchases',coalesce((
    select jsonb_agg(x order by id)
    from (select * from public.purchases limit 10000) x
  ),'[]'::jsonb),
  'payments',coalesce((
    select jsonb_agg(x order by id)
    from (select * from public.payments limit 10000) x
  ),'[]'::jsonb),
  'deliveries',coalesce((
    select jsonb_agg(x order by id)
    from (select * from public.deliveries limit 10000) x
  ),'[]'::jsonb),
  'warnings',coalesce((
    select jsonb_agg(x order by id)
    from (select * from public.warnings limit 10000) x
  ),'[]'::jsonb),
  'value_change_log',coalesce((
    select jsonb_agg(t order by occurred_at desc,id desc)
    from (select * from public.value_change_log limit 10000) t
  ),'[]'::jsonb),
  'participant_warnings',coalesce((
    select jsonb_agg(t order by created_at desc,id desc)
    from (select * from public.participant_warnings limit 10000) t
  ),'[]'::jsonb),
  'admin_notifications',coalesce((
    select jsonb_agg(t order by created_at desc,id desc)
    from (select * from public.admin_notifications limit 5000) t
  ),'[]'::jsonb),
  'auction_events',coalesce((
    select jsonb_agg(t order by created_at desc,id desc)
    from (select * from public.auction_events limit 5000) t
  ),'[]'::jsonb),
  'processed_commands',coalesce((
    select jsonb_agg(t order by external_event_id)
    from (select * from public.processed_commands limit 10000) t
  ),'[]'::jsonb),
  'whatsapp_groups',coalesce((
    select jsonb_agg(x order by id)
    from (select * from public.whatsapp_groups limit 1000) x
  ),'[]'::jsonb),
  'whatsapp_dispatches',coalesce((
    select jsonb_agg(x order by id)
    from (select * from public.whatsapp_dispatches limit 10000) x
  ),'[]'::jsonb),
  'auction_publish_queues',coalesce((
    select jsonb_agg(x order by id)
    from (select * from public.auction_publish_queues limit 1000) x
  ),'[]'::jsonb),
  'whatsapp_vote_state',coalesce((
    select jsonb_agg(x order by auction_id, voter_jid)
    from (select * from public.whatsapp_vote_state limit 50000) x
  ),'[]'::jsonb),
  'whatsapp_quick_polls',coalesce((
    select jsonb_agg(t order by created_at desc,id desc)
    from (select * from public.whatsapp_quick_polls limit 500) t
  ),'[]'::jsonb),
  'payment_reminders',coalesce((
    select jsonb_agg(t order by last_reminded_at desc nulls last)
    from (select * from public.payment_reminders limit 5000) t
  ),'[]'::jsonb)
 );
$body$;
revoke execute on function public.read_auction_snapshot() from public,anon,authenticated;
grant execute on function public.read_auction_snapshot() to service_role;

commit;
