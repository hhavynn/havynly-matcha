import { supabase } from './supabase'
import type { MenuItemRow, MenuItemFormData, OrderRow, OrderWithItem } from './types'

// ── Menu (public) ─────────────────────────────────────────────
// Only available items, sorted for customers
export async function getMenu(): Promise<MenuItemRow[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('sort_order')
  if (error) throw error
  return data
}

// ── Menu (admin) ────────────────────────────────────────────
// All items including unavailable, sorted for admin list
export async function getAllMenuItems(): Promise<MenuItemRow[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data
}

export async function createMenuItem(
  data: MenuItemFormData
): Promise<MenuItemRow> {
  const { data: created, error } = await supabase
    .from('menu_items')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return created
}

export async function updateMenuItem(
  id: string,
  data: MenuItemFormData
): Promise<MenuItemRow> {
  const { data: updated, error } = await supabase
    .from('menu_items')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return updated
}

export async function deleteMenuItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id)
  if (error) {
    // Foreign key violation — orders reference this item
    if (error.code === '23503') {
      throw new Error('This item has existing orders and cannot be deleted.')
    }
    throw error
  }
}

export async function toggleMenuItemAvailability(
  id: string,
  isAvailable: boolean
): Promise<void> {
  const { error } = await supabase
    .from('menu_items')
    .update({ is_available: isAvailable })
    .eq('id', id)
  if (error) throw error
}

// ── Shop status ─────────────────────────────────────────────
export async function getShopIsOpen(): Promise<boolean> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'shop_is_open')
    .single()
  if (error) throw error
  return data.value === 'true'
}

export async function setShopIsOpen(isOpen: boolean): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .update({ value: String(isOpen), updated_at: new Date().toISOString() })
    .eq('key', 'shop_is_open')
  if (error) throw error
}

// ── Orders ────────────────────────────────────────────────
export interface NewOrder {
  customer_name: string
  menu_item_id: string
  notes?: string
}

export async function submitOrder(order: NewOrder): Promise<OrderRow> {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single()
  if (error) throw error
  return data
}

// Admin: fetch recent orders with drink name joined
export async function getOrders(): Promise<OrderWithItem[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, menu_items(name)')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderRow['status']
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
  if (error) throw error
}
