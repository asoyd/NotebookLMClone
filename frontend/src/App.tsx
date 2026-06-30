import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import NotebookList from './pages/NotebookList'
import NotebookDetail from './pages/NotebookDetail'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App() {
  // Keep Render free tier awake — ping every 14 minutes
  useEffect(() => {
    const ping = () => fetch(`${API_URL}/health`).catch(() => {})
    ping()
    const interval = setInterval(ping, 14 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Routes>
      <Route path="/" element={<NotebookList />} />
      <Route path="/notebook/:id" element={<NotebookDetail />} />
    </Routes>
  )
}
