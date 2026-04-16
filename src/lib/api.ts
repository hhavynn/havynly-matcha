import { supabase } from './supabase'
import type { AppSettingRow, MenuItemRow, ShopSettings } from './types'

const DEFAULT_OPEN_MESSAGE = 'Taking orders now.'
const DEFAULT_CLOSED_MESSAGE = 'Closed for now. Check back soon.'

export class ShopClosedError extends Error {
  constructor(message = DEFAULT_CLOSED_MESSAGE) {
    super(message)
    this.name = 'ShopClosedError'
  }
}

function parseShopSettings(settings: AppSettingRow[]): ShopSettings {
  const byKey = new Map(settings.map((setting) => [setting.key, setting.value]))
  const openValue = byKey.get('shop_open') ?? byKey.get('shop_is_open') ?? 'true'
  const isOpen = openValue === 'true'
  const statusMessage =
    byKey.get('shop_status_message')?.trim() ||
    (isOpen ? DEFAULT_OPEN_MESSAGE : DEFAULT_CLOSED_MESSAGE)

  return { isOpen, statusMessage }
}

export async function getMenu(): Promise<MenuItemRow[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('sort_order')

  if (error) throw error

  return data
}

export async function getShopSettings(): Promise<ShopSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value, updated_at')
    .in('key', ['shop_open', 'shop_is_open', 'shop_status_message'])

  if (error) throw error

  return parseShopSettings((data ?? []) as AppSettingRow[])
}

export async function getShopIsOpen(): Promise<boolean> {
  const settings = await getShopSettings()
  return settings.isOpen
}

export interface NewOrder {
  customer_name: string
  menu_item_id: string
  notes?: string
}

export async function submitOrder(order: NewOrder): Promise<void> {
  const settings = await getShopSettings()
  if (!settings.isOpen) {
    throw new ShopClosedError(settings.statusMessage)
  }

  const { error } = await supabase
    .from('orders')
    .insert(order)

  if (error) throw error
}
