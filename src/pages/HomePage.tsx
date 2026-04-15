import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import PageSection from '../components/PageSection'
import { mockMenu } from '../data/mockMenu'

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <PageSection as="section" className="pt-14 pb-10 text-center">
        {/* Shop open/closed badge — swap text and dot color when you wire up real status */}
        <div className="inline-flex items-center gap-2 bg-matcha-100 text-matcha-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          <span className="w-2 h-2 rounded-full bg-matcha-500 animate-pulse" />
          Open today · 8 am – 5 pm
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-matcha-800 leading-tight mb-4">
          Matcha, made<br />with intention.
        </h1>
        <p className="text-matcha-500 text-base sm:text-lg max-w-sm mx-auto mb-8">
          Small-batch ceremonial-grade matcha drinks, crafted fresh for every order.
        </p>

        <Link to="/order">
          <Button size="lg">Order Now</Button>
        </Link>
      </PageSection>

      {/* Menu preview */}
      <PageSection>
        <h2 className="text-xl font-semibold text-matcha-700 mb-4">Our Drinks</h2>

        <div className="flex flex-col gap-4">
          {mockMenu.map((item) => (
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
                  ${(item.price / 100).toFixed(2)}
                </span>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link to="/order">
            <Button variant="secondary">View Full Menu & Order</Button>
          </Link>
        </div>
      </PageSection>
    </>
  )
}
