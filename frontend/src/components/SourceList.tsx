import toast from 'react-hot-toast'
import { useStore } from '../store/useStore'

interface Props { notebookId: string }

const statusCls: Record<string, string> = {
  ready: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
  processing: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400',
  error: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
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
      <p className="p-4 text-sm text-gray-400 dark:text-gray-500 text-center">
        No sources yet. Upload a PDF or paste a URL.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {sources.map(source => (
        <li key={source.id} className="p-3 hover:bg-white dark:hover:bg-gray-800 group transition-colors">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {source.type === 'youtube' ? '▶ ' : ''}{source.name}
              </p>
              {source.summary && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{source.summary}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-xs px-1.5 py-0.5 rounded ${statusCls[source.status] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                {source.status}
              </span>
              <button
                onClick={() => handleDelete(source.id)}
                className="text-gray-300 dark:text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
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
