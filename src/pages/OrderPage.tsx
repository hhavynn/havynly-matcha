import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import PageSection from '../components/PageSection'
import { ShopClosedError, getMenu, getShopSettings, submitOrder } from '../lib/api'
import type { MenuItemRow, ShopSettings } from '../lib/types'

type PageStatus = 'idle' | 'submitting' | 'success' | 'error'

const CATEGORY_ORDER = [
  'The Classics',
  'Floral & Tea Infusions',
  'Fruit Pairings',
  'Specialty Toppings',
]

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'The Classics': 'boring pick.',
  'Floral & Tea Infusions': 'molly tea dupeee',
  'Fruit Pairings': 'fruity zesty',
  'Specialty Toppings': 'this one my favorite',
  Other: 'Small-batch drinks on the current menu.',
}

function getDrinkCategory(item: MenuItemRow) {
  return CATEGORY_ORDER.find((category) => item.tags.includes(category)) ?? 'Other'
}

function groupMenuItems(items: MenuItemRow[]) {
  const groups = new Map<string, MenuItemRow[]>()

  items.forEach((item) => {
    const category = getDrinkCategory(item)
    groups.set(category, [...(groups.get(category) ?? []), item])
  })

  return [...groups.entries()].sort(([left], [right]) => {
    const leftIndex = CATEGORY_ORDER.indexOf(left)
    const rightIndex = CATEGORY_ORDER.indexOf(right)
    const safeLeftIndex = leftIndex === -1 ? CATEGORY_ORDER.length : leftIndex
    const safeRightIndex = rightIndex === -1 ? CATEGORY_ORDER.length : rightIndex
    return safeLeftIndex - safeRightIndex
  })
}

function StateIcon({ variant }: { variant: 'closed' | 'success' }) {
  const isSuccess = variant === 'success'

  return (
    <div
      className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${isSuccess ? 'bg-matcha-100 text-matcha-700' : 'bg-cream-200 text-matcha-700'
        }`}
    >
      <svg
        aria-hidden="true"
        className="h-8 w-8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        {isSuccess ? (
          <>
            <path d="M5 13.5 9.2 17 19 7" />
            <path d="M4.5 20h15" />
            <path d="M7 20c.3-3 2.1-5 5-5s4.7 2 5 5" />
          </>
        ) : (
          <>
            <path d="M7 9h10" />
            <path d="M8 9v7a4 4 0 0 0 8 0V9" />
            <path d="M6.5 20h11" />
            <path d="M9 5c.8.7 1.2 1.4 1.2 2.2" />
            <path d="M13 4c.8.8 1.2 1.6 1.2 2.5" />
          </>
        )}
      </svg>
    </div>
  )
}

export default function OrderPage() {
  const [menu, setMenu] = useState<MenuItemRow[]>([])
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [orderedDrinkName, setOrderedDrinkName] = useState('')
  const [notes, setNotes] = useState('')
  const [pageStatus, setPageStatus] = useState<PageStatus>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ name?: string; item?: string }>({})

  const groupedMenu = useMemo(() => groupMenuItems(menu), [menu])
  const selectedDrinkName = useMemo(
    () => menu.find((item) => item.id === selectedItemId)?.name ?? '',
    [menu, selectedItemId]
  )

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
        setLoadError('The order form is taking a tiny tea break. Please refresh in a moment.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  function validate(): boolean {
    const nextErrors: typeof errors = {}

    if (!name.trim()) nextErrors.name = 'Add your name so I know who this is for.'
    if (!selectedItemId) nextErrors.item = 'Choose a drink before sending your order.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!shopSettings?.isOpen) {
      setSubmitError(shopSettings?.statusMessage ?? 'Ordering is paused right now.')
      return
    }

    if (!validate()) return

    const drinkNameForConfirmation = selectedDrinkName
    setPageStatus('submitting')
    setSubmitError(null)

    try {
      await submitOrder({
        customer_name: name.trim(),
        menu_item_id: selectedItemId,
        notes: notes.trim() || undefined,
      })
      setOrderedDrinkName(drinkNameForConfirmation)
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
        setSubmitError('That order did not go through. Please try once more.')
      }
      setPageStatus('error')
    }
  }

  function resetForm() {
    setName('')
    setNotes('')
    setErrors({})
    setSubmitError(null)
    setOrderedDrinkName('')
    setPageStatus('idle')

    if (menu.length > 0) {
      setSelectedItemId(menu[0].id)
    }
  }

  if (loading) {
    return (
      <PageSection narrow className="py-20 text-center">
        <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-matcha-100" />
        <p className="mt-4 text-sm text-matcha-500">Steeping the menu...</p>
      </PageSection>
    )
  }

  if (loadError) {
    return (
      <PageSection narrow className="py-20 text-center">
        <Card className="border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-medium text-red-700">{loadError}</p>
          <p className="mt-1 text-xs text-red-500">If this keeps happening, text me your order.</p>
        </Card>
      </PageSection>
    )
  }

  if (shopSettings && !shopSettings.isOpen) {
    return (
      <PageSection narrow className="py-20 text-center">
        <div className="mx-auto max-w-md rounded-[2rem] border border-white/70 bg-cream-50 p-8 shadow-[0_18px_48px_rgba(55,79,53,0.08)]">
          <StateIcon variant="closed" />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-matcha-400">
            Ordering paused
          </p>
          <h1 className="mt-2 text-2xl font-bold text-matcha-800">The matcha bar is closed for now</h1>
          <p className="mt-3 text-sm leading-6 text-matcha-500">{shopSettings.statusMessage}</p>
          <Link to="/" className="mt-6 inline-flex">
            <Button variant="secondary">Back to the menu</Button>
          </Link>
        </div>
      </PageSection>
    )
  }

  if (pageStatus === 'success') {
    return (
      <PageSection narrow className="py-20 text-center">
        <div className="mx-auto max-w-md rounded-[2rem] border border-white/70 bg-cream-50 p-8 shadow-[0_18px_48px_rgba(55,79,53,0.08)]">
          <StateIcon variant="success" />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-matcha-400">
            Order sent
          </p>
          <h1 className="mt-2 text-2xl font-bold text-matcha-800">
            Your {orderedDrinkName || 'drink'} is on its way, {name.trim()}.
          </h1>
          <p className="mt-3 text-sm leading-6 text-matcha-500">
            I got your order. Keep an eye out and I will let you know when it is ready.
          </p>
          <Button className="mt-6" variant="secondary" onClick={resetForm}>
            Order another drink
          </Button>
        </div>
      </PageSection>
    )
  }

  return (
    <PageSection narrow>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-matcha-400">
          Place an order
        </p>
        <h1 className="mt-2 text-3xl font-bold text-matcha-800">wtf do u want bro</h1>
        <p className="mt-2 text-sm leading-6 text-matcha-500">
          pick a damn drink
        </p>
        {shopSettings && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-matcha-100 px-4 py-2 text-sm font-medium text-matcha-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-matcha-500" />
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

          {menu.length === 0 ? (
            <Card className="border border-dashed border-matcha-200 bg-cream-50/80 p-6 text-center">
              <p className="text-sm font-medium text-matcha-700">No drinks are available right now.</p>
              <p className="mt-1 text-xs leading-5 text-matcha-500">Check back soon for the next batch.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {groupedMenu.map(([category, items]) => (
                <section key={category}>
                  <div className="mb-3">
                    <h2 className="text-base font-semibold text-matcha-800">{category}</h2>
                    <p className="mt-0.5 text-xs leading-5 text-matcha-500">
                      {CATEGORY_DESCRIPTIONS[category] ?? CATEGORY_DESCRIPTIONS.Other}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {items.map((item) => (
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
                          <p className="mt-0.5 text-xs leading-relaxed text-matcha-500">
                            {item.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {errors.item && <p className="mt-2 text-xs text-red-500">{errors.item}</p>}
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
            placeholder="less sweet? (ur fat u need it) more milk? (damn fat ass) extra foam? (damn fat ass) surprise me..."
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
          disabled={pageStatus === 'submitting' || !shopSettings?.isOpen || menu.length === 0}
          className="w-full"
        >
          {pageStatus === 'submitting' ? 'Sending your order...' : 'Send order'}
        </Button>
      </form>
    </PageSection>
  )
}
