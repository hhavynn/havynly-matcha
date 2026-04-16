-- ============================================================
-- Phase 8: RLS hardening for one-admin setup
-- Run this manually in Supabase SQL Editor after replacing
-- the admin email placeholder below.
-- ============================================================

-- Replace this email before running.
create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select
    auth.role() = 'authenticated'
    and lower(coalesce(auth.jwt() ->> 'email', '')) = lower('your-admin-email@example.com')
$$;

-- ------------------------------------------------------------
-- menu_items
-- public read
-- admin write
-- ------------------------------------------------------------
alter table public.menu_items enable row level security;

drop policy if exists "Public read menu items" on public.menu_items;
drop policy if exists "Admin write menu items" on public.menu_items;
drop policy if exists "Admin insert menu items" on public.menu_items;
drop policy if exists "Admin update menu items" on public.menu_items;
drop policy if exists "Admin delete menu items" on public.menu_items;

create policy "Public read menu items"
  on public.menu_items
  for select
  using (true);

create policy "Admin insert menu items"
  on public.menu_items
  for insert
  with check (public.is_admin_user());

create policy "Admin update menu items"
  on public.menu_items
  for update
  using (public.is_admin_user())
  with check (public.is_admin_user());

create policy "Admin delete menu items"
  on public.menu_items
  for delete
  using (public.is_admin_user());

-- ------------------------------------------------------------
-- orders
-- public insert only
-- admin read/update
-- ------------------------------------------------------------
alter table public.orders enable row level security;

drop policy if exists "Public insert orders" on public.orders;
drop policy if exists "Public read orders" on public.orders;
drop policy if exists "Public update orders" on public.orders;
drop policy if exists "Admin read orders" on public.orders;
drop policy if exists "Admin update orders" on public.orders;

create policy "Public insert orders"
  on public.orders
  for insert
  with check (true);

create policy "Admin read orders"
  on public.orders
  for select
  using (public.is_admin_user());

create policy "Admin update orders"
  on public.orders
  for update
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- ------------------------------------------------------------
-- app_settings
-- public read only for safe customer-facing keys
-- admin read/write all keys
-- ------------------------------------------------------------
alter table public.app_settings enable row level security;

drop policy if exists "Public read settings" on public.app_settings;
drop policy if exists "Public insert settings" on public.app_settings;
drop policy if exists "Public update settings" on public.app_settings;
drop policy if exists "Admin read settings" on public.app_settings;
drop policy if exists "Admin insert settings" on public.app_settings;
drop policy if exists "Admin update settings" on public.app_settings;

create policy "Public read settings"
  on public.app_settings
  for select
  using (
    key in ('shop_open', 'shop_is_open', 'shop_status_message')
  );

create policy "Admin read settings"
  on public.app_settings
  for select
  using (public.is_admin_user());

create policy "Admin insert settings"
  on public.app_settings
  for insert
  with check (public.is_admin_user());

create policy "Admin update settings"
  on public.app_settings
  for update
  using (public.is_admin_user())
  with check (public.is_admin_user());
