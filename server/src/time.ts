const TZ = 'Asia/Yangon'

export interface MMTParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  weekday: number
}

const WEEKDAY: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

export function getMMTParts(date = new Date()): MMTParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0'
  let hour = Number(get('hour'))
  if (hour === 24) hour = 0

  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour,
    minute: Number(get('minute')),
    weekday: WEEKDAY[get('weekday')] ?? 0,
  }
}

export function fmtDateMMT(date = new Date()): string {
  const p = getMMTParts(date)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

export function minutesSinceMidnightMMT(date = new Date()): number {
  const p = getMMTParts(date)
  return p.hour * 60 + p.minute
}

export function isWeekdayMMT(date = new Date()): boolean {
  const { weekday } = getMMTParts(date)
  return weekday >= 1 && weekday <= 5
}

export function formatClockMMT(date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date)
}
