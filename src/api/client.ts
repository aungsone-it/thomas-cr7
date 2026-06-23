import type { FormulaConfig, LivePayload, SiteSettings, CalendarStats } from '../types/api'
import type { Holiday, Result2D, Result3D } from '../types/lottery'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? `API error ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function fetchLive(): Promise<LivePayload> {
  return request('/live')
}

export function fetch2DResults(limit = 50): Promise<Result2D[]> {
  return request(`/2d?limit=${limit}`)
}

export function fetch2DByDate(date: string): Promise<Result2D[]> {
  return request(`/2d?date=${date}`)
}

export function fetch3DResults(limit = 50): Promise<Result3D[]> {
  return request(`/3d?limit=${limit}`)
}

export function fetchCalendarDates(): Promise<string[]> {
  return request('/calendar/dates')
}

export function fetchCalendarStats(): Promise<CalendarStats> {
  return request('/calendar/stats')
}

export function fetchSettings(): Promise<SiteSettings> {
  return request('/settings')
}

export function fetchHolidays(): Promise<Holiday[]> {
  return request('/holidays')
}

export function adminRequest<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  return request(`/admin${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })
}

export function adminGetSettings(token: string): Promise<SiteSettings> {
  return adminRequest('/settings', token)
}

export function adminSaveSettings(token: string, settings: SiteSettings): Promise<SiteSettings> {
  return adminRequest('/settings', token, { method: 'PUT', body: JSON.stringify(settings) })
}

export function adminGetFormula(token: string): Promise<FormulaConfig> {
  return adminRequest('/formula', token)
}

export function adminSaveFormula(token: string, formula: FormulaConfig): Promise<FormulaConfig> {
  return adminRequest('/formula', token, { method: 'PUT', body: JSON.stringify(formula) })
}

export function adminPollNow(token: string): Promise<LivePayload> {
  return adminRequest('/poll-now', token, { method: 'POST' })
}

export function adminHealth(token: string): Promise<{ ok: boolean }> {
  return adminRequest('/health', token)
}
