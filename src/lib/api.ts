import { supabase } from './supabase'
import type { MenuItemRow, OrderRow, OrderWithItem } from './types'

// ── Menu ──────────────────────────────────────────────────────

export async function getMenu(): Promise<MenuItemRow[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('sort_order')
  if (error) throw error
  return data
}

// ── Shop status ───────────────────────────────────────────────

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

// ── Orders ────────────────────────────────────────────────────

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
