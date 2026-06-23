import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface px-4 pt-4">
      <div className="mx-auto mb-4 flex max-w-lg items-center justify-between">
        <Link to="/" className="text-sm text-brand-gold hover:underline">← Back to app</Link>
        <span className="text-xs text-slate-500">Admin</span>
      </div>
      {children}
    </div>
  )
}
