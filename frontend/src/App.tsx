import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import NotebookList from './pages/NotebookList'
import NotebookDetail from './pages/NotebookDetail'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getInitialTheme(): boolean {
  const stored = localStorage.getItem('theme')
  if (stored) return stored === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function App() {
  const [isDark, setIsDark] = useState(getInitialTheme)

  // Keep Render free tier awake — ping every 14 minutes
  useEffect(() => {
    const ping = () => fetch(`${API_URL}/health`).catch(() => {})
    ping()
    const interval = setInterval(ping, 14 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <>
      <button
        onClick={() => setIsDark(d => !d)}
        className="fixed top-4 right-4 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow text-sm"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? '☀️' : '🌙'}
      </button>
      <Routes>
        <Route path="/" element={<NotebookList />} />
        <Route path="/notebook/:id" element={<NotebookDetail />} />
      </Routes>
    </>
  )
}
