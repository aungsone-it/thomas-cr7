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
