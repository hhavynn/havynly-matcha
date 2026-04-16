# send-order-notification

Supabase Edge Function that receives an `orders` insert webhook and sends a plain-text email through Resend.

## Required secrets

Set these in the Supabase project for this function:

- `RESEND_API_KEY`
- `ORDER_NOTIFICATION_TO_EMAIL`
- `ORDER_NOTIFICATION_FROM_EMAIL`

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
