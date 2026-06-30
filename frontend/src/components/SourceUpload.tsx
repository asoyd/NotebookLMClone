import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { useStore } from '../store/useStore'

interface Props { notebookId: string }

export default function SourceUpload({ notebookId }: Props) {
  const { uploadSource } = useStore()
  const [url, setUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (files: File[]) => {
    for (const file of files) {
      setUploading(true)
      try {
        await uploadSource(notebookId, file)
        toast.success(`${file.name} uploaded`)
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      } finally {
        setUploading(false)
      }
    }
  }, [notebookId, uploadSource])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    disabled: uploading,
  })

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    setUploading(true)
    try {
      await uploadSource(notebookId, url.trim())
      setUrl('')
      toast.success('URL added')
    } catch {
      toast.error('Failed to add URL')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <p className="text-xs text-gray-500">
          {uploading ? 'Uploading…' : isDragActive ? 'Drop here' : 'Drop PDF/TXT or click to browse'}
        </p>
      </div>

      <form onSubmit={handleUrlSubmit} className="flex gap-1.5">
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste a URL or YouTube link…"
          className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
          disabled={uploading}
        />
        <button
          type="submit"
          disabled={!url.trim() || uploading}
          className="text-xs px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  )
}
