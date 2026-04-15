// Row types that mirror the database schema in supabase/schema.sql

export interface MenuItemRow {
  id: string
  name: string
  description: string
  price_cents: number
  tags: string[]
  is_available: boolean
  sort_order: number
  created_at: string
}

export type OrderStatus = 'pending' | 'ready' | 'done' | 'cancelled'

export interface OrderRow {
  id: string
  customer_name: string
  menu_item_id: string
  notes: string | null
  status: OrderStatus
  created_at: string
}

// Orders joined with the drink name (used in admin view)
export interface OrderWithItem extends OrderRow {
  menu_items: { name: string } | null
}
