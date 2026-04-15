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
create policy "Public read menu items"
  on menu_items for select using (true);


-- ── orders ────────────────────────────────────────────────────
create table orders (
  id             uuid        primary key default gen_random_uuid(),
  customer_name  text        not null,
  menu_item_id   uuid        not null references menu_items(id),
  notes          text,                          -- nullable
  status         text        not null default 'pending',
    -- pending | ready | done | cancelled
  created_at     timestamptz not null default now()
);

-- Customers can insert orders; admin reads all (auth added later)
alter table orders enable row level security;
create policy "Public insert orders"
  on orders for insert with check (true);
create policy "Public read orders"
  on orders for select using (true);
  -- TODO: restrict to authenticated admin once auth is wired up


-- ── app_settings ──────────────────────────────────────────────
-- Simple key/value store for global flags (shop open, announcements, etc.)
create table app_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- Anyone can read settings; admin can update (restrict once auth is added)
alter table app_settings enable row level security;
create policy "Public read settings"
  on app_settings for select using (true);
create policy "Public update settings"
  on app_settings for update using (true);
  -- TODO: restrict to authenticated admin once auth is wired up


-- ── seed data ─────────────────────────────────────────────────
insert into app_settings (key, value) values
  ('shop_is_open', 'true');

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
