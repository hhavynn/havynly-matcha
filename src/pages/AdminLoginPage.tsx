import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminLoginPage() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already signed in — skip straight to the dashboard
  useEffect(() => {
    if (!loading && user) navigate('/admin', { replace: true })
  }, [user, loading, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: authError } = await signIn(email.trim(), password)
    if (authError) {
      // Return a generic message — don't leak whether email exists
      setError('Invalid email or password.')
      setSubmitting(false)
    }
    // On success: onAuthStateChange fires → user state updates → useEffect above redirects
  }

  // Don't flash the form while we check for an existing session
  if (loading) return null

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">admin</p>
          <h1 className="text-xl font-semibold text-slate-100">havynly matcha</h1>
        </div>

        {/* Login card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8">
          <h2 className="text-base font-semibold text-slate-100 mb-5">Sign in</h2>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-400 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-slate-100 text-sm placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-400 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-slate-100 text-sm placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
