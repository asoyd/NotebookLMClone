import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface Props {
  fileUrl: string
  initialPage?: number
  onClose: () => void
}

export default function PdfViewer({ fileUrl, initialPage = 1, onClose }: Props) {
  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(initialPage)
  const [loadError, setLoadError] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  const src = fileUrl.startsWith('http')
    ? fileUrl
    : `${API_URL}/uploads/${fileUrl.split(/[/\\]/).pop()}`

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2 py-1 text-sm border dark:border-gray-700 rounded disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-100"
            >
              ←
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {numPages || '?'}
            </span>
            <button
              onClick={() => setPage(p => Math.min(numPages, p + 1))}
              disabled={page >= numPages}
              className="px-2 py-1 text-sm border dark:border-gray-700 rounded disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-100"
            >
              →
            </button>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {loadError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <span className="text-2xl">⚠️</span>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">PDF konnte nicht geladen werden.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Die Datei ist möglicherweise beschädigt oder hat ein nicht unterstütztes Format.</p>
            </div>
          ) : (
            <Document
              file={src}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={() => setLoadError(true)}
              onSourceError={() => setLoadError(true)}
            >
              <Page pageNumber={page} width={560} />
            </Document>
          )}
        </div>
      </div>
    </div>
  )
}
