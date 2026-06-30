const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface Notebook {
  id: string
  title: string
  created_at: string
}

export interface Source {
  id: string
  notebook_id: string
  name: string
  type: string
  file_path?: string
  summary?: string
  status: string
  created_at: string
}

export interface ChatMessage {
  id: string
  notebook_id: string
  role: 'user' | 'assistant'
  content: string
  citations?: string
  created_at: string
}

// Notebooks
export const fetchNotebooks = (): Promise<Notebook[]> =>
  fetch(`${API_URL}/api/notebooks`).then(r => r.json())

export const createNotebook = (title: string): Promise<Notebook> =>
  fetch(`${API_URL}/api/notebooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  }).then(r => r.json())

export const deleteNotebook = (id: string): Promise<Response> =>
  fetch(`${API_URL}/api/notebooks/${id}`, { method: 'DELETE' })

// Sources
export const fetchSources = (notebookId: string): Promise<Source[]> =>
  fetch(`${API_URL}/api/notebooks/${notebookId}/sources`).then(r => r.json())

export const uploadFile = (notebookId: string, file: File): Promise<Source> => {
  const form = new FormData()
  form.append('file', file)
  return fetch(`${API_URL}/api/notebooks/${notebookId}/sources`, {
    method: 'POST',
    body: form,
  }).then(r => r.json())
}

export const uploadUrl = (notebookId: string, url: string): Promise<Source> => {
  const form = new FormData()
  form.append('url', url)
  return fetch(`${API_URL}/api/notebooks/${notebookId}/sources`, {
    method: 'POST',
    body: form,
  }).then(r => r.json())
}

export const deleteSource = (notebookId: string, sourceId: string): Promise<Response> =>
  fetch(`${API_URL}/api/notebooks/${notebookId}/sources/${sourceId}`, { method: 'DELETE' })

// Chat
export const fetchChatHistory = (notebookId: string): Promise<ChatMessage[]> =>
  fetch(`${API_URL}/api/chat/${notebookId}/history`).then(r => r.json())

export const streamChat = (
  notebookId: string,
  query: string,
  onToken: (token: string) => void,
  onDone: () => void,
): (() => void) => {
  const url = `${API_URL}/api/chat/${notebookId}/stream?q=${encodeURIComponent(query)}`
  const source = new EventSource(url)
  source.onmessage = (e) => {
    if (e.data === '[DONE]') {
      source.close()
      onDone()
      return
    }
    onToken(e.data)
  }
  source.onerror = () => {
    source.close()
    onDone()
  }
  return () => source.close()
}
