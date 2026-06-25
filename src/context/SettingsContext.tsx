import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchSettings } from '../api/client'
import type { SiteSettings } from '../types/api'

const DEFAULT: SiteSettings = {
  appName: 'MM 2D3D Live',
  appSubtitle: 'Myanmar Lottery Results',
  primaryColor: '#fbbf24',
  backgroundColor: '#0f172a',
  cardColor: '#1e293b',
  accentColor: '#fbbf24',
  announcement: '',
  logoUrl: '',
  loadingBannerUrl: '',
  backgroundImageUrl: '',
  backgroundOverlay: 65,
}

interface SettingsContextValue {
  settings: SiteSettings
  ready: boolean
  refreshSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT,
  ready: false,
  refreshSettings: async () => {},
})

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT)
  const [ready, setReady] = useState(false)

  const refreshSettings = useCallback(async () => {
    try {
      const s = await fetchSettings()
      setSettings(s)
    } catch {
      /* keep defaults */
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    refreshSettings()
  }, [refreshSettings])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-brand-gold', settings.accentColor)
    root.style.setProperty('--color-surface', settings.backgroundColor)
    root.style.setProperty('--color-surface-card', settings.cardColor)
    root.style.setProperty('--color-primary', settings.primaryColor)
  }, [settings])

  useEffect(() => {
    // Keep browser tab title aligned with admin-configured app name.
    document.title = settings.appName || 'MM 2D3D Live'
  }, [settings.appName])

  return (
    <SettingsContext.Provider value={{ settings, ready, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SiteSettings {
  return useContext(SettingsContext).settings
}

export function useSettingsContext(): SettingsContextValue {
  return useContext(SettingsContext)
}
