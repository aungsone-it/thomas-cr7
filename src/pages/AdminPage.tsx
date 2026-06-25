import { useEffect, useState } from 'react'
import {
  adminDeleteImage,
  adminGetFormula,
  adminGetSettings,
  adminPollNow,
  adminSaveFormula,
  adminSaveSettings,
  adminUploadImage,
} from '../api/client'
import ImageUploadField from '../components/ImageUploadField'
import type { FormulaConfig, SiteSettings, UploadKind } from '../types/api'

const TOKEN_KEY = 'mm2d3d_admin_token'

const FORMULA_2D_OPTIONS = [
  { value: 'change_last_two', label: 'Change last 2 digits (common)' },
  { value: 'index_decimal_two', label: 'Index decimal part (e.g. 1284.56 → 56)' },
  { value: 'index_whole_last_two', label: 'Whole number last 2 digits' },
]

const FORMULA_3D_OPTIONS = [
  { value: 'index_three_digits', label: 'Last 3 digits of index' },
  { value: 'change_three_digits', label: 'Last 3 digits of change' },
]

export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '')
  const [loggedIn, setLoggedIn] = useState(false)
  const [checkingSavedToken, setCheckingSavedToken] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)?.trim()))
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [formula, setFormula] = useState<FormulaConfig | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState<UploadKind | null>(null)
  const [showToken, setShowToken] = useState(false)

  async function loginWithToken(rawToken: string, silent = false) {
    if (!silent) setError('')
    const trimmed = rawToken.trim()
    if (!trimmed) {
      if (!silent) setError('Enter your admin token')
      setCheckingSavedToken(false)
      return
    }

    const base = import.meta.env.VITE_API_URL ?? '/api'

    try {
      const healthRes = await fetch(`${base}/admin/health`, {
        headers: { Authorization: `Bearer ${trimmed}` },
      })

      if (healthRes.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        if (!silent) setError('Wrong token — must match ADMIN_TOKEN in server/.env exactly')
        setLoggedIn(false)
        setCheckingSavedToken(false)
        return
      }
      if (healthRes.status === 503) {
        if (!silent) setError('Set ADMIN_TOKEN in server/.env, then restart the server')
        setLoggedIn(false)
        setCheckingSavedToken(false)
        return
      }
      if (!healthRes.ok) {
        if (!silent) setError(`Backend error (${healthRes.status}). Run: npm run dev:all`)
        setLoggedIn(false)
        setCheckingSavedToken(false)
        return
      }

      localStorage.setItem(TOKEN_KEY, trimmed)
      setToken(trimmed)
      const [s, f] = await Promise.all([
        adminGetSettings(trimmed),
        adminGetFormula(trimmed),
      ])
      setSettings(s)
      setFormula(f)
      setLoggedIn(true)
      if (!silent) setMessage('Connected to admin API')
    } catch {
      if (!silent) setError('Backend not running — open terminal and run: npm run dev:all')
      setLoggedIn(false)
    } finally {
      setCheckingSavedToken(false)
    }
  }

  async function login() {
    await loginWithToken(token, false)
  }

  async function saveSettings() {
    if (!token || !settings) return
    setMessage('')
    try {
      const saved = await adminSaveSettings(token, settings)
      setSettings(saved)
      setMessage('Site settings saved')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    }
  }

  async function saveFormula() {
    if (!token || !formula) return
    setMessage('')
    try {
      const saved = await adminSaveFormula(token, formula)
      setFormula(saved)
      setMessage('Formula saved')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    }
  }

  async function handleUpload(kind: UploadKind, file: File) {
    if (!token) return
    setUploading(kind)
    setError('')
    try {
      const { settings: saved } = await adminUploadImage(token, kind, file)
      setSettings(saved)
      setMessage(`${kind} image uploaded`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(null)
    }
  }

  async function handleRemoveImage(kind: UploadKind) {
    if (!token) return
    setUploading(kind)
    setError('')
    try {
      const { settings: saved } = await adminDeleteImage(token, kind)
      setSettings(saved)
      setMessage(`${kind} image removed`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Remove failed')
    } finally {
      setUploading(null)
    }
  }

  async function triggerPoll() {
    if (!token) return
    try {
      await adminPollNow(token)
      setMessage('Polled SET and refreshed cache')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Poll failed')
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setLoggedIn(false)
    setToken('')
    setSettings(null)
    setFormula(null)
    setMessage('')
    setError('')
    setShowToken(false)
    setCheckingSavedToken(false)
  }

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY)?.trim()
    if (!saved) {
      setCheckingSavedToken(false)
      return
    }
    setToken(saved)
    void loginWithToken(saved, true)
  }, [])

  if (!loggedIn) {
    if (checkingSavedToken) {
      return (
        <div className="mx-auto max-w-md space-y-4 py-8">
          <h1 className="text-xl font-bold text-white">Admin Login</h1>
          <p className="text-sm text-slate-400">Restoring your saved session...</p>
        </div>
      )
    }
    return (
      <div className="mx-auto max-w-md space-y-4 py-8">
        <h1 className="text-xl font-bold text-white">Admin Login</h1>
        <p className="text-sm text-slate-400">
          Enter the <code className="text-slate-300">ADMIN_TOKEN</code> from server/.env
        </p>
        <div className="relative">
          <input
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Admin token"
            className="w-full rounded-xl bg-surface-card py-3 pl-4 pr-12 text-sm text-white ring-1 ring-slate-600 focus:outline-none focus:ring-brand-gold"
          />
          <button
            type="button"
            onClick={() => setShowToken((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-surface-elevated hover:text-slate-200"
            aria-label={showToken ? 'Hide token' : 'Show token'}
          >
            {showToken ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        </div>
        {error && <p className="text-sm text-brand-red">{error}</p>}
        <button
          type="button"
          onClick={login}
          className="w-full rounded-xl bg-brand-gold py-3 text-sm font-semibold text-surface"
        >
          Login
        </button>
      </div>
    )
  }

  if (!settings || !formula) return null

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Admin Panel</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={triggerPoll}
            className="rounded-lg bg-surface-elevated px-3 py-1.5 text-xs text-slate-300 ring-1 ring-slate-600"
          >
            Poll SET now
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-surface-elevated px-3 py-1.5 text-xs text-slate-300 ring-1 ring-slate-600"
          >
            Logout
          </button>
        </div>
      </div>

      {message && <p className="rounded-lg bg-brand-green/10 px-3 py-2 text-sm text-brand-green">{message}</p>}
      {error && <p className="rounded-lg bg-brand-red/10 px-3 py-2 text-sm text-brand-red">{error}</p>}

      <section className="space-y-3 rounded-xl bg-surface-card p-4 ring-1 ring-slate-700">
        <h2 className="text-sm font-semibold text-slate-200">Site branding</h2>
        <Field label="App name" value={settings.appName} onChange={(v) => setSettings({ ...settings, appName: v })} />
        <Field label="Subtitle" value={settings.appSubtitle} onChange={(v) => setSettings({ ...settings, appSubtitle: v })} />
        <Field label="Announcement banner" value={settings.announcement} onChange={(v) => setSettings({ ...settings, announcement: v })} />
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Background" value={settings.backgroundColor} onChange={(v) => setSettings({ ...settings, backgroundColor: v })} />
          <ColorField label="Card color" value={settings.cardColor} onChange={(v) => setSettings({ ...settings, cardColor: v })} />
          <ColorField label="Accent / gold" value={settings.accentColor} onChange={(v) => setSettings({ ...settings, accentColor: v })} />
          <ColorField label="Primary" value={settings.primaryColor} onChange={(v) => setSettings({ ...settings, primaryColor: v })} />
        </div>
        <button type="button" onClick={saveSettings} className="w-full rounded-lg bg-brand-gold py-2.5 text-sm font-semibold text-surface">
          Save branding
        </button>
      </section>

      <section className="space-y-4 rounded-xl bg-surface-card p-4 ring-1 ring-slate-700">
        <h2 className="text-sm font-semibold text-slate-200">Images & banners</h2>
        <p className="text-xs text-slate-500">Stored on your server — no extra cost. Max 5MB each.</p>

        <ImageUploadField
          label="Logo"
          hint="Shown in the header (square works best)"
          kind="logo"
          currentUrl={settings.logoUrl}
          uploading={uploading === 'logo'}
          onUpload={handleUpload}
          onRemove={handleRemoveImage}
        />

        <ImageUploadField
          label="Loading banner"
          hint="Full-screen image while the app loads"
          kind="loading"
          currentUrl={settings.loadingBannerUrl}
          uploading={uploading === 'loading'}
          onUpload={handleUpload}
          onRemove={handleRemoveImage}
        />

        <ImageUploadField
          label="Background image"
          hint="Behind all pages — use a dark image for readability"
          kind="background"
          currentUrl={settings.backgroundImageUrl}
          uploading={uploading === 'background'}
          onUpload={handleUpload}
          onRemove={handleRemoveImage}
        />

        <label className="block text-xs text-slate-400">
          Background overlay darkness ({settings.backgroundOverlay}%)
          <input
            type="range"
            min={0}
            max={90}
            value={settings.backgroundOverlay}
            onChange={(e) => setSettings({ ...settings, backgroundOverlay: Number(e.target.value) })}
            className="mt-2 w-full accent-brand-gold"
          />
          <p className="mt-1 text-[10px] text-slate-500">Higher = darker overlay so text stays readable</p>
        </label>

        <button type="button" onClick={saveSettings} className="w-full rounded-lg bg-brand-gold py-2.5 text-sm font-semibold text-surface">
          Save overlay & branding
        </button>
      </section>

      <section className="space-y-3 rounded-xl bg-surface-card p-4 ring-1 ring-slate-700">
        <h2 className="text-sm font-semibold text-slate-200">Formula (client editable)</h2>
        <p className="text-xs text-slate-500">How SET index becomes 2D/3D numbers. Confirm rules with your client.</p>
        <label className="block text-xs text-slate-400">
          2D method
          <select
            value={formula.twoD.method}
            onChange={(e) => setFormula({ ...formula, twoD: { method: e.target.value as FormulaConfig['twoD']['method'] } })}
            className="mt-1 w-full rounded-lg bg-surface-elevated px-3 py-2 text-sm text-white ring-1 ring-slate-600"
          >
            {FORMULA_2D_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-slate-400">
          3D method
          <select
            value={formula.threeD.method}
            onChange={(e) => setFormula({ ...formula, threeD: { method: e.target.value as FormulaConfig['threeD']['method'] } })}
            className="mt-1 w-full rounded-lg bg-surface-elevated px-3 py-2 text-sm text-white ring-1 ring-slate-600"
          >
            {FORMULA_3D_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={saveFormula} className="w-full rounded-lg bg-brand-gold py-2.5 text-sm font-semibold text-surface">
          Save formula
        </button>
      </section>

      <p className="text-center text-[11px] text-slate-500">
        Give this URL to your client: <span className="text-slate-400">/admin</span>
      </p>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs text-slate-400">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg bg-surface-elevated px-3 py-2 text-sm text-white ring-1 ring-slate-600"
      />
    </label>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs text-slate-400">
      {label}
      <div className="mt-1 flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-10 cursor-pointer rounded border-0 bg-transparent" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-lg bg-surface-elevated px-2 py-2 text-xs text-white ring-1 ring-slate-600" />
      </div>
    </label>
  )
}

function EyeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}
