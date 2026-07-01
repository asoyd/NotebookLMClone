import { useEffect, useState } from 'react'

interface Props {
  fileUrl: string
  sourceName: string
  onClose: () => void
}

export default function TextViewer({ fileUrl, sourceName, onClose }: Props) {
  const [content, setContent] = useState('')
  const [error, setError] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  const src = fileUrl.startsWith('http')
    ? fileUrl
    : `${API_URL}/uploads/${fileUrl.split(/[/\\]/).pop()}`

  useEffect(() => {
    fetch(src)
      .then(r => {
        if (!r.ok) throw new Error()
        return r.text()
      })
      .then(setContent)
      .catch(() => setError(true))
  }, [src])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-h-[90vh] flex flex-col w-[620px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 shrink-0">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{sourceName}</span>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {error ? (
            <p className="text-sm text-red-500 dark:text-red-400">Datei konnte nicht geladen werden.</p>
          ) : content ? (
            <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
              {content}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">Laden…</p>
          )}
        </div>
      </div>
    </div>
  )
}
