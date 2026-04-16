import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import PageSection from '../components/PageSection'
import { ShopClosedError, getMenu, getShopSettings, submitOrder } from '../lib/api'
import type { MenuItemRow, ShopSettings } from '../lib/types'

type PageStatus = 'idle' | 'submitting' | 'success' | 'error'

export default function OrderPage() {
  const [menu, setMenu] = useState<MenuItemRow[]>([])
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [notes, setNotes] = useState('')
  const [pageStatus, setPageStatus] = useState<PageStatus>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ name?: string; item?: string }>({})

  useEffect(() => {
    async function load() {
      try {
        const [items, settings] = await Promise.all([getMenu(), getShopSettings()])
        setMenu(items)
        setShopSettings(settings)

        if (items.length > 0) {
          setSelectedItemId(items[0].id)
        }
      } catch {
        setLoadError('Could not load ordering right now. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  function validate(): boolean {
    const nextErrors: typeof errors = {}

    if (!name.trim()) nextErrors.name = 'Please enter your name.'
    if (!selectedItemId) nextErrors.item = 'Please select a drink.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!shopSettings?.isOpen) {
      setSubmitError(shopSettings?.statusMessage ?? 'Orders are closed right now.')
      return
    }

    if (!validate()) return

    setPageStatus('submitting')
    setSubmitError(null)

    try {
      await submitOrder({
        customer_name: name.trim(),
        menu_item_id: selectedItemId,
        notes: notes.trim() || undefined,
      })
      setPageStatus('success')
    } catch (error) {
      if (error instanceof ShopClosedError) {
        setSubmitError(error.message)
        setShopSettings((current) =>
          current
            ? { ...current, isOpen: false, statusMessage: error.message }
            : { isOpen: false, statusMessage: error.message }
        )
      } else {
        setSubmitError('Something went wrong. Please try again.')
      }
      setPageStatus('error')
    }
  }

  function resetForm() {
    setName('')
    setNotes('')
    setErrors({})
    setSubmitError(null)
    setPageStatus('idle')

    if (menu.length > 0) {
      setSelectedItemId(menu[0].id)
    }
  }

  if (loading) {
    return (
      <PageSection narrow className="py-20 text-center">
        <p className="animate-pulse text-sm text-matcha-400">Loading...</p>
      </PageSection>
    )
  }

  if (loadError) {
    return (
      <PageSection narrow className="py-20 text-center">
        <Card className="border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{loadError}</p>
        </Card>
      </PageSection>
    )
  }

  if (shopSettings && !shopSettings.isOpen) {
    return (
      <PageSection narrow className="py-20 text-center">
        <div className="mx-auto max-w-md rounded-[2rem] bg-cream-50 p-8 shadow-[0_18px_48px_rgba(55,79,53,0.08)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-matcha-100 text-matcha-700">
            Closed
          </div>
          <h1 className="mt-5 text-2xl font-bold text-matcha-800">The shop is closed right now</h1>
          <p className="mt-3 text-sm leading-6 text-matcha-500">{shopSettings.statusMessage}</p>
          <Link to="/" className="mt-6 inline-flex">
            <Button variant="secondary">Back to home</Button>
          </Link>
        </div>
      </PageSection>
    )
  }

  if (pageStatus === 'success') {
    return (
      <PageSection narrow className="py-20 text-center">
        <div className="mx-auto max-w-md rounded-[2rem] bg-cream-50 p-8 shadow-[0_18px_48px_rgba(55,79,53,0.08)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-matcha-100 text-matcha-700">
            Ready
          </div>
          <h1 className="mt-5 text-2xl font-bold text-matcha-800">Order placed</h1>
          <p className="mt-3 text-sm leading-6 text-matcha-500">
            Thank you, <span className="font-medium">{name}</span>. We will have your drink ready soon.
          </p>
          <Button className="mt-6" variant="secondary" onClick={resetForm}>
            Place another order
          </Button>
        </div>
      </PageSection>
    )
  }

  return (
    <PageSection narrow>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-matcha-800">order here</h1>
        <p className="mt-1 text-sm text-matcha-500">
          your name and drink order pls
        </p>
        {shopSettings && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-matcha-100 px-4 py-2 text-sm font-medium text-matcha-700">
            <span className="h-2 w-2 rounded-full bg-matcha-500 animate-pulse" />
            {shopSettings.statusMessage}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-matcha-700" htmlFor="name">
            Your name <span className="font-normal text-matcha-400">(required)</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setErrors((current) => ({ ...current, name: undefined }))
              setSubmitError(null)
            }}
            placeholder="e.g. Havyn"
            className={`w-full rounded-full bg-cream-200 px-5 py-4 text-base text-matcha-900 outline-none transition-shadow placeholder:text-matcha-400 focus:ring-2 focus:ring-matcha-500 ${errors.name ? 'ring-2 ring-red-400' : ''
              }`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>

        <div>
          <p className="mb-2 block text-sm font-medium text-matcha-700">
            Choose your drink <span className="font-normal text-matcha-400">(required)</span>
          </p>
          <div className="flex flex-col gap-2">
            {menu.map((item) => (
              <label
                key={item.id}
                className={`flex cursor-pointer items-start gap-4 rounded-3xl p-5 transition-all duration-300 ${selectedItemId === item.id
                  ? 'bg-cream-50 ring-2 ring-matcha-300 shadow-[0_12px_40px_rgba(27,28,26,0.05)]'
                  : 'bg-cream-200 hover:bg-cream-300'
                  }`}
              >
                <input
                  type="radio"
                  name="drink"
                  value={item.id}
                  checked={selectedItemId === item.id}
                  onChange={() => {
                    setSelectedItemId(item.id)
                    setErrors((current) => ({ ...current, item: undefined }))
                    setSubmitError(null)
                  }}
                  className="mt-0.5 accent-matcha-500"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-matcha-800">{item.name}</span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-matcha-500">{item.description}</p>
                </div>
              </label>
            ))}
          </div>
          {errors.item && <p className="mt-1 text-xs text-red-500">{errors.item}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-matcha-700" htmlFor="notes">
            Notes <span className="font-normal text-matcha-400">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value)
              setSubmitError(null)
            }}
            placeholder="e.g. Less sweet, oat milk, or extra hot"
            rows={3}
            className="w-full resize-none rounded-3xl bg-cream-200 px-5 py-4 text-base text-matcha-900 outline-none transition-shadow placeholder:text-matcha-400 focus:ring-2 focus:ring-matcha-500"
          />
        </div>

        {submitError && (
          <Card className="border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{submitError}</p>
          </Card>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={pageStatus === 'submitting' || !shopSettings?.isOpen}
          className="w-full"
        >
          {pageStatus === 'submitting' ? 'Placing order...' : 'Place order'}
        </Button>
      </form>
    </PageSection>
  )
}
