import { useEffect, useState } from 'react'
import {
  adminGetFormula,
  adminGetSettings,
  adminHealth,
  adminPollNow,
  adminSaveFormula,
  adminSaveSettings,
} from '../api/client'
import type { FormulaConfig, SiteSettings } from '../types/api'

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
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [formula, setFormula] = useState<FormulaConfig | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function login() {
    setError('')
    try {
      localStorage.setItem(TOKEN_KEY, token)
      await adminHealth(token)
      const [s, f] = await Promise.all([adminGetSettings(token), adminGetFormula(token)])
      setSettings(s)
      setFormula(f)
      setLoggedIn(true)
      setMessage('Connected to admin API')
    } catch {
      setError('Invalid token or server not running')
      setLoggedIn(false)
    }
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

  async function triggerPoll() {
    if (!token) return
    try {
      await adminPollNow(token)
      setMessage('Polled SET and refreshed cache')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Poll failed')
    }
  }

  useEffect(() => {
    if (token) login()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!loggedIn) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-8">
        <h1 className="text-xl font-bold text-white">Admin Login</h1>
        <p className="text-sm text-slate-400">
          Enter the <code className="text-slate-300">ADMIN_TOKEN</code> from server/.env
        </p>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Admin token"
          className="w-full rounded-xl bg-surface-card px-4 py-3 text-sm text-white ring-1 ring-slate-600 focus:outline-none focus:ring-brand-gold"
        />
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
        <button
          type="button"
          onClick={triggerPoll}
          className="rounded-lg bg-surface-elevated px-3 py-1.5 text-xs text-slate-300 ring-1 ring-slate-600"
        >
          Poll SET now
        </button>
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
