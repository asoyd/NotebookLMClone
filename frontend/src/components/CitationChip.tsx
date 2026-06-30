import { useState } from 'react'
import { useStore } from '../store/useStore'
import PdfViewer from './PdfViewer'
import TextViewer from './TextViewer'

interface Props {
  sourceName: string
  page?: number
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function CitationChip({ sourceName, page }: Props) {
  const [open, setOpen] = useState(false)
  const { sources } = useStore()
  const source = sources.find(s => s.name === sourceName)
  const isYouTube = source?.type === 'youtube'
  const canOpen = !isYouTube && !!source?.file_path

  const label = isYouTube
    ? `▶ ${sourceName}${page != null ? `, ${formatTimestamp(page)}` : ''}`
    : `📄 ${sourceName}${page != null ? `, p.${page}` : ''}`

  const title = isYouTube
    ? `${sourceName}${page != null ? ` at ${formatTimestamp(page)}` : ''}`
    : `${sourceName}${page != null ? `, page ${page}` : ''}`

  return (
    <>
      <button
        onClick={() => canOpen && setOpen(true)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 text-xs rounded-full border transition-colors ${
          isYouTube
            ? 'bg-red-50 text-red-700 border-red-200 cursor-default'
            : canOpen
              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer'
              : 'bg-gray-50 text-gray-500 border-gray-200 cursor-default'
        }`}
        title={title}
      >
        {label}
      </button>

      {open && source?.file_path && source.type === 'pdf' && (
        <PdfViewer
          fileUrl={source.file_path}
          initialPage={page ?? 1}
          onClose={() => setOpen(false)}
        />
      )}

      {open && source?.file_path && source.type !== 'pdf' && (
        <TextViewer
          fileUrl={source.file_path}
          sourceName={source.name}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
