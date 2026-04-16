# send-order-notification

Supabase Edge Function that receives an `orders` insert webhook and sends a plain-text email through the Resend SDK.

## Required secrets

Set these in the Supabase project for this function:

- `RESEND_API_KEY`
- `ORDER_NOTIFICATION_TO_EMAIL`
- `ORDER_NOTIFICATION_FROM_EMAIL`

`ORDER_NOTIFICATION_FROM_EMAIL` should use a sender on a verified Resend domain for production.

The function also relies on built-in Supabase secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deploy

```bash
supabase functions deploy send-order-notification
```

## Local serve

```bash
supabase functions serve send-order-notification --no-verify-jwt
```

## Expected webhook payload

This function is intended to be called by a Supabase database webhook configured for:

- Table: `public.orders`
- Events: `INSERT`

The webhook should post the inserted row as `record`.

The function uses `new-order/{order_id}` as the Resend idempotency key so webhook retries do not send duplicate emails for the same order within Resend's idempotency window.

## Database webhook SQL

If the Dashboard webhook is missing or unreliable, run:

```sql
-- supabase/order-email-webhook.sql
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
```
