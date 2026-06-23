export interface SiteSettings {
  appName: string
  appSubtitle: string
  primaryColor: string
  backgroundColor: string
  cardColor: string
  accentColor: string
  announcement: string
}

export type Formula2DMethod = 'change_last_two' | 'index_decimal_two' | 'index_whole_last_two'
export type Formula3DMethod = 'index_three_digits' | 'change_three_digits'

export interface FormulaConfig {
  twoD: { method: Formula2DMethod }
  threeD: { method: Formula3DMethod }
}

export interface LivePayload {
  setIndex: import('./lottery').SetIndexData
  latest2D: import('./lottery').Result2D | null
  previous2D: import('./lottery').Result2D | null
  latest3D: import('./lottery').Result3D | null
  liveStatus: import('./lottery').LiveStatus
  settings: SiteSettings
  updatedAt: string
}

export interface CalendarStats {
  totalDraws: number
  totalDays: number
  latestDate: string | null
}
