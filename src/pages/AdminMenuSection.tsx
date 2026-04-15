import { useState, useCallback, useEffect } from 'react'
import {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
} from '../lib/api'
import type { MenuItemRow, MenuItemFormData } from '../lib/types'

// ── Form value types (strings for controlled inputs) ────────────────────
interface FormValues {
  name: string
  description: string
  priceDollars: string   // e.g. "5.95" — converted to price_cents on save
  tagsRaw: string        // comma-separated
  is_available: boolean
  sort_order: string
}

const EMPTY_FORM: FormValues = {
  name: '',
  description: '',
  priceDollars: '',
  tagsRaw: '',
  is_available: true,
  sort_order: '1',
}

function rowToForm(item: MenuItemRow): FormValues {
  return {
    name: item.name,
    description: item.description,
    priceDollars: (item.price_cents / 100).toFixed(2),
    tagsRaw: item.tags.join(', '),
    is_available: item.is_available,
    sort_order: String(item.sort_order),
  }
}

function formToData(v: FormValues): MenuItemFormData {
  return {
    name: v.name.trim(),
    description: v.description.trim(),
    price_cents: Math.round(parseFloat(v.priceDollars || '0') * 100),
    tags: v.tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    is_available: v.is_available,
    sort_order: parseInt(v.sort_order || '0', 10),
  }
}

function validateForm(v: FormValues): string | null {
  if (!v.name.trim()) return 'Name is required.'
  if (!v.description.trim()) return 'Description is required.'
  const price = parseFloat(v.priceDollars)
  if (v.priceDollars === '' || isNaN(price) || price < 0)
    return 'Enter a valid price.'
  return null
}

// ── Shared input class ───────────────────────────────────────────────
const inputCls =
  'w-full px-3 py-2 rounded-xl bg-slate-700 border border-slate-600 ' +
  'text-slate-100 text-sm placeholder:text-slate-500 outline-none ' +
  'focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition'

// ── Inline create / edit form ────────────────────────────────────────
interface FormProps {
  initial: FormValues
  onSave: (data: MenuItemFormData) => Promise<void>
  onCancel: () => void
  saving: boolean
  isNew?: boolean
}

function MenuItemForm({ initial, onSave, onCancel, saving, isNew }: FormProps) {
  const [v, setV] = useState<FormValues>(initial)
  const [formError, setFormError] = useState<string | null>(null)

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setV((prev) => ({ ...prev, [key]: val }))
    if (formError) setFormError(null)
  }

  async function handleSave() {
    const err = validateForm(v)
    if (err) {
      setFormError(err)
      return
    }
    await onSave(formToData(v))
  }

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-2xl p-4 flex flex-col gap-3">
      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
        {isNew ? 'New item' : 'Edit item'}
      </p>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Name *</label>
        <input
          type="text"
          value={v.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Classic Matcha Latte"
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Description *</label>
        <textarea
          value={v.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Short description shown to customers"
          rows={2}
          className={inputCls + ' resize-none'}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Price ($) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={v.priceDollars}
            onChange={(e) => set('priceDollars', e.target.value)}
            placeholder="5.95"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Sort order</label>
          <input
            type="number"
            min="0"
            step="1"
            value={v.sort_order}
            onChange={(e) => set('sort_order', e.target.value)}
            placeholder="1"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">
          Tags{' '}
          <span className="text-slate-600 font-normal">(comma-separated, optional)</span>
        </label>
        <input
          type="text"
          value={v.tagsRaw}
          onChange={(e) => set('tagsRaw', e.target.value)}
          placeholder="bestseller, dairy-free option"
          className={inputCls}
        />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={v.is_available}
          onChange={(e) => set('is_available', e.target.checked)}
          className="w-4 h-4 accent-emerald-500 cursor-pointer"
        />
        <span className="text-sm text-slate-300">Available to order</span>
      </label>

      {formError && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          {formError}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Main menu section ───────────────────────────────────────────────
export default function AdminMenuSection() {
  const [items, setItems] = useState<MenuItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await getAllMenuItems()
      setItems(data)
    } catch {
      setError('Failed to load menu items.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(data: MenuItemFormData) {
    setSaving(true)
    try {
      const created = await createMenuItem(data)
      setItems((prev) =>
        [...prev, created].sort((a, b) => a.sort_order - b.sort_order)
      )
      setShowAddForm(false)
    } catch {
      setError('Failed to create item.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(id: string, data: MenuItemFormData) {
    setSaving(true)
    try {
      const updated = await updateMenuItem(id, data)
      setItems((prev) =>
        prev
          .map((item) => (item.id === id ? updated : item))
          .sort((a, b) => a.sort_order - b.sort_order)
      )
      setEditingId(null)
    } catch {
      setError('Failed to update item.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(item: MenuItemRow) {
    setTogglingId(item.id)
    try {
      await toggleMenuItemAvailability(item.id, !item.is_available)
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_available: !i.is_available } : i
        )
      )
    } catch {
      setError('Failed to update availability.')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(item: MenuItemRow) {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    setDeletingId(item.id)
    try {
      await deleteMenuItem(item.id)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      if (editingId === item.id) setEditingId(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete item.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Menu items
        </h2>
        {!showAddForm && (
          <button
            onClick={() => {
              setShowAddForm(true)
              setEditingId(null)
            }}
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
          >
            + Add item
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-3">
          <MenuItemForm
            initial={EMPTY_FORM}
            onSave={handleCreate}
            onCancel={() => setShowAddForm(false)}
            saving={saving}
            isNew
          />
        </div>
      )}

      {/* Items list */}
      {loading ? (
        <p className="text-slate-500 text-sm animate-pulse">Loading menu…</p>
      ) : items.length === 0 && !showAddForm ? (
        <p className="text-slate-600 text-sm">No menu items yet. Add one above.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) =>
            editingId === item.id ? (
              <MenuItemForm
                key={item.id}
                initial={rowToForm(item)}
                onSave={(data) => handleUpdate(item.id, data)}
                onCancel={() => setEditingId(null)}
                saving={saving}
              />
            ) : (
              <div
                key={item.id}
                className={`bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 transition-opacity ${
                  deletingId === item.id ? 'opacity-50' : ''
                }`}
              >
                {/* Name + price + availability pill */}
                <div className="flex items-start gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-slate-100 text-sm">
                      {item.name}
                    </span>
                    <span className="ml-2 text-sm text-slate-400">
                      ${(item.price_cents / 100).toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggle(item)}
                    disabled={togglingId === item.id}
                    className={`shrink-0 text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors disabled:opacity-40 ${
                      item.is_available
                        ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        : 'bg-slate-600/50 text-slate-500 hover:bg-slate-600/70'
                    }`}
                  >
                    {togglingId === item.id
                      ? '…'
                      : item.is_available
                      ? 'Available'
                      : 'Sold out'}
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 leading-relaxed mb-2 line-clamp-2">
                  {item.description}
                </p>

                {/* Tags */}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-slate-700 text-slate-400 rounded-full px-2 py-0.5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer: sort order + action buttons */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-mono">
                    #{item.sort_order}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(item.id)
                        setShowAddForm(false)
                      }}
                      className="text-xs px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      className="text-xs px-3 py-1 rounded-lg bg-red-900/40 hover:bg-red-900/70 text-red-400 transition-colors disabled:opacity-50"
                    >
                      {deletingId === item.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
