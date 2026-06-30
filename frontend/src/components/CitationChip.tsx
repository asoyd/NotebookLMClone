import { useState } from 'react'
import { useStore } from '../store/useStore'
import PdfViewer from './PdfViewer'
import TextViewer from './TextViewer'

interface Props {
  sourceName: string
  page?: number
}

export default function CitationChip({ sourceName, page }: Props) {
  const [open, setOpen] = useState(false)
  const { sources } = useStore()
  const source = sources.find(s => s.name === sourceName)
  const canOpen = !!source?.file_path

  return (
    <>
      <button
        onClick={() => canOpen && setOpen(true)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 text-xs rounded-full border transition-colors ${
          canOpen
            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer'
            : 'bg-gray-50 text-gray-500 border-gray-200 cursor-default'
        }`}
        title={`${sourceName}${page ? `, page ${page}` : ''}`}
      >
        📄 {sourceName}{page ? `, p.${page}` : ''}
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
