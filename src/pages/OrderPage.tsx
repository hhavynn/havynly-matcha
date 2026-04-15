import PageSection from '../components/PageSection'
import Card from '../components/Card'

export default function OrderPage() {
  return (
    <PageSection narrow>
      <h1 className="text-2xl font-bold text-matcha-800 mb-2">Place an Order</h1>
      <p className="text-matcha-500 mb-6 text-sm">
        Full ordering experience coming soon.
      </p>
      <Card className="p-8 text-center">
        <span className="text-5xl mb-4 block">🍵</span>
        <p className="text-matcha-400 text-sm">Order form placeholder — check back soon!</p>
      </Card>
    </PageSection>
  )
}
