import { create } from 'zustand'
import * as api from '../api/client'
import type { ChatMessage, Notebook, Source } from '../api/client'

interface AppStore {
  notebooks: Notebook[]
  currentNotebook: Notebook | null
  sources: Source[]
  messages: ChatMessage[]
  isStreaming: boolean

  fetchNotebooks: () => Promise<void>
  createNotebook: (title: string) => Promise<Notebook>
  setCurrentNotebook: (notebook: Notebook | null) => void
  fetchSources: (notebookId: string) => Promise<void>
  uploadSource: (notebookId: string, fileOrUrl: File | string) => Promise<void>
  deleteSource: (notebookId: string, sourceId: string) => Promise<void>
  fetchMessages: (notebookId: string) => Promise<void>
  sendMessage: (notebookId: string, text: string) => void
}

export const useStore = create<AppStore>((set, get) => ({
  notebooks: [],
  currentNotebook: null,
  sources: [],
  messages: [],
  isStreaming: false,

  fetchNotebooks: async () => {
    const notebooks = await api.fetchNotebooks()
    set({ notebooks })
  },

  createNotebook: async (title) => {
    const notebook = await api.createNotebook(title)
    set(s => ({ notebooks: [notebook, ...s.notebooks] }))
    return notebook
  },

  setCurrentNotebook: (notebook) => set({ currentNotebook: notebook }),

  fetchSources: async (notebookId) => {
    const sources = await api.fetchSources(notebookId)
    set({ sources })
  },

  uploadSource: async (notebookId, fileOrUrl) => {
    if (typeof fileOrUrl === 'string') {
      await api.uploadUrl(notebookId, fileOrUrl)
    } else {
      await api.uploadFile(notebookId, fileOrUrl)
    }
    await get().fetchSources(notebookId)
  },

  deleteSource: async (notebookId, sourceId) => {
    await api.deleteSource(notebookId, sourceId)
    set(s => ({ sources: s.sources.filter(src => src.id !== sourceId) }))
  },

  fetchMessages: async (notebookId) => {
    const messages = await api.fetchChatHistory(notebookId)
    set({ messages })
  },

  sendMessage: (notebookId, text) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      notebook_id: notebookId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      notebook_id: notebookId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    }
    set(s => ({ messages: [...s.messages, userMsg, assistantMsg], isStreaming: true }))

    api.streamChat(
      notebookId,
      text,
      (token) => {
        set(s => ({
          messages: s.messages.map((m, i) =>
            i === s.messages.length - 1 ? { ...m, content: m.content + token } : m,
          ),
        }))
      },
      () => set({ isStreaming: false }),
    )
  },
}))
