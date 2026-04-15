-- ============================================================
-- Phase 4: Add admin write policies for menu_items
-- Run in Supabase: Dashboard → SQL Editor → New query
-- Safe to run after schema.sql and phase3-auth.sql have been applied.
-- The existing "Public read menu items" SELECT policy is unchanged.
-- ============================================================


-- ── INSERT ───────────────────────────────────────────────────────────
create policy "Authenticated insert menu items"
  on menu_items for insert
  with check (auth.role() = 'authenticated');


-- ── UPDATE ──────────────────────────────────────────────────────────
create policy "Authenticated update menu items"
  on menu_items for update
  using (auth.role() = 'authenticated');


-- ── DELETE ──────────────────────────────────────────────────────────
create policy "Authenticated delete menu items"
  on menu_items for delete
  using (auth.role() = 'authenticated');
