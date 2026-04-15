// Admin uses its own full-page layout (dark slate) — no shared header/footer
export default function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="border-b border-slate-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-sm font-mono text-slate-400">admin</span>
          <span className="text-slate-600">/</span>
          <span className="text-sm font-semibold">havynly-matcha</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mb-8">Manage your shop from here.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Orders today', value: '—',    sub: 'No live data yet' },
            { label: 'Menu items',   value: '3',    sub: 'From mockMenu.ts' },
            { label: 'Shop status',  value: 'Open', sub: 'Manually set' },
            { label: 'Revenue',      value: '—',    sub: 'No backend yet' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-5"
            >
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                {stat.label}
              </div>
              <div className="text-3xl font-bold text-slate-100 mb-1">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.sub}</div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs text-slate-600">
          ⚠ This page is not protected — add auth before going live.
        </p>
      </main>
    </div>
  )
}
