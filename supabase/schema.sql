-- ============================================================
-- havynly-matcha database schema
-- Run this in Supabase: Dashboard → SQL Editor → New query
-- ============================================================


-- ── menu_items ────────────────────────────────────────────────
create table menu_items (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  description  text        not null,
  price_cents  integer     not null,           -- e.g. 595 = $5.95
  tags         text[]      not null default '{}',
  is_available boolean     not null default true,
  sort_order   integer     not null default 0,  -- controls display order
  created_at   timestamptz not null default now()
);

-- Customers can read the menu; no public writes
alter table menu_items enable row level security;
create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select
    auth.role() = 'authenticated'
    and lower(coalesce(auth.jwt() ->> 'email', '')) = lower('your-admin-email@example.com')
$$;

create policy "Public read menu items"
  on menu_items for select using (true);
create policy "Admin insert menu items"
  on menu_items for insert with check (public.is_admin_user());
create policy "Admin update menu items"
  on menu_items for update using (public.is_admin_user()) with check (public.is_admin_user());
create policy "Admin delete menu items"
  on menu_items for delete using (public.is_admin_user());


-- ── orders ────────────────────────────────────────────────────
create table orders (
  id             uuid        primary key default gen_random_uuid(),
  customer_name  text        not null,
  menu_item_id   uuid        not null references menu_items(id),
  notes          text,                          -- nullable
  status         text        not null default 'new'
    check (status in ('new', 'in_progress', 'completed')),
  created_at     timestamptz not null default now()
);

-- Customers can insert orders; only the signed-in admin can read/update
alter table orders enable row level security;
create policy "Public insert orders"
  on orders for insert with check (true);
create policy "Admin read orders"
  on orders for select using (public.is_admin_user());
create policy "Admin update orders"
  on orders for update using (public.is_admin_user()) with check (public.is_admin_user());


-- ── app_settings ──────────────────────────────────────────────
-- Simple key/value store for global flags (shop open, announcements, etc.)
create table app_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- Public can only read safe customer-facing settings; admin can read/write all settings
alter table app_settings enable row level security;
create policy "Public read settings"
  on app_settings for select using (key in ('shop_open', 'shop_is_open', 'shop_status_message'));
create policy "Admin read settings"
  on app_settings for select using (public.is_admin_user());
create policy "Admin insert settings"
  on app_settings for insert with check (public.is_admin_user());
create policy "Admin update settings"
  on app_settings for update using (public.is_admin_user()) with check (public.is_admin_user());


-- ── seed data ─────────────────────────────────────────────────
insert into app_settings (key, value) values
  ('shop_open', 'true'),
  ('shop_status_message', 'Taking orders now.');

insert into menu_items (name, description, price_cents, tags, sort_order) values
  (
    'Classic Matcha Latte',
    'A smooth matcha latte with a classic creamy finish.',
    0,
    array['The Classics', 'matcha'],
    1
  ),
  (
    'Classic Hojicha Latte',
    'A roasted green tea latte with warm, toasty notes.',
    0,
    array['The Classics', 'hojicha'],
    2
  ),
  (
    'Double Matcha Latte',
    'A bolder matcha latte with an extra-rich tea flavor.',
    0,
    array['The Classics', 'matcha'],
    3
  ),
  (
    'Double Hojicha Latte',
    'A deeper hojicha latte with extra roasted tea flavor.',
    0,
    array['The Classics', 'hojicha'],
    4
  ),
  (
    'Jasmine Matcha Latte',
    'Matcha latte layered with a soft jasmine tea note.',
    0,
    array['Floral & Tea Infusions', 'matcha'],
    5
  ),
  (
    'Jasmine Hojicha Latte',
    'Roasted hojicha latte balanced with delicate jasmine tea.',
    0,
    array['Floral & Tea Infusions', 'hojicha'],
    6
  ),
  (
    'Earl Grey Matcha Latte',
    'Matcha latte with a fragrant Earl Grey tea infusion.',
    0,
    array['Floral & Tea Infusions', 'matcha'],
    7
  ),
  (
    'Earl Grey Hojicha Latte',
    'Hojicha latte with cozy roasted tea and Earl Grey aroma.',
    0,
    array['Floral & Tea Infusions', 'hojicha'],
    8
  ),
  (
    'Strawberry Matcha Latte',
    'Matcha latte paired with bright strawberry sweetness.',
    0,
    array['Fruit Pairings', 'matcha'],
    9
  ),
  (
    'Strawberry Hojicha Latte',
    'Roasted hojicha latte paired with strawberry sweetness.',
    0,
    array['Fruit Pairings', 'hojicha'],
    10
  ),
  (
    'Blueberry Matcha Latte',
    'Matcha latte paired with juicy blueberry flavor.',
    0,
    array['Fruit Pairings', 'matcha'],
    11
  ),
  (
    'Blueberry Hojicha Latte',
    'Roasted hojicha latte paired with blueberry flavor.',
    0,
    array['Fruit Pairings', 'hojicha'],
    12
  ),
  (
    'Coconut Matcha Cold Foam',
    'Matcha finished with a light coconut cold foam topping.',
    0,
    array['Specialty Toppings', 'matcha'],
    13
  ),
  (
    'Coconut Hojicha Cold Foam',
    'Hojicha finished with a light coconut cold foam topping.',
    0,
    array['Specialty Toppings', 'hojicha'],
    14
  );


-- ============================================================
-- Phase 7 manual setup: order email webhook
-- ============================================================
-- 1. Deploy the `send-order-notification` edge function.
-- 2. Set function secrets in Supabase:
--    - RESEND_API_KEY
--    - ORDER_NOTIFICATION_TO_EMAIL
--    - ORDER_NOTIFICATION_FROM_EMAIL
-- 3. Create a database webhook in Supabase Dashboard:
--    - Name: send-order-notification
--    - Table: public.orders
--    - Events: Insert
--    - Type: Edge Function
--    - Edge Function: send-order-notification
