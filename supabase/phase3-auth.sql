-- ============================================================
-- Phase 3: Tighten RLS — restrict admin writes to authenticated users
-- Run in Supabase: Dashboard → SQL Editor → New query
-- Safe to run after the initial schema.sql has already been applied.
-- ============================================================


-- ── app_settings: replace open update policy with auth-only ───────────
-- Previously anyone could update settings (shop open/closed).
-- Now only the authenticated admin can.
drop policy if exists "Public update settings" on app_settings;

create policy "Authenticated update settings"
  on app_settings for update
  using (auth.role() = 'authenticated');


-- ── orders: add auth-only update policy (was missing entirely) ────────
-- The initial schema had no UPDATE policy on orders, which meant
-- updateOrderStatus() was silently denied. This fixes that and
-- locks it to authenticated users in one step.
create policy "Authenticated update orders"
  on orders for update
  using (auth.role() = 'authenticated');
