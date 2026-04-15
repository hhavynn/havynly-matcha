import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Wraps protected routes. Waits for session restore before deciding,
// then redirects unauthenticated visitors to the admin login page.
export default function RequireAuth() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <span className="text-slate-500 text-sm animate-pulse">Loading…</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
