import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import AdminMenuSection from './AdminMenuSection'
import {
  getOrders,
  getShopIsOpen,
  setShopIsOpen,
  updateOrderStatus,
} from '../lib/api'
import type { OrderWithItem, OrderStatus } from '../lib/types'

type AdminTab = 'orders' | 'menu'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:   'Pending',
  ready:     'Ready',
  done:      'Done',
  cancelled: 'Cancelled',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:   'bg-yellow-500/20 text-yellow-300',
  ready:     'bg-emerald-500/20 text-emerald-300',
  done:      'bg-slate-500/20 text-slate-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function AdminPage() {
  const { signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>('orders')
  const [orders, setOrders] = useState<OrderWithItem[]>([])
  const [shopIsOpen, setShopIsOpenState] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [fetchedOrders, isOpen] = await Promise.all([
        getOrders(),
        getShopIsOpen(),
      ])
      setOrders(fetchedOrders)
      setShopIsOpenState(isOpen)
    } catch {
      setError('Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleToggleShop() {
    if (shopIsOpen === null) return
    setToggling(true)
    try {
      await setShopIsOpen(!shopIsOpen)
      setShopIsOpenState(!shopIsOpen)
    } catch {
      setError('Failed to update shop status.')
    } finally {
      setToggling(false)
    }
  }

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    try {
      await updateOrderStatus(orderId, newStatus)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
    } catch {
      setError('Failed to update order.')
    }
  }

  const pendingCount = orders.filter((o) => o.status === 'pending').length

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`w-2 h-2 rounded-full ${
                shopIsOpen ? 'bg-emerald-400' : 'bg-slate-500'
              }`}
            />
            <span className="text-sm font-mono text-slate-400">admin</span>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-semibold">havynly-matcha</span>
          </div>
          <div className="flex items-center gap-4">
            {activeTab === 'orders' && (
              <button
                onClick={load}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Refresh
              </button>
            )}
            <button
              onClick={signOut}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
            <button
              className="ml-3 underline"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats row — always visible */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Pending</div>
            <div className="text-3xl font-bold">{loading ? '—' : pendingCount}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total today</div>
            <div className="text-3xl font-bold">{loading ? '—' : orders.length}</div>
          </div>
          {/* Shop toggle */}
          <div className="col-span-2 sm:col-span-1 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Shop</div>
              <div
                className={`text-lg font-bold ${
                  shopIsOpen ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {shopIsOpen === null ? '—' : shopIsOpen ? 'Open' : 'Closed'}
              </div>
            </div>
            <button
              onClick={handleToggleShop}
              disabled={toggling || shopIsOpen === null}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                shopIsOpen
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {toggling ? '…' : shopIsOpen ? 'Close' : 'Open'}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-slate-700 mb-6">
          {(['orders', 'menu'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
              {tab === 'orders' && !loading && pendingCount > 0 && (
                <span className="ml-1.5 text-xs bg-yellow-500/20 text-yellow-300 rounded-full px-1.5 py-0.5">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders tab */}
        {activeTab === 'orders' && (
          <>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Orders
            </h2>

            {loading ? (
              <p className="text-slate-500 text-sm animate-pulse">Loading orders…</p>
            ) : orders.length === 0 ? (
              <p className="text-slate-600 text-sm">No orders yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-slate-100 text-sm">
                          {order.customer_name}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            STATUS_COLORS[order.status]
                          }`}
                        >
                          {STATUS_LABELS[order.status]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">
                        {order.menu_items?.name ?? 'Unknown drink'}
                      </p>
                      {order.notes && (
                        <p className="text-xs text-slate-500 mt-0.5 italic">
                          "{order.notes}"
                        </p>
                      )}
                      <p className="text-xs text-slate-600 mt-1">
                        {formatDate(order.created_at)} · {formatTime(order.created_at)}
                      </p>
                    </div>

                    {/* Quick status buttons */}
                    <div className="flex flex-col gap-1 shrink-0">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'ready')}
                          className="text-xs px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                        >
                          Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'done')}
                          className="text-xs px-3 py-1 rounded-lg bg-slate-600 hover:bg-slate-500 text-slate-200 transition-colors"
                        >
                          Done
                        </button>
                      )}
                      {(order.status === 'pending' || order.status === 'ready') && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          className="text-xs px-3 py-1 rounded-lg bg-red-900/40 hover:bg-red-900/70 text-red-400 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Menu tab */}
        {activeTab === 'menu' && <AdminMenuSection />}
      </main>
    </div>
  )
}
