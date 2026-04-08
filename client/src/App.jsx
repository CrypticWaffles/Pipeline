import { useState, useEffect } from 'react'
import Board from './components/Board'
import Dashboard from './components/Dashboard'
import { api } from './api'

const API = import.meta.env.VITE_API_URL ?? ''

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  // Sync if system preference changes and user hasn't manually set a preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange(e) {
      if (!localStorage.getItem('theme')) setDark(e.matches)
    }
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  return [dark, setDark]
}

export default function App() {
  const [user, setUser] = useState(undefined)
  const [view, setView] = useState('board')
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dark, setDark] = useDarkMode()

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: 'include' })
      .then(r => r.json())
      .then(({ user }) => setUser(user ?? null))
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    if (!user) return
    setJobsLoading(true)
    api.getJobs()
      .then(setJobs)
      .catch(() => setError('Failed to load jobs.'))
      .finally(() => setJobsLoading(false))
  }, [user])

  async function logout() {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' })
    setUser(null)
    setJobs([])
  }

  async function addJob(job) {
    const created = await api.createJob(job)
    setJobs(prev => [...prev, created])
  }

  async function updateJob(updated) {
    const saved = await api.updateJob(updated.id, updated)
    setJobs(prev => prev.map(j => j.id === saved.id ? saved : j))
  }

  async function deleteJob(id) {
    await api.deleteJob(id)
    setJobs(prev => prev.filter(j => j.id !== id))
  }

  async function moveJob(id, newStage) {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, stage: newStage } : j))
    try {
      await api.updateJob(id, { stage: newStage })
    } catch {
      setJobs(prev => prev.map(j => j.id === id ? { ...j, stage: j.stage } : j))
    }
  }

  if (user === undefined) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-sm text-gray-400">Loading...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-2">Pipeline</h1>
          <p className="text-gray-500 text-sm">Track your job applications in one place.</p>
        </div>
        <a
          href={`${API}/auth/google`}
          className="inline-flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:border-gray-400 text-gray-700 dark:text-gray-200 text-sm font-medium px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all"
        >
          <GoogleIcon />
          Sign in with Google
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Pipeline</h1>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 text-sm">
            <button
              onClick={() => setView('board')}
              className={`px-3 py-1 rounded-md transition-colors ${view === 'board' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >Board</button>
            <button
              onClick={() => setView('dashboard')}
              className={`px-3 py-1 rounded-md transition-colors ${view === 'dashboard' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >Dashboard</button>
          </div>
          <button
            onClick={() => setDark(d => !d)}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-md transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
          <div className="flex items-center gap-2">
            {user.avatar && <img src={user.avatar} className="w-7 h-7 rounded-full" alt="" />}
            <span className="text-sm text-gray-600 dark:text-gray-400">{user.name}</span>
            <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-1">Sign out</button>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        {jobsLoading ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading...</div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-sm text-red-500">{error}</div>
        ) : view === 'dashboard' ? (
          <Dashboard />
        ) : (
          <Board jobs={jobs} onAdd={addJob} onUpdate={updateJob} onDelete={deleteJob} onMove={moveJob} />
        )}
      </main>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  )
}
