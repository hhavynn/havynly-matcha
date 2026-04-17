import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createAdminMenuItem,
  deleteAdminMenuItem,
  getAdminMenuItems,
  getAdminOrders,
  getAdminShopSettings,
  updateAdminMenuItem,
  updateAdminOrderStatus,
  updateAdminShopSettings,
} from '../lib/adminApi'
import { useAdminAuth } from '../lib/auth'
import type {
  AdminMenuItemInput,
  MenuItemRow,
  OrderStatus,
  OrderWithItem,
  ShopSettings,
} from '../lib/types'

// Constants

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string; short: string }> = [
  { value: 'new', label: 'New', short: 'New' },
  { value: 'in_progress', label: 'In Progress', short: 'Making' },
  { value: 'completed', label: 'Completed', short: 'Done' },
]

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New',
  in_progress: 'In Progress',
  completed: 'Completed',
}

const STATUS_BADGES: Record<OrderStatus, string> = {
  new: 'border border-matcha-200 bg-white text-matcha-700',
  in_progress: 'bg-matcha-200 text-matcha-900',
  completed: 'bg-cream-200 text-matcha-700',
}

// Types

type AdminTab = 'shop' | 'menu' | 'orders'
type FilterValue = 'all' | OrderStatus

type EditableMenuItem = MenuItemRow & { tagsText: string }

type MenuDraft = {
  name: string
  description: string
  tagsText: string
  is_available: boolean
  sort_order: number
}

// Utilities

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function toEditableMenuItem(item: MenuItemRow): EditableMenuItem {
  return { ...item, tagsText: item.tags.join(', ') }
}

function sortMenuItems(items: EditableMenuItem[]) {
  return [...items].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}

function getNextSortOrder(items: EditableMenuItem[]) {
  if (items.length === 0) return 1
  return Math.max(...items.map((i) => i.sort_order)) + 1
}

function makeEmptyDraft(items: EditableMenuItem[]): MenuDraft {
  return { name: '', description: '', tagsText: '', is_available: true, sort_order: getNextSortOrder(items) }
}

function normalizeMenuInput(draft: MenuDraft): AdminMenuItemInput {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    tags: draft.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
    is_available: draft.is_available,
    sort_order: Number.isFinite(draft.sort_order) ? draft.sort_order : 0,
  }
}

function validateMenuDraft(draft: MenuDraft) {
  if (!draft.name.trim()) return 'Drink name is required.'
  if (!draft.description.trim()) return 'Description is required.'
  if (!Number.isInteger(draft.sort_order)) return 'Sort order must be a whole number.'
  return null
}

// Shared input styles

const inputCls =
  'block w-full rounded-[1.2rem] border border-matcha-200 bg-cream-50 px-3 py-2.5 text-sm text-matcha-900 outline-none transition focus:border-matcha-400 focus:ring-2 focus:ring-matcha-200'

const textareaCls = `${inputCls} resize-none`

// Component

export default function AdminPage() {
  const { user, signOut } = useAdminAuth()

  // data
  const [orders, setOrders] = useState<OrderWithItem[]>([])
  const [menuItems, setMenuItems] = useState<EditableMenuItem[]>([])
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)
  const [newMenuItem, setNewMenuItem] = useState<MenuDraft>(makeEmptyDraft([]))

  // ui state
  const [activeTab, setActiveTab] = useState<AdminTab>('orders')
  const [expandedMenuItemId, setExpandedMenuItemId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [filter, setFilter] = useState<FilterValue>('all')

  // async flags
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [creatingMenuItem, setCreatingMenuItem] = useState(false)
  const [savingMenuItemId, setSavingMenuItemId] = useState<string | null>(null)
  const [deletingMenuItemId, setDeletingMenuItemId] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  // notices
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Data loading

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true)
    else setRefreshing(true)

    try {
      const [fetchedOrders, fetchedSettings, fetchedMenuItems] = await Promise.all([
        getAdminOrders(),
        getAdminShopSettings(),
        getAdminMenuItems(),
      ])
      const editableMenuItems = sortMenuItems(fetchedMenuItems.map(toEditableMenuItem))
      setOrders(fetchedOrders)
      setShopSettings(fetchedSettings)
      setMenuItems(editableMenuItems)
      setNewMenuItem((cur) =>
        cur.name || cur.description || cur.tagsText ? cur : makeEmptyDraft(editableMenuItems)
      )
      setError(null)
    } catch {
      setError('Could not load admin data. Check your session and refresh.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    const id = window.setInterval(() => { void load('refresh') }, 20000)
    return () => window.clearInterval(id)
  }, [load])

  // Handlers

  async function handleSaveSettings() {
    if (!shopSettings) return
    setSavingSettings(true)
    try {
      await updateAdminShopSettings(shopSettings)
      setError(null)
      setNotice(shopSettings.isOpen ? 'Shop is now open.' : 'Shop is now closed.')
    } catch {
      setError('Could not save shop settings.')
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleStatusChange(orderId: string, nextStatus: OrderStatus) {
    const prev = orders
    setUpdatingOrderId(orderId)
    setOrders((cur) => cur.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)))
    try {
      await updateAdminOrderStatus(orderId, nextStatus)
      setError(null)
    } catch {
      setOrders(prev)
      setError('Could not update that order status.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  function handleMenuFieldChange(itemId: string, field: keyof MenuDraft, value: string | number | boolean) {
    setNotice(null)
    setError(null)
    setMenuItems((cur) => cur.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)))
  }

  async function handleCreateMenuItem() {
    const err = validateMenuDraft(newMenuItem)
    if (err) { setError(err); return }
    setCreatingMenuItem(true)
    try {
      const created = await createAdminMenuItem(normalizeMenuInput(newMenuItem))
      setMenuItems((cur) => {
        const next = sortMenuItems([...cur, toEditableMenuItem(created)])
        setNewMenuItem(makeEmptyDraft(next))
        return next
      })
      setNotice(`Added "${created.name}".`)
      setError(null)
      setShowAddForm(false)
    } catch {
      setError('Could not create that menu item.')
    } finally {
      setCreatingMenuItem(false)
    }
  }

  async function handleSaveMenuItem(item: EditableMenuItem) {
    const draft: MenuDraft = {
      name: item.name, description: item.description, tagsText: item.tagsText,
      is_available: item.is_available, sort_order: item.sort_order,
    }
    const err = validateMenuDraft(draft)
    if (err) { setError(err); return }
    setSavingMenuItemId(item.id)
    try {
      const updated = await updateAdminMenuItem(item.id, normalizeMenuInput(draft))
      setMenuItems((cur) =>
        sortMenuItems(cur.map((i) => (i.id === item.id ? toEditableMenuItem(updated) : i)))
      )
      setNotice(`Saved "${updated.name}".`)
      setError(null)
      setExpandedMenuItemId(null)
    } catch {
      setError('Could not save that menu item.')
    } finally {
      setSavingMenuItemId(null)
    }
  }

  async function handleDeleteMenuItem(item: EditableMenuItem) {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    setDeletingMenuItemId(item.id)
    try {
      await deleteAdminMenuItem(item.id)
      setMenuItems((cur) => {
        const next = cur.filter((i) => i.id !== item.id)
        setNewMenuItem((d) => (d.name || d.description || d.tagsText ? d : makeEmptyDraft(next)))
        return next
      })
      setNotice(`Deleted "${item.name}".`)
      setError(null)
      setExpandedMenuItemId(null)
    } catch {
      setError('Could not delete that menu item.')
    } finally {
      setDeletingMenuItemId(null)
    }
  }

  async function handleToggleAvailability(item: EditableMenuItem) {
    const toggled = { ...item, is_available: !item.is_available }
    setMenuItems((cur) => cur.map((i) => (i.id === item.id ? toggled : i)))
    setSavingMenuItemId(item.id)
    try {
      const updated = await updateAdminMenuItem(
        item.id,
        normalizeMenuInput({ name: toggled.name, description: toggled.description, tagsText: toggled.tagsText, is_available: toggled.is_available, sort_order: toggled.sort_order })
      )
      setMenuItems((cur) => sortMenuItems(cur.map((i) => (i.id === item.id ? toEditableMenuItem(updated) : i))))
      setNotice(updated.is_available ? `"${updated.name}" is available.` : `"${updated.name}" marked sold out.`)
      setError(null)
    } catch {
      setMenuItems((cur) => cur.map((i) => (i.id === item.id ? item : i)))
      setError('Could not update availability.')
    } finally {
      setSavingMenuItemId(null)
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    try { await signOut() } finally { setLoggingOut(false) }
  }

  // Derived

  const counts = useMemo(() => ({
    all: orders.length,
    new: orders.filter((o) => o.status === 'new').length,
    in_progress: orders.filter((o) => o.status === 'in_progress').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  }), [orders])

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders
    return orders.filter((o) => o.status === filter)
  }, [filter, orders])

  // Render

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(182,214,170,0.32),_transparent_38%),linear-gradient(180deg,_#f8f4ea_0%,_#f2ecdf_100%)] font-admin text-matcha-900">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-8 pt-4 sm:px-6 sm:pt-6">

        {/* compact header */}
        <header className="flex flex-col gap-3 rounded-[1.75rem] border border-white/70 bg-cream-50/90 px-4 py-3 shadow-[0_14px_34px_rgba(55,79,53,0.07)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-matcha-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-matcha-700">
              <span className={`h-2 w-2 rounded-full ${shopSettings?.isOpen ? 'bg-matcha-500' : 'bg-matcha-300'}`} />
              Admin
            </div>
            <span className="hidden text-sm text-matcha-500 sm:block">{user?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load('refresh')}
              disabled={refreshing}
              className="rounded-full border border-matcha-200 bg-white px-3 py-1.5 text-xs font-semibold text-matcha-700 transition hover:border-matcha-300 disabled:opacity-60"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-full bg-matcha-900 px-3 py-1.5 text-xs font-semibold text-cream-50 transition hover:bg-matcha-800 disabled:opacity-60"
            >
              {loggingOut ? '...' : 'Log out'}
            </button>
          </div>
        </header>

        {/* global banners */}
        {error && (
          <div className="mt-3 rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {error}
            <button type="button" onClick={() => setError(null)} className="ml-3 font-semibold opacity-60 hover:opacity-100">Close</button>
          </div>
        )}
        {notice && (
          <div className="mt-3 rounded-[1.5rem] border border-matcha-200 bg-matcha-50 px-4 py-2.5 text-sm text-matcha-700">
            {notice}
            <button type="button" onClick={() => setNotice(null)} className="ml-3 font-semibold opacity-60 hover:opacity-100">Close</button>
          </div>
        )}

        {/* sticky tab bar */}
        <div className="sticky top-2 z-20 mt-4">
          <div className="flex rounded-full border border-white/80 bg-cream-100/95 p-1 shadow-[0_4px_16px_rgba(55,79,53,0.10)] backdrop-blur">
            {(
              [
                {
                  id: 'shop' as AdminTab,
                  label: 'Shop',
                  badge: loading ? '--' : shopSettings?.isOpen ? 'Open' : 'Closed',
                  badgeActive: 'bg-matcha-700/80 text-cream-100',
                  badgeInactive: shopSettings?.isOpen ? 'bg-matcha-100 text-matcha-700' : 'bg-cream-200 text-matcha-600',
                },
                {
                  id: 'menu' as AdminTab,
                  label: 'Menu',
                  badge: loading ? '--' : `${menuItems.length}`,
                  badgeActive: 'bg-matcha-700/80 text-cream-100',
                  badgeInactive: 'bg-matcha-100 text-matcha-700',
                },
                {
                  id: 'orders' as AdminTab,
                  label: 'Orders',
                  badge: loading ? '--' : counts.new > 0 ? `${counts.new} new` : `${counts.all}`,
                  badgeActive: 'bg-matcha-700/80 text-cream-100',
                  badgeInactive: counts.new > 0 ? 'bg-matcha-200 text-matcha-900' : 'bg-matcha-100 text-matcha-700',
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-matcha-900 text-cream-50 shadow-sm'
                    : 'text-matcha-600 hover:text-matcha-900'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    activeTab === tab.id ? tab.badgeActive : tab.badgeInactive
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* tab content */}
        <div className="mt-4 flex-1">

          {/* shop tab */}
          {activeTab === 'shop' && (
            <div className="rounded-[2rem] border border-white/70 bg-cream-50/90 p-5 shadow-[0_18px_48px_rgba(55,79,53,0.08)]">
              <div className="grid gap-5 lg:grid-cols-[18rem_1fr] lg:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-matcha-500">Shop settings</p>
                  <h2 className="mt-2 text-2xl font-semibold text-matcha-900">
                    {shopSettings?.isOpen ? 'Open for orders' : 'Closed to new orders'}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-matcha-600">
                    Toggle ordering and save the short message customers see.
                  </p>
                  <div className="mt-4 grid grid-cols-2 rounded-full bg-cream-100 p-1">
                    <button
                      type="button"
                      onClick={() => { setNotice(null); setError(null); setShopSettings((c) => c ? { ...c, isOpen: true } : c) }}
                      className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${shopSettings?.isOpen ? 'bg-matcha-900 text-cream-50 shadow-sm' : 'text-matcha-600 hover:bg-white/70'}`}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNotice(null); setError(null); setShopSettings((c) => c ? { ...c, isOpen: false } : c) }}
                      className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${shopSettings && !shopSettings.isOpen ? 'bg-matcha-900 text-cream-50 shadow-sm' : 'text-matcha-600 hover:bg-white/70'}`}
                    >
                      Closed
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-matcha-700" htmlFor="shop-status-message">
                    Customer-facing status message
                  </label>
                  <textarea
                    id="shop-status-message"
                    value={shopSettings?.statusMessage ?? ''}
                    onChange={(e) => { setNotice(null); setError(null); setShopSettings((c) => c ? { ...c, statusMessage: e.target.value } : c) }}
                    rows={4}
                    placeholder="Taking orders until 6 PM"
                    className={`mt-2 ${textareaCls}`}
                  />
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={savingSettings || !shopSettings}
                    className="mt-3 w-full rounded-full bg-matcha-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-matcha-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6"
                  >
                    {savingSettings ? 'Saving...' : 'Save settings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* menu tab */}
          {activeTab === 'menu' && (
            <div className="space-y-3">

              {/* add-drink panel */}
              <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-cream-50/90 shadow-[0_18px_48px_rgba(55,79,53,0.08)]">
                <button
                  type="button"
                  onClick={() => setShowAddForm((v) => !v)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4"
                >
                  <span className="text-sm font-semibold text-matcha-900">+ Add a drink</span>
                  <span className="text-xs text-matcha-400">{showAddForm ? 'Close' : 'Open'}</span>
                </button>

                {showAddForm && (
                  <div className="border-t border-matcha-100 px-5 pb-5 pt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium text-matcha-600" htmlFor="new-name">Drink name</label>
                        <input
                          id="new-name" type="text" value={newMenuItem.name}
                          onChange={(e) => { setNotice(null); setError(null); setNewMenuItem((c) => ({ ...c, name: e.target.value })) }}
                          placeholder="Strawberry matcha latte"
                          className={`mt-1.5 ${inputCls}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-matcha-600" htmlFor="new-tags">Tags</label>
                        <input
                          id="new-tags" type="text" value={newMenuItem.tagsText}
                          onChange={(e) => { setNotice(null); setError(null); setNewMenuItem((c) => ({ ...c, tagsText: e.target.value })) }}
                          placeholder="iced, creamy, seasonal"
                          className={`mt-1.5 ${inputCls}`}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-medium text-matcha-600" htmlFor="new-desc">Description</label>
                      <textarea
                        id="new-desc" value={newMenuItem.description}
                        onChange={(e) => { setNotice(null); setError(null); setNewMenuItem((c) => ({ ...c, description: e.target.value })) }}
                        rows={2} placeholder="Ceremonial matcha shaken with milk and strawberry cream."
                        className={`mt-1.5 ${textareaCls}`}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <div className="w-28">
                        <label className="text-xs font-medium text-matcha-600" htmlFor="new-sort">Sort order</label>
                        <input
                          id="new-sort" type="number" value={newMenuItem.sort_order}
                          onChange={(e) => { setNotice(null); setError(null); setNewMenuItem((c) => ({ ...c, sort_order: Number.parseInt(e.target.value, 10) || 0 })) }}
                          className={`mt-1.5 ${inputCls}`}
                        />
                      </div>
                      <label className="flex cursor-pointer items-center gap-2 rounded-[1.2rem] border border-matcha-200 bg-cream-50 px-3 py-2.5 text-sm font-medium text-matcha-700">
                        <input
                          type="checkbox" checked={newMenuItem.is_available}
                          onChange={(e) => { setNotice(null); setError(null); setNewMenuItem((c) => ({ ...c, is_available: e.target.checked })) }}
                          className="h-3.5 w-3.5 rounded border-matcha-300 text-matcha-600 focus:ring-matcha-400"
                        />
                        Available
                      </label>
                      <button
                        type="button" onClick={() => void handleCreateMenuItem()} disabled={creatingMenuItem}
                        className="ml-auto rounded-full bg-matcha-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-matcha-600 disabled:opacity-60"
                      >
                        {creatingMenuItem ? 'Adding...' : 'Add drink'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* drink list */}
              {loading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="animate-pulse rounded-[1.75rem] border border-matcha-100 bg-white/80 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-6 rounded-full bg-matcha-100" />
                        <div className="h-4 w-40 rounded-full bg-matcha-100" />
                        <div className="ml-auto h-6 w-16 rounded-full bg-matcha-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : menuItems.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-matcha-200 bg-white/70 px-6 py-10 text-center">
                  <p className="font-semibold text-matcha-800">No drinks on the menu yet.</p>
                  <p className="mt-1 text-sm text-matcha-500">Use "Add a drink" above to get started.</p>
                </div>
              ) : (
                <div className="max-h-[calc(100vh-15rem)] overflow-y-auto rounded-[2rem] border border-white/70 bg-cream-50/90 shadow-[0_18px_48px_rgba(55,79,53,0.08)]">
                  {menuItems.map((item, index) => {
                    const isSaving = savingMenuItemId === item.id
                    const isDeleting = deletingMenuItemId === item.id
                    const isExpanded = expandedMenuItemId === item.id

                    return (
                      <div key={item.id} className={index > 0 ? 'border-t border-matcha-50' : ''}>
                        {/* compact row */}
                        <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 px-3 py-2.5 sm:grid-cols-[2.5rem_1fr_auto_auto] sm:px-4">
                          <span className="w-6 shrink-0 text-center font-mono text-xs text-matcha-400">
                            {item.sort_order}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-matcha-900">{item.name}</p>
                            <p className="truncate text-xs text-matcha-500">{item.tagsText || 'No tags'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleToggleAvailability(item)}
                            disabled={isSaving || isDeleting}
                            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                              item.is_available
                                ? 'bg-matcha-100 text-matcha-700 hover:bg-matcha-200'
                                : 'bg-cream-200 text-matcha-700 hover:bg-cream-300'
                            }`}
                          >
                            {item.is_available ? 'On' : 'Off'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedMenuItemId(isExpanded ? null : item.id)}
                            className={`col-span-3 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:col-span-1 ${
                              isExpanded
                                ? 'bg-matcha-900 text-cream-50'
                                : 'border border-matcha-200 bg-white text-matcha-700 hover:border-matcha-300'
                            }`}
                          >
                            {isExpanded ? 'Close' : 'Edit'}
                          </button>
                        </div>

                        {/* expanded edit form */}
                        {isExpanded && (
                          <div className="border-t border-matcha-100 bg-white/60 px-4 pb-4 pt-3 sm:px-5">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="text-xs font-medium text-matcha-600" htmlFor={`name-${item.id}`}>Name</label>
                                <input
                                  id={`name-${item.id}`} type="text" value={item.name}
                                  onChange={(e) => handleMenuFieldChange(item.id, 'name', e.target.value)}
                                  className={`mt-1.5 ${inputCls}`}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-matcha-600" htmlFor={`tags-${item.id}`}>Tags</label>
                                <input
                                  id={`tags-${item.id}`} type="text" value={item.tagsText}
                                  onChange={(e) => handleMenuFieldChange(item.id, 'tagsText', e.target.value)}
                                  className={`mt-1.5 ${inputCls}`}
                                />
                              </div>
                            </div>
                            <div className="mt-3">
                              <label className="text-xs font-medium text-matcha-600" htmlFor={`desc-${item.id}`}>Description</label>
                              <textarea
                                id={`desc-${item.id}`} value={item.description}
                                onChange={(e) => handleMenuFieldChange(item.id, 'description', e.target.value)}
                                rows={2}
                                className={`mt-1.5 ${textareaCls}`}
                              />
                            </div>
                            <div className="mt-3 flex flex-wrap items-end gap-3">
                              <div className="w-28">
                                <label className="text-xs font-medium text-matcha-600" htmlFor={`sort-${item.id}`}>Sort order</label>
                                <input
                                  id={`sort-${item.id}`} type="number" value={item.sort_order}
                                  onChange={(e) => handleMenuFieldChange(item.id, 'sort_order', Number.parseInt(e.target.value, 10) || 0)}
                                  className={`mt-1.5 ${inputCls}`}
                                />
                              </div>
                              <div className="ml-auto flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteMenuItem(item)}
                                  disabled={isSaving || isDeleting}
                                  className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                                >
                                  {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleSaveMenuItem(item)}
                                  disabled={isSaving || isDeleting}
                                  className="rounded-full bg-matcha-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-matcha-600 disabled:opacity-60"
                                >
                                  {isSaving ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* orders tab */}
          {activeTab === 'orders' && (
            <div className="space-y-3">

              {/* stat chips */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'New', value: counts.new, active: counts.new > 0 },
                  { label: 'Making', value: counts.in_progress, active: false },
                  { label: 'Total', value: counts.all, active: false },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-[1.75rem] border px-4 py-3 shadow-[0_8px_20px_rgba(55,79,53,0.06)] ${
                      stat.active
                        ? 'border-matcha-200 bg-matcha-50'
                        : 'border-white/70 bg-cream-50/95'
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-matcha-500">{stat.label}</p>
                    <p className="mt-1.5 text-3xl font-semibold text-matcha-900">
                      {loading ? '--' : stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* filter pills */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(['all', 'new', 'in_progress', 'completed'] as const).map((value) => {
                  const label = value === 'all' ? 'All' : value === 'in_progress' ? 'In Progress' : STATUS_LABELS[value]
                  const count = value === 'all' ? counts.all : counts[value]
                  const active = filter === value
                  return (
                    <button
                      key={value} type="button" onClick={() => setFilter(value)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? 'bg-matcha-900 text-cream-50 shadow-sm'
                          : 'border border-matcha-200 bg-white text-matcha-700 hover:border-matcha-300'
                      }`}
                    >
                      {label} {loading ? '' : `(${count})`}
                    </button>
                  )
                })}
              </div>

              {/* order list */}
              {loading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="animate-pulse rounded-[1.75rem] border border-white/70 bg-cream-50/90 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-28 rounded-full bg-matcha-100" />
                        <div className="h-4 w-40 rounded-full bg-matcha-100" />
                        <div className="ml-auto h-6 w-24 rounded-full bg-matcha-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-matcha-200 bg-cream-50/80 px-6 py-12 text-center">
                  <p className="font-semibold text-matcha-800">
                    {orders.length === 0 ? 'No orders yet.' : 'No orders match this filter.'}
                  </p>
                  <p className="mt-1.5 text-sm text-matcha-500">
                    {orders.length === 0
                      ? 'Place a test order from the public menu to see it here.'
                      : 'Switch filters or refresh.'}
                  </p>
                </div>
              ) : (
                <div className="max-h-[calc(100vh-16rem)] overflow-y-auto rounded-[2rem] border border-white/70 bg-cream-50/90 shadow-[0_18px_48px_rgba(55,79,53,0.08)]">
                  {filteredOrders.map((order, index) => {
                    const isNew = order.status === 'new'
                    const isUpdating = updatingOrderId === order.id

                    return (
                      <div
                        key={order.id}
                        className={`px-4 py-3 sm:px-5 ${index > 0 ? 'border-t border-matcha-50' : ''} ${isNew ? 'bg-matcha-50/60' : ''}`}
                      >
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <span className="text-sm font-semibold text-matcha-900">{order.customer_name}</span>
                              <span className="text-sm text-matcha-600">{order.menu_items?.name ?? 'Drink unavailable'}</span>
                              <span className="text-xs text-matcha-400">{formatTimestamp(order.created_at)}</span>
                            </div>
                            <p className="mt-0.5 text-xs leading-5 text-matcha-500">{order.notes || 'No notes'}</p>
                          </div>

                          <div className={`flex gap-1 overflow-x-auto pb-0.5 transition-opacity ${isUpdating ? 'opacity-50' : ''}`}>
                            {STATUS_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => void handleStatusChange(order.id, opt.value)}
                                disabled={isUpdating || order.status === opt.value}
                                className={`shrink-0 rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${
                                  order.status === opt.value
                                    ? STATUS_BADGES[opt.value] + ' cursor-default'
                                    : 'border border-matcha-200 bg-white text-matcha-600 hover:border-matcha-300 hover:text-matcha-900'
                                }`}
                              >
                                {opt.short}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
