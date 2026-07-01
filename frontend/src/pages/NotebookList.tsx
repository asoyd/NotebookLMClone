import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useStore } from '../store/useStore'
import AboutModal from '../components/AboutModal'

export default function NotebookList() {
  const { notebooks, fetchNotebooks, createNotebook, deleteNotebook } = useStore()
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { fetchNotebooks() }, [fetchNotebooks])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)
    try {
      const nb = await createNotebook(title.trim())
      setTitle('')
      navigate(`/notebook/${nb.id}`)
    } catch {
      toast.error('Failed to create notebook')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">My Notebooks</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Upload documents and chat with your sources</p>

        <form onSubmit={handleCreate} className="flex gap-3 mb-8">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="New notebook title..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={creating || !title.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>

        {notebooks.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <p className="text-lg">No notebooks yet</p>
            <p className="text-sm mt-1">Create one above to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notebooks.map(nb => (
              <div
                key={nb.id}
                onClick={() => navigate(`/notebook/${nb.id}`)}
                className="relative group text-left p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all cursor-pointer"
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate pr-6">{nb.title}</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {new Date(nb.created_at).toLocaleDateString()}
                </p>
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    if (!window.confirm(`"${nb.title}" löschen?`)) return
                    try {
                      await deleteNotebook(nb.id)
                      toast.success('Notebook gelöscht')
                    } catch {
                      toast.error('Löschen fehlgeschlagen')
                    }
                  }}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-all"
                  title="Notebook löschen"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowAbout(true)}
        className="fixed bottom-6 right-6 z-40 w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 opacity-50 hover:opacity-100 shadow-sm hover:shadow-md transition-opacity text-sm"
        title="What can this app do?"
      >
        📄
      </button>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  )
}
