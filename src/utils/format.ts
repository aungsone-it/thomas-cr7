const MM_MONTHS = [
  'ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်',
  'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ',
]

const EN_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatDate(dateStr: string, locale: 'en' | 'mm' = 'en'): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDate()
  const month = d.getMonth()
  const year = d.getFullYear()

  if (locale === 'mm') {
    return `${day} ${MM_MONTHS[month]} ${year}`
  }
  return `${day} ${EN_MONTHS[month]} ${year}`
}

export function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function sessionLabel(session: 'morning' | 'evening'): { en: string; mm: string } {
  return session === 'morning'
    ? { en: 'Morning', mm: 'မနက်ပိုင်း' }
    : { en: 'Evening', mm: 'ညနေပိုင်း' }
}

export function slotLabel(slot: string): string {
  const labels: Record<string, string> = {
    '09:30': '09:30 AM',
    '12:01': '12:01 PM',
    '14:00': '02:00 PM',
    '16:30': '04:30 PM',
  }
  return labels[slot] ?? slot
}

export function groupByDate<T extends { date: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const existing = map.get(item.date) ?? []
    existing.push(item)
    map.set(item.date, existing)
  }
  return map
}

export function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0]
}

export function getCurrentTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}
