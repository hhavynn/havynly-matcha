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
    'Ceremonial-grade matcha whisked smooth, topped with steamed oat milk and a delicate foam crown.',
    595,
    array['bestseller', 'dairy-free option'],
    1
  ),
  (
    'Iced Hojicha Latte',
    'Roasted green tea with a toasty, caramel depth — poured over ice with your choice of milk.',
    550,
    array['iced', 'low-caffeine'],
    2
  ),
  (
    'Ceremonial Usucha',
    'Pure matcha prepared in the traditional thin-style — nothing but water and stone-ground leaves.',
    475,
    array['traditional', 'vegan'],
    3
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
