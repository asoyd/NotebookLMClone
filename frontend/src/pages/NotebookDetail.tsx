import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import AudioOverview from '../components/AudioOverview'
import ChatPanel from '../components/ChatPanel'
import SourceList from '../components/SourceList'
import SourceUpload from '../components/SourceUpload'

export default function NotebookDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentNotebook, setCurrentNotebook, fetchNotebooks, fetchSources, fetchMessages } = useStore()

  useEffect(() => {
    if (!id) return
    fetchNotebooks().then(() => {
      const nb = useStore.getState().notebooks.find(n => n.id === id)
      if (nb) setCurrentNotebook(nb)
      else navigate('/')
    })
    fetchSources(id)
    fetchMessages(id)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!id) return null

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center gap-4 px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-gray-700 transition-colors"
        >
          ← Notebooks
        </button>
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {currentNotebook?.title ?? '…'}
        </h1>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Sources
            </h2>
            <SourceUpload notebookId={id} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <SourceList notebookId={id} />
            <div className="p-4 border-t border-gray-200">
              <AudioOverview notebookId={id} />
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden">
          <ChatPanel notebookId={id} />
        </main>
      </div>
    </div>
  )
}
