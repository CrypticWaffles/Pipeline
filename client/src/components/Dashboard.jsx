import { useState, useEffect } from 'react'

const STAGE_COLORS = {
  'Applied':      'bg-blue-500',
  'Phone Screen': 'bg-yellow-500',
  'Interview':    'bg-purple-500',
  'Offer':        'bg-green-500',
  'Rejected':     'bg-red-400',
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/stats`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setStats)
      .catch(() => setError('Failed to load stats.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading...</div>
  if (error)   return <div className="flex items-center justify-center h-full text-sm text-red-500">{error}</div>
  if (!stats)  return null

  const maxWeekly = Math.max(...(stats.weekly.map(w => w.count)), 1)
  const maxStage  = Math.max(...(stats.byStage.map(s => s.count)), 1)

  return (
    <div className="p-6 overflow-y-auto h-full max-w-4xl mx-auto">

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Applications" value={stats.total} />
        <StatCard label="Active"             value={stats.active} />
        <StatCard label="Response Rate"      value={`${stats.responseRate}%`} />
        <StatCard label="Offer Rate"         value={`${stats.offerRate}%`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Applications by Stage</h2>
          <div className="flex flex-col gap-3">
            {['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected'].map(stage => {
              const row   = stats.byStage.find(r => r.stage === stage)
              const count = row?.count ?? 0
              const pct   = Math.round((count / maxStage) * 100)
              return (
                <div key={stage}>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>{stage}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${STAGE_COLORS[stage]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Applications per Week</h2>
          {stats.weekly.length === 0 ? (
            <p className="text-sm text-gray-400 text-center mt-8">No data yet</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {stats.weekly.map(w => {
                const heightPct = Math.round((w.count / maxWeekly) * 100)
                return (
                  <div key={w.week} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{w.count}</span>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-t overflow-hidden flex items-end" style={{ height: '80px' }}>
                      <div
                        className="w-full bg-indigo-500 rounded-t transition-all"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate w-full text-center">{w.week}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 sm:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Avg. Days in Stage</h2>
          <div className="grid grid-cols-5 gap-3">
            {['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected'].map(stage => {
              const row  = stats.byStage.find(r => r.stage === stage)
              const days = row?.avg_days ?? 0
              return (
                <div key={stage} className="flex flex-col items-center gap-1 text-center">
                  <span className={`w-2 h-2 rounded-full ${STAGE_COLORS[stage]}`} />
                  <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{days}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 leading-tight">{stage}</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  )
}
