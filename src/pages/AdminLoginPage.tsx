import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { AuthError } from '@supabase/supabase-js'
import Button from '../components/Button'
import { AdminAccessError, useAdminAuth } from '../lib/auth'

export default function AdminLoginPage() {
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/admin'
  const { adminEmail, isReady, isAdmin, signIn } = useAdminAuth()
  const [email, setEmail] = useState(adminEmail)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isReady && isAdmin) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await signIn(email, password)
    } catch (nextError) {
      if (nextError instanceof AdminAccessError) {
        setError(nextError.message)
      } else {
        const authError = nextError as AuthError
        setError(authError.message || 'Could not sign in.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(182,214,170,0.32),_transparent_34%),linear-gradient(180deg,_#f8f4ea_0%,_#eef1e2_100%)] px-4 py-10 text-matcha-900">
      <div className="mx-auto flex min-h-screen max-w-md items-center">
        <div className="w-full rounded-[2rem] border border-white/70 bg-cream-50/90 p-6 shadow-[0_22px_54px_rgba(55,79,53,0.12)] backdrop-blur sm:p-8">
          <div className="mb-8">
            <div className="inline-flex rounded-full bg-matcha-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-matcha-700">
              Admin Access
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-matcha-900">
              Sign in to manage the cafe
            </h1>
            <p className="mt-2 text-sm leading-6 text-matcha-600">
              Use your Supabase admin email and password to access shop controls and the live backlog.
            </p>
          </div>

          {!adminEmail && (
            <div className="mb-4 rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Missing `VITE_ADMIN_EMAIL`. Add it to your frontend env before using admin auth.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block" htmlFor="admin-email">
              <span className="mb-1.5 block text-sm font-medium text-matcha-700">Admin email</span>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setError(null)
                }}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-2xl border border-matcha-200 bg-white px-4 py-3 text-sm text-matcha-900 outline-none transition focus:border-matcha-400 focus:ring-2 focus:ring-matcha-200"
              />
            </label>

            <label className="block" htmlFor="admin-password">
              <span className="mb-1.5 block text-sm font-medium text-matcha-700">Password</span>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError(null)
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-matcha-200 bg-white px-4 py-3 text-sm text-matcha-900 outline-none transition focus:border-matcha-400 focus:ring-2 focus:ring-matcha-200"
              />
            </label>

            <Button type="submit" size="lg" className="w-full" disabled={loading || !adminEmail}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
