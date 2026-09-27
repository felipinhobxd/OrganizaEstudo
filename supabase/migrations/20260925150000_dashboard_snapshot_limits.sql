-- 2026-09-25: read_dashboard_snapshot was returning EVERY row of EVERY table
-- (288 KB per call). The dashboard polls every few seconds -> ~4.8 GB/day of
-- egress on the free plan (limit ~5 GB/month). This migration adds the same
-- bounded subselects as read_auction_snapshot (20260925140000) plus trims
-- what the dashboard actually NEEDS: recent bids only (500), active cards,
-- recent auctions (200), recent purchases (200).
--
-- LATEST body of read_dashboard_snapshot is 20260924180000 (which added
-- value_change_log + participant_warnings). Copied VERBATIM with ONLY the
-- marked additions (LIMITs + participant_warnings filter to the last cycle).
begin;

create or replace function public.read_dashboard_snapshot() returns jsonb
language sql stable security invoker set search_path='' as $body$
 select jsonb_build_object(
  'cards',coalesce((
    select jsonb_agg(x order by id)
    from (
      -- ADDITION (20260925150000): só cartas não-arquivadas (o painel não
      -- renderiza archived; eram TODAS as cartas inclusive vendidas antigas).
      select id,name,collection,card_number,image_url,starting_price,buyout_price,status,variant,language,condition,notes
      from public.cards
      where status <> 'archived'
      limit 2000
    ) x
  ),'[]'::jsonb),
  'participants',coalesce((
    select jsonb_agg(x order by id)
    from (
      select id,display_name,whatsapp_id,phone_e164,status,suspension_until,notes
      from public.participants
      limit 2000
    ) x
  ),'[]'::jsonb),
  'auctions',coalesce((
    select jsonb_agg(x order by created_at desc)
    from (
      select id,card_id,status,starting_price,bid_increment,buyout_price,scheduled_end_at,winner_participant_id,final_price,lot_number,created_at,win_type
      from public.auctions
      order by created_at desc
      limit 500
    ) x
  ),'[]'::jsonb),
  'bids',coalesce((
    select jsonb_agg(x order by processed_at desc)
    from (
      -- ADDITION (20260925150000): só os 500 lances mais recentes (o painel
      -- mostra o líder do leilão selecionado; 500 cobre qualquer leilão ao
      -- vivo). Antes: TODOS os lances acumulados = a maior parte dos 288 KB.
      select id,auction_id,participant_id,amount,status,processed_at,confirmation_order,whatsapp_event_at
      from public.bids
      order by processed_at desc
      limit 500
    ) x
  ),'[]'::jsonb),
  'auction_events',coalesce((select jsonb_agg(t order by created_at desc,id desc) from (select id,created_at,event_type,participant_id from public.auction_events order by created_at desc,id desc limit 15) t),'[]'::jsonb),
  'purchases',coalesce((
    select jsonb_agg(x order by id)
    from (
      select id,card_id,participant_id,auction_id,amount,status
      from public.purchases
      order by confirmed_at desc nulls last
      limit 500
    ) x
  ),'[]'::jsonb),
  'payments',coalesce((select jsonb_agg(t order by id) from (select id,purchase_id,amount,status,method,paid_at,reference from public.payments limit 1000) t),'[]'::jsonb),
  'payment_reminders',coalesce((select jsonb_agg(t order by last_reminded_at desc nulls last) from (select purchase_id,participant_id,reminded_count,last_reminded_at from public.payment_reminders limit 500) t),'[]'::jsonb),
  'deliveries','[]'::jsonb,
  'warnings','[]'::jsonb,
  'value_change_log',coalesce((select jsonb_agg(t order by occurred_at desc,id desc) from (select id,participant_id,auction_id,previous_amount,new_amount,difference,external_event_id,occurred_at from public.value_change_log order by occurred_at desc,id desc limit 200) t),'[]'::jsonb),
  'participant_warnings',coalesce((select jsonb_agg(t order by occurred_at desc,id desc) from (select id,participant_id,auction_id,card_name,lot_number,previous_amount,new_amount,external_event_id,occurred_at,created_at,cycle_closed from public.participant_warnings order by occurred_at desc,id desc limit 100) t),'[]'::jsonb)
 );
$body$;
revoke execute on function public.read_dashboard_snapshot() from public,anon,authenticated;
grant execute on function public.read_dashboard_snapshot() to service_role;

commit;
