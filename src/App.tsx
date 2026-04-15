import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import OrderPage from './pages/OrderPage'
import AdminPage from './pages/AdminPage'
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

      {/* Admin uses its own dark layout — no shared header/footer */}
      <Route path="admin" element={<AdminPage />} />
    </Routes>
  )
}
