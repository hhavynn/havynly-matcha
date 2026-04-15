import { Outlet, NavLink } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-matcha-900">
      <header className="sticky top-0 z-10 bg-cream-50/90 backdrop-blur-sm border-b border-cream-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-semibold text-matcha-600 tracking-wide text-lg">
            havynly matcha
          </span>
          <nav className="flex gap-4 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive
                  ? 'text-matcha-600 font-medium'
                  : 'text-matcha-400 hover:text-matcha-600 transition-colors'
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/order"
              className={({ isActive }) =>
                isActive
                  ? 'text-matcha-600 font-medium'
                  : 'text-matcha-400 hover:text-matcha-600 transition-colors'
              }
            >
              Order
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-cream-200 py-6 text-center text-xs text-matcha-400">
        © {new Date().getFullYear()} Havynly Matcha. Made with care.
      </footer>
    </div>
  )
}
