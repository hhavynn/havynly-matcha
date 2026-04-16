import { NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-cream-100 font-sans text-matcha-900 selection:bg-matcha-200">
      <header className="sticky top-0 z-20 bg-cream-100/85 backdrop-blur-[20px]">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-6">
          <span className="font-admin text-xl font-semibold tracking-wider text-matcha-600">
            Havynly Matcha
          </span>
          <nav className="flex gap-6 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive
                  ? 'font-medium text-matcha-600'
                  : 'text-matcha-400 transition-colors hover:text-matcha-600'
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/order"
              className={({ isActive }) =>
                isActive
                  ? 'font-medium text-matcha-600'
                  : 'text-matcha-400 transition-colors hover:text-matcha-600'
              }
            >
              Order
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex-1 w-full max-w-2xl">
        <Outlet />
      </main>

      <footer className="py-8 text-center text-sm text-matcha-400">
        &copy; {new Date().getFullYear()} Havynly Matcha. Made with care.
      </footer>
    </div>
  )
}
