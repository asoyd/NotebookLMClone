import { useRef, useState } from 'react'
import { API_URL } from '../api/client'

interface Props { notebookId: string }
interface Flashcard { front: string; back: string }

export default function Flashcards({ notebookId }: Props) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const inFlightRef = useRef(false)

  const generate = async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setLoading(true)
    setFlipped(false)
    setCurrentIndex(0)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/chat/${notebookId}/flashcards`, { method: 'POST' })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setFlashcards(data.flashcards ?? [])
    } catch (err) {
      setError('Failed to generate flashcards. Please try again.')
      console.error('Failed to generate flashcards', err)
    } finally {
      setLoading(false)
      inFlightRef.current = false
    }
  }

  const goTo = (index: number) => {
    setCurrentIndex(index)
    setFlipped(false)
  }

  const card = flashcards[currentIndex]

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">🃏 Flashcards</h3>

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 mb-2">{error}</p>
      )}

      {flashcards.length === 0 ? (
        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-2 px-4 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating…' : 'Generate Flashcards'}
        </button>
      ) : (
        <div className="space-y-3">
          {/* Flip card */}
          <div style={{ perspective: '1000px' }}>
            <div
              style={{
                position: 'relative',
                minHeight: '110px',
                transition: 'transform 0.5s',
                transformStyle: 'preserve-3d',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                cursor: 'pointer',
              }}
              onClick={() => setFlipped(f => !f)}
            >
              {/* Front */}
              <div
                className="flex items-center justify-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-sm text-center text-gray-800 dark:text-gray-100 font-medium"
                style={{ backfaceVisibility: 'hidden' }}
              >
                {card.front}
              </div>
              {/* Back */}
              <div
                className="absolute inset-0 flex items-center justify-center p-3 bg-purple-600 rounded-lg text-sm text-center text-white"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                {card.back}
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            {flipped ? 'Answer' : 'Question'} · click to flip
          </p>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => goTo(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="py-1.5 px-3 text-sm border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30"
            >
              ←
            </button>
            <span className="flex-1 text-xs text-center text-gray-500 dark:text-gray-400">
              {currentIndex + 1} / {flashcards.length}
            </span>
            <button
              onClick={() => goTo(Math.min(flashcards.length - 1, currentIndex + 1))}
              disabled={currentIndex === flashcards.length - 1}
              className="py-1.5 px-3 text-sm border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30"
            >
              →
            </button>
            <button
              onClick={generate}
              disabled={loading}
              className="py-1.5 px-3 text-sm border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              title="Regenerate"
            >
              ↺
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
