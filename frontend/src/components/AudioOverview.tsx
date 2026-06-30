import { useRef, useState } from 'react'
import { API_URL } from '../api/client'

interface Props { notebookId: string }

interface ScriptLine { speaker: 'Host' | 'Expert'; text: string }

export default function AudioOverview({ notebookId }: Props) {
  const [script, setScript] = useState<ScriptLine[]>([])
  const [playing, setPlaying] = useState(false)
  const [currentLine, setCurrentLine] = useState(-1)
  const [loading, setLoading] = useState(false)
  const cancelRef = useRef(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/chat/${notebookId}/audio-overview`, { method: 'POST' })
      const data = await res.json()
      setScript(data.script ?? [])
    } catch {
      console.error('Failed to generate audio overview')
    } finally {
      setLoading(false)
    }
  }

  const play = async () => {
    if (!window.speechSynthesis || script.length === 0) return
    cancelRef.current = false
    setPlaying(true)
    const voices = window.speechSynthesis.getVoices()
    const hostVoice = voices[0]
    const expertVoice = voices[1] ?? voices[0]

    for (let i = 0; i < script.length; i++) {
      if (cancelRef.current) break
      setCurrentLine(i)
      await new Promise<void>(resolve => {
        const utter = new SpeechSynthesisUtterance(script[i].text)
        utter.voice = script[i].speaker === 'Host' ? hostVoice : expertVoice
        utter.onend = () => resolve()
        window.speechSynthesis.speak(utter)
      })
    }
    setPlaying(false)
    setCurrentLine(-1)
  }

  const stop = () => {
    cancelRef.current = true
    window.speechSynthesis.cancel()
    setPlaying(false)
    setCurrentLine(-1)
  }

  return (
    <div className="p-4 border border-gray-200 rounded-xl bg-white">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">🎙 Audio Overview</h3>

      {script.length === 0 ? (
        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-2 px-4 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating script…' : 'Generate Podcast'}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="max-h-40 overflow-y-auto space-y-1">
            {script.map((line, i) => (
              <p
                key={i}
                className={`text-xs p-2 rounded transition-colors ${
                  i === currentLine ? 'bg-purple-100 text-purple-800' : 'text-gray-600'
                }`}
              >
                <span className="font-semibold">{line.speaker}: </span>{line.text}
              </p>
            ))}
          </div>
          <div className="flex gap-2">
            {!playing ? (
              <button
                onClick={play}
                className="flex-1 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                ▶ Play
              </button>
            ) : (
              <button
                onClick={stop}
                className="flex-1 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ■ Stop
              </button>
            )}
            <button
              onClick={generate}
              disabled={loading}
              className="py-1.5 px-3 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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
