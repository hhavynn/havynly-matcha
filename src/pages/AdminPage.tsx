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

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
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

type FilterValue = 'all' | OrderStatus

type EditableMenuItem = MenuItemRow & {
  tagsText: string
}

type MenuDraft = {
  name: string
  description: string
  tagsText: string
  is_available: boolean
  sort_order: number
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function toEditableMenuItem(item: MenuItemRow): EditableMenuItem {
  return {
    ...item,
    tagsText: item.tags.join(', '),
  }
}

function sortMenuItems(items: EditableMenuItem[]) {
  return [...items].sort((left, right) => {
    if (left.sort_order !== right.sort_order) {
      return left.sort_order - right.sort_order
    }

    return new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
  })
}

function getNextSortOrder(items: EditableMenuItem[]) {
  if (items.length === 0) return 1
  return Math.max(...items.map((item) => item.sort_order)) + 1
}

function makeEmptyDraft(items: EditableMenuItem[]): MenuDraft {
  return {
    name: '',
    description: '',
    tagsText: '',
    is_available: true,
    sort_order: getNextSortOrder(items),
  }
}

function normalizeMenuInput(draft: MenuDraft): AdminMenuItemInput {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    tags: draft.tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    is_available: draft.is_available,
    sort_order: Number.isFinite(draft.sort_order) ? draft.sort_order : 0,
  }
}

function validateMenuDraft(draft: MenuDraft) {
  if (!draft.name.trim()) return 'Menu item name is required.'
  if (!draft.description.trim()) return 'Menu item description is required.'
  if (!Number.isInteger(draft.sort_order)) return 'Sort order must be a whole number.'
  return null
}

export default function AdminPage() {
  const { user, signOut } = useAdminAuth()
  const [orders, setOrders] = useState<OrderWithItem[]>([])
  const [menuItems, setMenuItems] = useState<EditableMenuItem[]>([])
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)
  const [newMenuItem, setNewMenuItem] = useState<MenuDraft>(makeEmptyDraft([]))
  const [filter, setFilter] = useState<FilterValue>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [creatingMenuItem, setCreatingMenuItem] = useState(false)
  const [savingMenuItemId, setSavingMenuItemId] = useState<string | null>(null)
  const [deletingMenuItemId, setDeletingMenuItemId] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null)
  const [menuNotice, setMenuNotice] = useState<string | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  const selectedFilterLabel =
    filter === 'all' ? 'All orders' : filter === 'in_progress' ? 'In progress' : STATUS_LABELS[filter]

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (mode === 'initial') {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

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
        setNewMenuItem((current) =>
          current.name || current.description || current.tagsText
            ? current
            : makeEmptyDraft(editableMenuItems)
        )
        setError(null)
      } catch {
        setError('Could not load admin data. Check your session and refresh.')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    []
  )

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void load('refresh')
    }, 20000)

    return () => window.clearInterval(intervalId)
  }, [load])

  async function handleSaveSettings() {
    if (!shopSettings) return

    setSavingSettings(true)
    try {
      await updateAdminShopSettings(shopSettings)
      setError(null)
      setSettingsNotice(
        shopSettings.isOpen
          ? 'Shop settings saved. Ordering is open.'
          : 'Shop settings saved. Ordering is closed.'
      )
    } catch {
      setError('Could not save shop settings.')
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleStatusChange(orderId: string, nextStatus: OrderStatus) {
    const previousOrders = orders
    setUpdatingOrderId(orderId)
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status: nextStatus } : order
      )
    )

    try {
      await updateAdminOrderStatus(orderId, nextStatus)
      setError(null)
    } catch {
      setOrders(previousOrders)
      setError('Could not update that order status.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  function handleMenuFieldChange(
    itemId: string,
    field: keyof MenuDraft,
    value: string | number | boolean
  ) {
    setMenuNotice(null)
    setError(null)
    setMenuItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    )
  }

  async function handleCreateMenuItem() {
    const validationError = validateMenuDraft(newMenuItem)
    if (validationError) {
      setError(validationError)
      return
    }

    setCreatingMenuItem(true)
    try {
      const created = await createAdminMenuItem(normalizeMenuInput(newMenuItem))
      setMenuItems((current) => {
        const next = sortMenuItems([...current, toEditableMenuItem(created)])
        setNewMenuItem(makeEmptyDraft(next))
        return next
      })
      setMenuNotice(`Added "${created.name}" to the menu.`)
      setError(null)
    } catch {
      setError('Could not create that menu item.')
    } finally {
      setCreatingMenuItem(false)
    }
  }

  async function handleSaveMenuItem(item: EditableMenuItem) {
    const draft: MenuDraft = {
      name: item.name,
      description: item.description,
      tagsText: item.tagsText,
      is_available: item.is_available,
      sort_order: item.sort_order,
    }

    const validationError = validateMenuDraft(draft)
    if (validationError) {
      setError(validationError)
      return
    }

    setSavingMenuItemId(item.id)
    try {
      const updated = await updateAdminMenuItem(item.id, normalizeMenuInput(draft))
      setMenuItems((current) =>
        sortMenuItems(
          current.map((currentItem) =>
            currentItem.id === item.id ? toEditableMenuItem(updated) : currentItem
          )
        )
      )
      setMenuNotice(`Updated "${updated.name}".`)
      setError(null)
    } catch {
      setError('Could not save that menu item.')
    } finally {
      setSavingMenuItemId(null)
    }
  }

  async function handleDeleteMenuItem(item: EditableMenuItem) {
    const confirmed = window.confirm(`Delete "${item.name}" from the menu?`)
    if (!confirmed) return

    setDeletingMenuItemId(item.id)
    try {
      await deleteAdminMenuItem(item.id)
      setMenuItems((current) => {
        const next = current.filter((currentItem) => currentItem.id !== item.id)
        setNewMenuItem((draft) =>
          draft.name || draft.description || draft.tagsText ? draft : makeEmptyDraft(next)
        )
        return next
      })
      setMenuNotice(`Deleted "${item.name}".`)
      setError(null)
    } catch {
      setError('Could not delete that menu item.')
    } finally {
      setDeletingMenuItemId(null)
    }
  }

  async function handleToggleAvailability(item: EditableMenuItem) {
    const toggledItem = { ...item, is_available: !item.is_available }
    setMenuItems((current) =>
      current.map((currentItem) => (currentItem.id === item.id ? toggledItem : currentItem))
    )

    setSavingMenuItemId(item.id)
    try {
      const updated = await updateAdminMenuItem(
        item.id,
        normalizeMenuInput({
          name: toggledItem.name,
          description: toggledItem.description,
          tagsText: toggledItem.tagsText,
          is_available: toggledItem.is_available,
          sort_order: toggledItem.sort_order,
        })
      )

      setMenuItems((current) =>
        sortMenuItems(
          current.map((currentItem) =>
            currentItem.id === item.id ? toEditableMenuItem(updated) : currentItem
          )
        )
      )
      setMenuNotice(
        updated.is_available
          ? `"${updated.name}" is now available.`
          : `"${updated.name}" is now marked sold out.`
      )
      setError(null)
    } catch {
      setMenuItems((current) =>
        current.map((currentItem) => (currentItem.id === item.id ? item : currentItem))
      )
      setError('Could not update availability for that menu item.')
    } finally {
      setSavingMenuItemId(null)
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await signOut()
    } finally {
      setLoggingOut(false)
    }
  }

  const counts = useMemo(
    () => ({
      all: orders.length,
      new: orders.filter((order) => order.status === 'new').length,
      in_progress: orders.filter((order) => order.status === 'in_progress').length,
      completed: orders.filter((order) => order.status === 'completed').length,
    }),
    [orders]
  )

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders
    return orders.filter((order) => order.status === filter)
  }, [filter, orders])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(182,214,170,0.32),_transparent_38%),linear-gradient(180deg,_#f8f4ea_0%,_#f2ecdf_100%)] font-admin text-matcha-900">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-5 sm:px-6 sm:py-8">
        <header className="rounded-[2rem] border border-white/70 bg-cream-50/90 px-5 py-5 shadow-[0_18px_48px_rgba(55,79,53,0.08)] backdrop-blur">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-matcha-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-matcha-700">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${shopSettings?.isOpen ? 'bg-matcha-500' : 'bg-matcha-300'}`}
                />
                Cafe Admin
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-matcha-900">
                  Admin console
                </h1>
                <p className="mt-1 max-w-xl text-sm leading-6 text-matcha-600">
                  Signed in as {user?.email ?? 'admin'}. Manage shop status, drinks, and incoming orders in one place.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <button
                type="button"
                onClick={() => void load('refresh')}
                disabled={refreshing}
                className="rounded-full border border-matcha-200 bg-white px-4 py-2 text-sm font-semibold text-matcha-700 transition hover:border-matcha-300 hover:text-matcha-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-full bg-matcha-900 px-4 py-2 text-sm font-semibold text-cream-50 transition hover:bg-matcha-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut ? 'Signing out...' : 'Log out'}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="mt-4 rounded-[1.75rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {settingsNotice && (
          <div className="mt-4 rounded-[1.75rem] border border-matcha-200 bg-matcha-50 px-4 py-3 text-sm text-matcha-700 shadow-sm">
            {settingsNotice}
          </div>
        )}

        {menuNotice && (
          <div className="mt-4 rounded-[1.75rem] border border-matcha-200 bg-matcha-50 px-4 py-3 text-sm text-matcha-700 shadow-sm">
            {menuNotice}
          </div>
        )}

        <section className="mt-5 rounded-[2rem] border border-white/70 bg-cream-50/90 p-5 shadow-[0_18px_48px_rgba(55,79,53,0.08)]">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-matcha-500">
                  Shop settings
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-matcha-900">
                  {shopSettings?.isOpen ? 'Open and taking orders' : 'Closed to new orders'}
                </h2>
                <p className="mt-1 text-sm text-matcha-600">
                  Change the public ordering state and the message customers see.
                </p>
              </div>
              <div
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${
                  shopSettings?.isOpen
                    ? 'bg-matcha-100 text-matcha-700'
                    : 'bg-cream-200 text-matcha-700'
                }`}
              >
                {shopSettings?.isOpen ? 'Open' : 'Closed'}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="rounded-[1.6rem] border border-matcha-100 bg-white/80 p-4">
                <label
                  className="text-sm font-medium text-matcha-700"
                  htmlFor="shop-status-message"
                >
                  Customer-facing status message
                </label>
                <textarea
                  id="shop-status-message"
                  value={shopSettings?.statusMessage ?? ''}
                  onChange={(event) => {
                    setSettingsNotice(null)
                    setError(null)
                    setShopSettings((current) =>
                      current ? { ...current, statusMessage: event.target.value } : current
                    )
                  }}
                  rows={3}
                  placeholder="Taking orders until 6 PM"
                  className="mt-3 block w-full resize-none rounded-[1.25rem] border border-matcha-200 bg-cream-50 px-4 py-3 text-sm text-matcha-800 outline-none transition focus:border-matcha-400 focus:ring-2 focus:ring-matcha-200"
                />
              </div>

              <div className="rounded-[1.6rem] border border-matcha-100 bg-white/80 p-4">
                <p className="text-sm font-medium text-matcha-700">Ordering status</p>
                <div className="mt-3 flex rounded-full bg-cream-100 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsNotice(null)
                      setError(null)
                      setShopSettings((current) =>
                        current ? { ...current, isOpen: true } : current
                      )
                    }}
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      shopSettings?.isOpen
                        ? 'bg-matcha-900 text-cream-50 shadow-sm'
                        : 'text-matcha-600'
                    }`}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsNotice(null)
                      setError(null)
                      setShopSettings((current) =>
                        current ? { ...current, isOpen: false } : current
                      )
                    }}
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      shopSettings && !shopSettings.isOpen
                        ? 'bg-matcha-900 text-cream-50 shadow-sm'
                        : 'text-matcha-600'
                    }`}
                  >
                    Closed
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={savingSettings || !shopSettings}
                  className="mt-4 w-full rounded-full bg-matcha-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-matcha-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingSettings ? 'Saving settings...' : 'Save shop settings'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-white/70 bg-cream-50/90 p-5 shadow-[0_18px_48px_rgba(55,79,53,0.08)]">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-matcha-500">
                  Menu management
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-matcha-900">
                  Manage drinks
                </h2>
                <p className="mt-1 text-sm text-matcha-600">
                  Create, edit, reorder, and mark drinks sold out without touching code.
                </p>
              </div>
              <div className="inline-flex items-center rounded-full bg-matcha-100 px-4 py-2 text-sm font-semibold text-matcha-700">
                {loading ? 'Loading...' : `${menuItems.length} drinks`}
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-matcha-100 bg-white/85 p-4 sm:p-5">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-matcha-900">Add a new drink</h3>
                  <p className="mt-1 text-sm text-matcha-600">
                    Keep it simple: name, description, tags, availability, and sort order.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      className="text-sm font-medium text-matcha-700"
                      htmlFor="new-menu-item-name"
                    >
                      Drink name
                    </label>
                    <input
                      id="new-menu-item-name"
                      type="text"
                      value={newMenuItem.name}
                      onChange={(event) => {
                        setMenuNotice(null)
                        setError(null)
                        setNewMenuItem((current) => ({ ...current, name: event.target.value }))
                      }}
                      placeholder="Strawberry matcha latte"
                      className="mt-2 block w-full rounded-[1.2rem] border border-matcha-200 bg-cream-50 px-4 py-3 text-sm text-matcha-900 outline-none transition focus:border-matcha-400 focus:ring-2 focus:ring-matcha-200"
                    />
                  </div>

                  <div>
                    <label
                      className="text-sm font-medium text-matcha-700"
                      htmlFor="new-menu-item-tags"
                    >
                      Tags
                    </label>
                    <input
                      id="new-menu-item-tags"
                      type="text"
                      value={newMenuItem.tagsText}
                      onChange={(event) => {
                        setMenuNotice(null)
                        setError(null)
                        setNewMenuItem((current) => ({
                          ...current,
                          tagsText: event.target.value,
                        }))
                      }}
                      placeholder="iced, creamy, seasonal"
                      className="mt-2 block w-full rounded-[1.2rem] border border-matcha-200 bg-cream-50 px-4 py-3 text-sm text-matcha-900 outline-none transition focus:border-matcha-400 focus:ring-2 focus:ring-matcha-200"
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="text-sm font-medium text-matcha-700"
                    htmlFor="new-menu-item-description"
                  >
                    Description
                  </label>
                  <textarea
                    id="new-menu-item-description"
                    value={newMenuItem.description}
                    onChange={(event) => {
                      setMenuNotice(null)
                      setError(null)
                      setNewMenuItem((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }}
                    rows={3}
                    placeholder="Ceremonial matcha shaken with milk and strawberry cream."
                    className="mt-2 block w-full resize-none rounded-[1.2rem] border border-matcha-200 bg-cream-50 px-4 py-3 text-sm text-matcha-900 outline-none transition focus:border-matcha-400 focus:ring-2 focus:ring-matcha-200"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
                  <div>
                    <label
                      className="text-sm font-medium text-matcha-700"
                      htmlFor="new-menu-item-sort-order"
                    >
                      Sort order
                    </label>
                    <input
                      id="new-menu-item-sort-order"
                      type="number"
                      value={newMenuItem.sort_order}
                      onChange={(event) => {
                        setMenuNotice(null)
                        setError(null)
                        setNewMenuItem((current) => ({
                          ...current,
                          sort_order: Number.parseInt(event.target.value, 10) || 0,
                        }))
                      }}
                      className="mt-2 block w-full rounded-[1.2rem] border border-matcha-200 bg-cream-50 px-4 py-3 text-sm text-matcha-900 outline-none transition focus:border-matcha-400 focus:ring-2 focus:ring-matcha-200"
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-3 rounded-[1.2rem] border border-matcha-200 bg-cream-50 px-4 py-3 text-sm font-medium text-matcha-700">
                      <input
                        type="checkbox"
                        checked={newMenuItem.is_available}
                        onChange={(event) => {
                          setMenuNotice(null)
                          setError(null)
                          setNewMenuItem((current) => ({
                            ...current,
                            is_available: event.target.checked,
                          }))
                        }}
                        className="h-4 w-4 rounded border-matcha-300 text-matcha-600 focus:ring-matcha-400"
                      />
                      Available to order
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleCreateMenuItem()}
                    disabled={creatingMenuItem}
                    className="rounded-full bg-matcha-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-matcha-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creatingMenuItem ? 'Adding drink...' : 'Add drink'}
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[0, 1].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-[1.75rem] border border-matcha-100 bg-white/80 p-5"
                  >
                    <div className="h-5 w-40 rounded-full bg-matcha-100" />
                    <div className="mt-4 h-4 w-full rounded-full bg-matcha-100" />
                    <div className="mt-2 h-4 w-3/4 rounded-full bg-matcha-100" />
                    <div className="mt-5 h-10 rounded-[1.2rem] bg-matcha-100" />
                  </div>
                ))}
              </div>
            ) : menuItems.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-matcha-200 bg-white/70 px-6 py-10 text-center">
                <p className="text-lg font-semibold text-matcha-800">No drinks on the menu yet.</p>
                <p className="mt-2 text-sm text-matcha-500">
                  Add the first drink above and it will appear on the public menu right away.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {menuItems.map((item) => {
                  const isSaving = savingMenuItemId === item.id
                  const isDeleting = deletingMenuItemId === item.id

                  return (
                    <article
                      key={item.id}
                      className="rounded-[1.8rem] border border-matcha-100 bg-white/85 p-4 shadow-[0_12px_30px_rgba(55,79,53,0.05)] sm:p-5"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold text-matcha-900">{item.name}</h3>
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  item.is_available
                                    ? 'bg-matcha-100 text-matcha-700'
                                    : 'bg-cream-200 text-matcha-700'
                                }`}
                              >
                                {item.is_available ? 'Available' : 'Sold out'}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-matcha-500">
                              Public menu position: {item.sort_order}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => void handleToggleAvailability(item)}
                            disabled={isSaving || isDeleting}
                            className="rounded-full border border-matcha-200 bg-white px-4 py-2 text-sm font-semibold text-matcha-700 transition hover:border-matcha-300 hover:text-matcha-900 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {item.is_available ? 'Mark sold out' : 'Mark available'}
                          </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label
                              className="text-sm font-medium text-matcha-700"
                              htmlFor={`menu-item-name-${item.id}`}
                            >
                              Drink name
                            </label>
                            <input
                              id={`menu-item-name-${item.id}`}
                              type="text"
                              value={item.name}
                              onChange={(event) =>
                                handleMenuFieldChange(item.id, 'name', event.target.value)
                              }
                              className="mt-2 block w-full rounded-[1.2rem] border border-matcha-200 bg-cream-50 px-4 py-3 text-sm text-matcha-900 outline-none transition focus:border-matcha-400 focus:ring-2 focus:ring-matcha-200"
                            />
                          </div>

                          <div>
                            <label
                              className="text-sm font-medium text-matcha-700"
                              htmlFor={`menu-item-tags-${item.id}`}
                            >
                              Tags
                            </label>
                            <input
                              id={`menu-item-tags-${item.id}`}
                              type="text"
                              value={item.tagsText}
                              onChange={(event) =>
                                handleMenuFieldChange(item.id, 'tagsText', event.target.value)
                              }
                              className="mt-2 block w-full rounded-[1.2rem] border border-matcha-200 bg-cream-50 px-4 py-3 text-sm text-matcha-900 outline-none transition focus:border-matcha-400 focus:ring-2 focus:ring-matcha-200"
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            className="text-sm font-medium text-matcha-700"
                            htmlFor={`menu-item-description-${item.id}`}
                          >
                            Description
                          </label>
                          <textarea
                            id={`menu-item-description-${item.id}`}
                            value={item.description}
                            onChange={(event) =>
                              handleMenuFieldChange(item.id, 'description', event.target.value)
                            }
                            rows={3}
                            className="mt-2 block w-full resize-none rounded-[1.2rem] border border-matcha-200 bg-cream-50 px-4 py-3 text-sm text-matcha-900 outline-none transition focus:border-matcha-400 focus:ring-2 focus:ring-matcha-200"
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
                          <div>
                            <label
                              className="text-sm font-medium text-matcha-700"
                              htmlFor={`menu-item-sort-order-${item.id}`}
                            >
                              Sort order
                            </label>
                            <input
                              id={`menu-item-sort-order-${item.id}`}
                              type="number"
                              value={item.sort_order}
                              onChange={(event) =>
                                handleMenuFieldChange(
                                  item.id,
                                  'sort_order',
                                  Number.parseInt(event.target.value, 10) || 0
                                )
                              }
                              className="mt-2 block w-full rounded-[1.2rem] border border-matcha-200 bg-cream-50 px-4 py-3 text-sm text-matcha-900 outline-none transition focus:border-matcha-400 focus:ring-2 focus:ring-matcha-200"
                            />
                          </div>

                          <div className="flex items-end">
                            <label className="inline-flex items-center gap-3 rounded-[1.2rem] border border-matcha-200 bg-cream-50 px-4 py-3 text-sm font-medium text-matcha-700">
                              <input
                                type="checkbox"
                                checked={item.is_available}
                                onChange={(event) =>
                                  handleMenuFieldChange(
                                    item.id,
                                    'is_available',
                                    event.target.checked
                                  )
                                }
                                className="h-4 w-4 rounded border-matcha-300 text-matcha-600 focus:ring-matcha-400"
                              />
                              Available to order
                            </label>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs uppercase tracking-[0.2em] text-matcha-400">
                            {isSaving ? 'Saving changes...' : 'Ready to save'}
                          </p>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              type="button"
                              onClick={() => void handleSaveMenuItem(item)}
                              disabled={isSaving || isDeleting}
                              className="rounded-full bg-matcha-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-matcha-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Save changes
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteMenuItem(item)}
                              disabled={isSaving || isDeleting}
                              className="rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-matcha-500">
              Order backlog
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-matcha-900">Track incoming orders</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.75rem] border border-white/70 bg-cream-50/95 px-5 py-4 shadow-[0_14px_36px_rgba(55,79,53,0.07)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-matcha-500">
              New orders
            </p>
            <p className="mt-3 text-4xl font-semibold text-matcha-900">
              {loading ? '--' : counts.new}
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white/70 bg-cream-50/95 px-5 py-4 shadow-[0_14px_36px_rgba(55,79,53,0.07)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-matcha-500">
              In progress
            </p>
            <p className="mt-3 text-4xl font-semibold text-matcha-900">
              {loading ? '--' : counts.in_progress}
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white/70 bg-cream-50/95 px-5 py-4 shadow-[0_14px_36px_rgba(55,79,53,0.07)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-matcha-500">
              Total orders
            </p>
            <p className="mt-3 text-4xl font-semibold text-matcha-900">
              {loading ? '--' : counts.all}
            </p>
          </div>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-white/70 bg-cream-50/90 p-4 shadow-[0_18px_48px_rgba(55,79,53,0.08)] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-matcha-500">
                Filter backlog
              </p>
              <p className="mt-1 text-sm text-matcha-600">
                Keep completed orders visible unless you want a tighter working view.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['all', 'new', 'in_progress', 'completed'] as const).map((value) => {
                const label =
                  value === 'all'
                    ? 'All'
                    : value === 'in_progress'
                      ? 'In Progress'
                      : STATUS_LABELS[value]
                const count = value === 'all' ? counts.all : counts[value]
                const active = filter === value

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? 'bg-matcha-900 text-cream-50 shadow-sm'
                        : 'border border-matcha-200 bg-white text-matcha-700 hover:border-matcha-300 hover:text-matcha-900'
                    }`}
                  >
                    {label} ({loading ? '--' : count})
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mt-5 flex-1">
          {!loading && filteredOrders.length > 0 && (
            <p className="mb-3 text-sm text-matcha-500">
              Showing {filteredOrders.length} {selectedFilterLabel.toLowerCase()}.
            </p>
          )}

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-[1.75rem] border border-white/70 bg-cream-50/90 p-5 shadow-[0_12px_30px_rgba(55,79,53,0.06)]"
                >
                  <div className="h-4 w-28 rounded-full bg-matcha-100" />
                  <div className="mt-4 h-6 w-40 rounded-full bg-matcha-100" />
                  <div className="mt-3 h-4 w-56 rounded-full bg-matcha-100" />
                  <div className="mt-6 h-10 rounded-[1.2rem] bg-matcha-100" />
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-matcha-200 bg-cream-50/80 px-6 py-12 text-center shadow-[0_12px_30px_rgba(55,79,53,0.05)]">
              <p className="text-lg font-semibold text-matcha-800">
                {orders.length === 0 ? 'No orders yet.' : 'No orders match this filter.'}
              </p>
              <p className="mt-2 text-sm text-matcha-500">
                {orders.length === 0
                  ? 'Place a test order from the public menu and it will show up here automatically.'
                  : 'Switch filters or refresh to see the rest of the backlog.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order, index) => {
                const isNew = order.status === 'new'
                const isUpdating = updatingOrderId === order.id

                return (
                  <article
                    key={order.id}
                    className={`rounded-[1.9rem] border bg-cream-50/95 p-4 shadow-[0_16px_34px_rgba(55,79,53,0.07)] transition sm:p-5 ${
                      isNew ? 'border-matcha-200 ring-1 ring-matcha-100' : 'border-white/70'
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-semibold text-matcha-900">
                              {order.customer_name}
                            </h2>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGES[order.status]}`}
                            >
                              {STATUS_LABELS[order.status]}
                            </span>
                            {index === 0 && filter !== 'completed' && (
                              <span className="inline-flex rounded-full bg-matcha-100 px-3 py-1 text-xs font-semibold text-matcha-700">
                                Latest
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-base font-medium text-matcha-700">
                            {order.menu_items?.name ?? 'Drink unavailable'}
                          </p>
                          {order.notes ? (
                            <p className="mt-2 rounded-2xl bg-white/80 px-3 py-2 text-sm leading-6 text-matcha-600">
                              {order.notes}
                            </p>
                          ) : (
                            <p className="mt-2 text-sm text-matcha-400">No notes</p>
                          )}
                        </div>

                        <div className="shrink-0 rounded-2xl bg-white/80 px-3 py-2 text-sm text-matcha-500">
                          {formatTimestamp(order.created_at)}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <label
                          className="text-sm font-medium text-matcha-600"
                          htmlFor={`order-status-${order.id}`}
                        >
                          Status
                        </label>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                          <select
                            id={`order-status-${order.id}`}
                            value={order.status}
                            onChange={(event) =>
                              void handleStatusChange(order.id, event.target.value as OrderStatus)
                            }
                            disabled={isUpdating}
                            className="block w-full rounded-2xl border border-matcha-200 bg-white px-4 py-3 text-sm font-semibold text-matcha-800 outline-none transition focus:border-matcha-400 focus:ring-2 focus:ring-matcha-200 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[220px]"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>

                          <div className="text-xs font-medium uppercase tracking-[0.2em] text-matcha-400">
                            {isUpdating ? 'Saving...' : isNew ? 'Needs attention' : 'Updated'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
