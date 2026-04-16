import { supabase } from './supabase'
import type {
  AdminMenuItemInput,
  AppSettingRow,
  MenuItemRow,
  OrderRow,
  OrderWithItem,
  ShopSettings,
} from './types'

const DEFAULT_OPEN_MESSAGE = 'Taking orders now.'
const DEFAULT_CLOSED_MESSAGE = 'Closed for now. Check back soon.'

function parseShopSettings(settings: AppSettingRow[]): ShopSettings {
  const byKey = new Map(settings.map((setting) => [setting.key, setting.value]))
  const openValue = byKey.get('shop_open') ?? byKey.get('shop_is_open') ?? 'true'
  const isOpen = openValue === 'true'
  const statusMessage =
    byKey.get('shop_status_message')?.trim() ||
    (isOpen ? DEFAULT_OPEN_MESSAGE : DEFAULT_CLOSED_MESSAGE)

  return { isOpen, statusMessage }
}

export async function getAdminShopSettings(): Promise<ShopSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value, updated_at')
    .in('key', ['shop_open', 'shop_is_open', 'shop_status_message'])

  if (error) throw error

  return parseShopSettings((data ?? []) as AppSettingRow[])
}

export async function updateAdminShopSettings(settings: ShopSettings): Promise<void> {
  const updatedAt = new Date().toISOString()
  const rows = [
    { key: 'shop_open', value: String(settings.isOpen), updated_at: updatedAt },
    {
      key: 'shop_status_message',
      value: settings.statusMessage.trim(),
      updated_at: updatedAt,
    },
  ]

  const { error } = await supabase
    .from('app_settings')
    .upsert(rows, { onConflict: 'key' })

  if (error) throw error
}

export async function getAdminMenuItems(): Promise<MenuItemRow[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error

  return data
}

export async function createAdminMenuItem(input: AdminMenuItemInput): Promise<MenuItemRow> {
  const { data, error } = await supabase
    .from('menu_items')
    .insert({
      ...input,
      // Legacy schema still requires this column, but drinks are treated as free in the app UI.
      price_cents: 0,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

export async function updateAdminMenuItem(
  itemId: string,
  input: AdminMenuItemInput
): Promise<MenuItemRow> {
  const { data, error } = await supabase
    .from('menu_items')
    .update(input)
    .eq('id', itemId)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function deleteAdminMenuItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', itemId)

  if (error) throw error
}

export async function getAdminOrders(): Promise<OrderWithItem[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, menu_items(name)')
    .order('created_at', { ascending: false })

  if (error) throw error

  return data
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: OrderRow['status']
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) throw error
}
