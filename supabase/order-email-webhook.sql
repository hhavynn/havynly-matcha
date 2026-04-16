-- Creates/replaces the database webhook that calls the order email Edge Function.
--
-- This uses Supabase's database webhook mechanism, which is implemented as a
-- Postgres trigger that calls supabase_functions.http_request asynchronously.
--
-- Safe to run more than once.

drop trigger if exists send_order_notification_webhook on public.orders;

create trigger send_order_notification_webhook
  after insert on public.orders
  for each row
  execute function supabase_functions.http_request(
    'https://vvcfutqaludytjwbduan.supabase.co/functions/v1/send-order-notification',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '5000'
  );
