import { Link } from 'react-router-dom'
import Button from '../components/Button'
import PageSection from '../components/PageSection'

export default function NotFoundPage() {
  return (
    <PageSection className="flex flex-col items-center text-center py-24">
      <p className="text-6xl font-bold text-matcha-200 mb-4">404</p>
      <h1 className="text-2xl font-bold text-matcha-800 mb-2">Page not found</h1>
      <p className="text-matcha-400 text-sm mb-8">
        This page steeped too long and disappeared.
      </p>
      <Link to="/">
        <Button variant="secondary">Back to Home</Button>
      </Link>
    </PageSection>
  )
}
