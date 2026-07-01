import { useEffect } from 'react'

interface AboutModalProps {
  onClose: () => void
}

const CAN_DO = [
  'Upload PDFs, text files, and web pages as sources',
  'Import YouTube videos automatically via their transcript',
  'Ask questions about your sources in a streaming chat',
  'Click citations to jump straight to the cited page in the PDF',
  'Get an auto-generated summary for every source',
  'Generate a 2-speaker audio podcast overview of a notebook',
  'Generate flashcards from your sources',
  'Keep multiple notebooks, each with its own sources and chat history',
]

const CANNOT_DO = [
  'Import Google Docs (no Google API access)',
  'Use audio files as a source',
  'Generate outlines or slide presentations',
  'Build a visual mind map / concept graph',
  "Answer from general knowledge — it only uses what you upload",
]

export default function AboutModal({ onClose }: AboutModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">What this app can do</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        <section className="mb-5">
          <h3 className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">
            Can do
          </h3>
          <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
            {CAN_DO.map(item => (
              <li key={item} className="flex gap-2">
                <span className="text-green-500 dark:text-green-400">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-5">
          <h3 className="text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider mb-2">
            Can't do
          </h3>
          <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
            {CANNOT_DO.map(item => (
              <li key={item} className="flex gap-2">
                <span className="text-red-400 dark:text-red-400">✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
          Note: YouTube import doesn't work on this hosted demo — YouTube blocks
          transcript requests from cloud server IPs (Render, AWS, GCP, ...) regardless
          of the video. It works when running the project locally.
        </p>
      </div>
    </div>
  )
}
