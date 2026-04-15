import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import HomePage from './pages/HomePage'
import OrderPage from './pages/OrderPage'
import AdminPage from './pages/AdminPage'
import AdminLoginPage from './pages/AdminLoginPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      {/* Customer-facing routes share the header/footer layout */}
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="order" element={<OrderPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Admin login — public, redirects to /admin if already signed in */}
      <Route path="admin/login" element={<AdminLoginPage />} />

      {/* Admin dashboard — requires an active Supabase session */}
      <Route element={<RequireAuth />}>
        <Route path="admin" element={<AdminPage />} />
      </Route>
    </Routes>
  )
}
