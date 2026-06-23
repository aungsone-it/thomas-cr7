export type DrawSession = 'morning' | 'evening'
export type DrawSlot = '09:30' | '12:01' | '14:00' | '16:30'

export interface SetIndexData {
  value: number
  change: number
  changePercent: number
  updatedAt: string
}

export interface Result2D {
  id: string
  date: string
  session: DrawSession
  slot: DrawSlot
  number: string
  set: number
  value: number
  setIndex: number
}

export interface Result3D {
  id: string
  date: string
  number: string
  drawDay: number
}

export interface Holiday {
  date: string
  name: string
  nameMm: string
}

export interface LiveStatus {
  isLive: boolean
  session: DrawSession | null
  nextSlot: DrawSlot | null
  nextDrawAt: string | null
  message: string
  messageMm: string
}

export interface SiteSettings {
  appName: string
  appSubtitle: string
  primaryColor: string
  backgroundColor: string
  cardColor: string
  accentColor: string
  announcement: string
  logoUrl: string
  loadingBannerUrl: string
  backgroundImageUrl: string
  backgroundOverlay: number
}

export type Formula2DMethod = 'change_last_two' | 'index_decimal_two' | 'index_whole_last_two'
export type Formula3DMethod = 'index_three_digits' | 'change_three_digits'

export interface FormulaConfig {
  twoD: { method: Formula2DMethod }
  threeD: { method: Formula3DMethod }
}

export interface LivePayload {
  setIndex: SetIndexData
  latest2D: Result2D | null
  previous2D: Result2D | null
  latest3D: Result3D | null
  liveStatus: LiveStatus
  settings: SiteSettings
  updatedAt: string
}

export const DEFAULT_SETTINGS: SiteSettings = {
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

export const DEFAULT_FORMULA: FormulaConfig = {
  twoD: { method: 'change_last_two' },
  threeD: { method: 'index_three_digits' },
}
