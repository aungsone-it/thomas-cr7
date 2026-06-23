import { useRef, useState } from 'react'
import { mediaUrl } from '../api/client'
import type { UploadKind } from '../types/api'

interface ImageUploadFieldProps {
  label: string
  hint: string
  kind: UploadKind
  currentUrl: string
  uploading: boolean
  onUpload: (kind: UploadKind, file: File) => Promise<void>
  onRemove: (kind: UploadKind) => Promise<void>
}

export default function ImageUploadField({
  label,
  hint,
  kind,
  currentUrl,
  uploading,
  onUpload,
  onRemove,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const preview = mediaUrl(currentUrl)

  async function handleFile(file: File | undefined) {
    if (!file) return
    await onUpload(kind, file)
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-medium text-slate-300">{label}</p>
        <p className="text-[10px] text-slate-500">{hint}</p>
      </div>

      {preview && (
        <div className="overflow-hidden rounded-lg ring-1 ring-slate-600">
          <img src={preview} alt={label} className="max-h-36 w-full object-contain bg-surface-elevated" />
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFile(e.dataTransfer.files[0])
        }}
        className={`rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors ${
          dragOver ? 'border-brand-gold bg-brand-gold/5' : 'border-slate-600'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="text-sm text-brand-gold hover:underline disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : preview ? 'Replace image' : 'Choose image'}
        </button>
        <p className="mt-1 text-[10px] text-slate-500">JPEG, PNG, GIF, WebP · max 5MB</p>
      </div>

      {preview && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => onRemove(kind)}
          className="text-xs text-brand-red hover:underline disabled:opacity-50"
        >
          Remove image
        </button>
      )}
    </div>
  )
}
