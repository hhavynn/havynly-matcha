import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import PageSection from '../components/PageSection'
import { getMenu, getShopIsOpen, submitOrder } from '../lib/api'
import type { MenuItemRow } from '../lib/types'

type PageStatus = 'idle' | 'submitting' | 'success' | 'error'

export default function OrderPage() {
  // Data loading
  const [menu, setMenu] = useState<MenuItemRow[]>([])
  const [shopIsOpen, setShopIsOpen] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [name, setName] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [notes, setNotes] = useState('')
  const [pageStatus, setPageStatus] = useState<PageStatus>('idle')
  const [errors, setErrors] = useState<{ name?: string; item?: string }>({})

  useEffect(() => {
    async function load() {
      try {
        const [items, isOpen] = await Promise.all([getMenu(), getShopIsOpen()])
        setMenu(items)
        setShopIsOpen(isOpen)
        // Pre-select first item for convenience
        if (items.length > 0) setSelectedItemId(items[0].id)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!name.trim()) errs.name = 'Please enter your name.'
    if (!selectedItemId) errs.item = 'Please select a drink.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setPageStatus('submitting')
    try {
      await submitOrder({
        customer_name: name.trim(),
        menu_item_id: selectedItemId,
        notes: notes.trim() || undefined,
      })
      setPageStatus('success')
    } catch {
      setPageStatus('error')
    }
  }

  function resetForm() {
    setName('')
    setNotes('')
    setErrors({})
    setPageStatus('idle')
    if (menu.length > 0) setSelectedItemId(menu[0].id)
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <PageSection narrow className="text-center py-20">
        <p className="text-matcha-400 text-sm animate-pulse">Loading…</p>
      </PageSection>
    )
  }

  // ── Shop closed ───────────────────────────────────────────────
  if (shopIsOpen === false) {
    return (
      <PageSection narrow className="text-center py-20">
        <p className="text-4xl mb-4">🍵</p>
        <h1 className="text-xl font-bold text-matcha-800 mb-2">We're closed right now</h1>
        <p className="text-matcha-400 text-sm mb-6">
          Check back when we're open to place your order.
        </p>
        <Link to="/">
          <Button variant="secondary">Back to Home</Button>
        </Link>
      </PageSection>
    )
  }

  // ── Success ───────────────────────────────────────────────────
  if (pageStatus === 'success') {
    return (
      <PageSection narrow className="text-center py-20">
        <p className="text-5xl mb-4">✅</p>
        <h1 className="text-xl font-bold text-matcha-800 mb-2">Order placed!</h1>
        <p className="text-matcha-500 text-sm mb-6">
          Thank you, <span className="font-medium">{name}</span>. We'll have your drink ready soon.
        </p>
        <Button variant="secondary" onClick={resetForm}>
          Place another order
        </Button>
      </PageSection>
    )
  }

  // ── Order form ────────────────────────────────────────────────
  return (
    <PageSection narrow>
      <h1 className="text-2xl font-bold text-matcha-800 mb-1">Place an Order</h1>
      <p className="text-matcha-500 text-sm mb-6">No account needed — just your name.</p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-matcha-700 mb-1.5" htmlFor="name">
            Your name <span className="text-matcha-400 font-normal">(required)</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setErrors((prev) => ({ ...prev, name: undefined }))
            }}
            placeholder="e.g. Havyn"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white text-matcha-900 placeholder:text-matcha-300 outline-none focus:ring-2 focus:ring-matcha-400 transition ${
              errors.name ? 'border-red-400' : 'border-cream-300'
            }`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Drink selection */}
        <div>
          <p className="block text-sm font-medium text-matcha-700 mb-2">
            Choose your drink <span className="text-matcha-400 font-normal">(required)</span>
          </p>
          <div className="flex flex-col gap-2">
            {menu.map((item) => (
              <label
                key={item.id}
                className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${
                  selectedItemId === item.id
                    ? 'border-matcha-400 bg-matcha-50'
                    : 'border-cream-200 bg-white hover:border-matcha-200'
                }`}
              >
                <input
                  type="radio"
                  name="drink"
                  value={item.id}
                  checked={selectedItemId === item.id}
                  onChange={() => {
                    setSelectedItemId(item.id)
                    setErrors((prev) => ({ ...prev, item: undefined }))
                  }}
                  className="mt-0.5 accent-matcha-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-matcha-800">{item.name}</span>
                    <span className="text-sm text-matcha-600 font-medium shrink-0">
                      ${(item.price_cents / 100).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-matcha-500 mt-0.5 leading-relaxed">{item.description}</p>
                </div>
              </label>
            ))}
          </div>
          {errors.item && <p className="text-xs text-red-500 mt-1">{errors.item}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-matcha-700 mb-1.5" htmlFor="notes">
            Notes <span className="text-matcha-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Less sweet, oat milk, extra hot"
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-cream-300 text-sm bg-white text-matcha-900 placeholder:text-matcha-300 outline-none focus:ring-2 focus:ring-matcha-400 transition resize-none"
          />
        </div>

        {pageStatus === 'error' && (
          <Card className="p-3 border-red-200 bg-red-50">
            <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
          </Card>
        )}

        <Button type="submit" size="lg" disabled={pageStatus === 'submitting'} className="w-full">
          {pageStatus === 'submitting' ? 'Placing order…' : 'Place Order'}
        </Button>
      </form>
    </PageSection>
  )
}
