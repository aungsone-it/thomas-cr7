import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
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
}

const SettingsContext = createContext<SiteSettings>(DEFAULT)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT)

  useEffect(() => {
    fetchSettings()
      .then(setSettings)
      .catch(() => {})
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-brand-gold', settings.accentColor)
    root.style.setProperty('--color-surface', settings.backgroundColor)
    root.style.setProperty('--color-surface-card', settings.cardColor)
    root.style.setProperty('--color-primary', settings.primaryColor)
  }, [settings])

  return (
    <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
  )
}

export function useSettings(): SiteSettings {
  return useContext(SettingsContext)
}
