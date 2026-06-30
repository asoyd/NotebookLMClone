import toast from 'react-hot-toast'
import { useStore } from '../store/useStore'

interface Props { notebookId: string }

const statusCls: Record<string, string> = {
  ready: 'bg-green-100 text-green-700',
  processing: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
}

export default function SourceList({ notebookId }: Props) {
  const { sources, deleteSource } = useStore()

  const handleDelete = async (sourceId: string) => {
    try {
      await deleteSource(notebookId, sourceId)
      toast.success('Source removed')
    } catch {
      toast.error('Failed to remove source')
    }
  }

  if (sources.length === 0) {
    return (
      <p className="p-4 text-sm text-gray-400 text-center">
        No sources yet. Upload a PDF or paste a URL.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-gray-100">
      {sources.map(source => (
        <li key={source.id} className="p-3 hover:bg-white group transition-colors">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{source.name}</p>
              {source.summary && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{source.summary}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-xs px-1.5 py-0.5 rounded ${statusCls[source.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {source.status}
              </span>
              <button
                onClick={() => handleDelete(source.id)}
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
