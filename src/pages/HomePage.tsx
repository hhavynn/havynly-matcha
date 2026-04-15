import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import PageSection from '../components/PageSection'
import { getMenu, getShopIsOpen } from '../lib/api'
import type { MenuItemRow } from '../lib/types'

export default function HomePage() {
  const [menu, setMenu] = useState<MenuItemRow[]>([])
  const [shopIsOpen, setShopIsOpen] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [items, isOpen] = await Promise.all([getMenu(), getShopIsOpen()])
        setMenu(items)
        setShopIsOpen(isOpen)
      } catch {
        setError('Could not load menu. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <>
      {/* Hero */}
      <PageSection as="section" className="pt-14 pb-10 text-center">
        {/* Shop status badge */}
        {shopIsOpen !== null && (
          <div
            className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full mb-6 ${
              shopIsOpen
                ? 'bg-matcha-100 text-matcha-700'
                : 'bg-cream-100 text-cream-500'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                shopIsOpen ? 'bg-matcha-500 animate-pulse' : 'bg-cream-400'
              }`}
            />
            {shopIsOpen ? 'Open · Taking orders now' : 'Closed — check back soon'}
          </div>
        )}

        <h1 className="text-4xl sm:text-5xl font-bold text-matcha-800 leading-tight mb-4">
          Matcha, made<br />with intention.
        </h1>
        <p className="text-matcha-500 text-base sm:text-lg max-w-sm mx-auto mb-8">
          Small-batch ceremonial-grade matcha drinks, crafted fresh for every order.
        </p>

        <Link to="/order">
          <Button size="lg" disabled={shopIsOpen === false}>
            Order Now
          </Button>
        </Link>
      </PageSection>

      {/* Menu */}
      <PageSection>
        <h2 className="text-xl font-semibold text-matcha-700 mb-4">Our Drinks</h2>

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-cream-200 shadow-sm p-5 animate-pulse"
              >
                <div className="h-4 bg-cream-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-cream-100 rounded w-full mb-1" />
                <div className="h-3 bg-cream-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="flex flex-col gap-4">
            {menu.map((item) => (
              <Card key={item.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-matcha-800 mb-1">{item.name}</h3>
                    <p className="text-sm text-matcha-500 leading-relaxed">{item.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-matcha-50 text-matcha-600 border border-matcha-200 rounded-full px-2 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-matcha-600 font-semibold whitespace-nowrap text-sm pt-0.5">
                    ${(item.price_cents / 100).toFixed(2)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/order">
            <Button variant="secondary">View Full Menu & Order</Button>
          </Link>
        </div>
      </PageSection>
    </>
  )
}
