import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import PageSection from '../components/PageSection'
import { getMenu, getShopSettings } from '../lib/api'
import type { MenuItemRow, ShopSettings } from '../lib/types'

export default function HomePage() {
  const [menu, setMenu] = useState<MenuItemRow[]>([])
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [items, settings] = await Promise.all([getMenu(), getShopSettings()])
        setMenu(items)
        setShopSettings(settings)
      } catch {
        setError('Could not load the menu right now. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <>
      <PageSection as="section" className="pb-10 pt-14 text-center">
        {shopSettings && (
          <div
            className={`mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${shopSettings.isOpen
              ? 'bg-matcha-100 text-matcha-700'
              : 'bg-cream-200 text-matcha-700'
              }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${shopSettings.isOpen ? 'bg-matcha-500 animate-pulse' : 'bg-cream-400'
                }`}
            />
            {shopSettings.isOpen ? 'Open' : 'Closed'} - {shopSettings.statusMessage}
          </div>
        )}

        <h1 className="mb-4 text-4xl font-bold leading-tight text-matcha-800 sm:text-5xl">
          Matchaaaaaaaa
          <br />
          by havyn
        </h1>
        <p className="mx-auto mb-8 max-w-sm text-base text-matcha-500 sm:text-lg">
          free bc ebt hit
        </p>

        {shopSettings?.isOpen ? (
          <Link to="/order">
            <Button size="lg">Order now</Button>
          </Link>
        ) : (
          <div className="mx-auto max-w-sm rounded-[1.75rem] bg-cream-50/80 px-5 py-4 text-sm text-matcha-600 shadow-sm">
            Orders are paused right now. {shopSettings?.statusMessage}
          </div>
        )}
      </PageSection>

      <PageSection>
        <h2 className="mb-4 text-xl font-semibold text-matcha-700">my menu rn</h2>

        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse rounded-3xl bg-cream-50 p-6">
                <div className="mb-3 h-5 w-1/2 rounded-full bg-cream-200" />
                <div className="mb-2 h-4 w-full rounded-full bg-cream-200" />
                <div className="h-4 w-3/4 rounded-full bg-cream-200" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <Card className="border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </Card>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-4">
            {menu.map((item) => (
              <Card key={item.id} className="p-5">
                <div className="min-w-0">
                  <h3 className="mb-1 font-semibold text-matcha-800">{item.name}</h3>
                  <p className="text-sm leading-relaxed text-matcha-500">{item.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-matcha-50 px-3 py-1 text-xs font-medium text-matcha-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          {shopSettings?.isOpen ? (
            <Link to="/order">
              <Button variant="secondary">View full menu and order</Button>
            </Link>
          ) : (
            <Button variant="secondary" disabled>
              Ordering currently closed
            </Button>
          )}
        </div>
      </PageSection>
    </>
  )
}
