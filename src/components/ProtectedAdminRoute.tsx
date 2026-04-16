import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAdminAuth } from '../lib/auth'

export default function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { isReady, isAuthenticated, isAdmin } = useAdminAuth()

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(182,214,170,0.32),_transparent_38%),linear-gradient(180deg,_#f8f4ea_0%,_#f2ecdf_100%)] px-4 py-10 text-matcha-900">
        <div className="mx-auto max-w-md rounded-[2rem] border border-white/70 bg-cream-50/90 p-8 text-center shadow-[0_18px_48px_rgba(55,79,53,0.08)]">
          <p className="text-sm text-matcha-500 animate-pulse">Checking admin session...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
