import { useEffect, useRef, useState } from 'react'
import { marked } from 'marked'
import { useStore } from '../store/useStore'
import CitationChip from './CitationChip'

interface Props { notebookId: string }

const CITATION_RE = /\[Quelle: ([^\]]+?)(?:,\s*(?:Seite\s*(\d+)|(\d{1,2}:\d{2}(?::\d{2})?))\s*)?\]/g

function tsToSeconds(ts: string): number {
  const parts = ts.split(':').map(Number)
  return parts.length === 3
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : parts[0] * 60 + parts[1]
}

function MessageContent({ content }: { content: string }) {
  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null

  CITATION_RE.lastIndex = 0
  while ((match = CITATION_RE.exec(content)) !== null) {
    if (match.index > last) {
      parts.push(
        <span
          key={`text-${last}`}
          dangerouslySetInnerHTML={{ __html: marked.parse(content.slice(last, match.index)) as string }}
        />,
      )
    }
    parts.push(
      <CitationChip
        key={`cite-${match.index}`}
        sourceName={match[1].trim()}
        page={match[2] ? parseInt(match[2]) : match[3] ? tsToSeconds(match[3]) : undefined}
      />,
    )
    last = match.index + match[0].length
  }
  if (last < content.length) {
    parts.push(
      <span
        key={`text-end`}
        dangerouslySetInnerHTML={{ __html: marked.parse(content.slice(last)) as string }}
      />,
    )
  }
  return <div className="text-sm prose prose-sm max-w-none">{parts}</div>
}

export default function ChatPanel({ notebookId }: Props) {
  const { messages, isStreaming, sendMessage } = useStore()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    const text = input.trim()
    setInput('')
    sendMessage(notebookId, text)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-lg font-medium">Ask a question</p>
            <p className="text-sm mt-1">Upload sources first, then chat with them</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-2xl rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white text-sm'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {msg.role === 'assistant'
                ? <MessageContent content={msg.content || '…'} />
                : msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white shrink-0">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your sources…"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isStreaming ? '…' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}
