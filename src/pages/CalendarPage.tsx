import { useEffect, useMemo, useState } from 'react'
import { fetch2DByDate, fetchCalendarDates, fetchCalendarStats } from '../api/client'
import type { CalendarStats } from '../types/api'
import type { Result2D } from '../types/lottery'
import { formatDate, slotLabel } from '../utils/format'

export default function CalendarPage() {
  const [dates, setDates] = useState<string[]>([])
  const [stats, setStats] = useState<CalendarStats | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [dayResults, setDayResults] = useState<Result2D[]>([])

  useEffect(() => {
    fetchCalendarDates()
      .then((d) => {
        setDates(d)
        if (d[0]) setSelectedDate(d[0])
      })
      .catch(() => {})
    fetchCalendarStats().then(setStats).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedDate) return
    fetch2DByDate(selectedDate).then(setDayResults).catch(() => setDayResults([]))
  }, [selectedDate])

  const calendarDays = useMemo(() => buildCalendarDays(selectedDate), [selectedDate])

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h2 className="text-lg font-bold text-white">2D Calendar</h2>
        <p className="text-xs text-slate-400">၂D ပြက္ခဒိန် · Historical results</p>
      </div>

      {selectedDate && (
        <MonthNavigator
          selectedDate={selectedDate}
          onChange={setSelectedDate}
          availableDates={dates}
        />
      )}

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-1 text-center text-[10px] font-medium text-slate-500">
            {d}
          </div>
        ))}
        {calendarDays.map((day, i) => (
          <CalendarDay
            key={i}
            day={day}
            isSelected={day.date === selectedDate}
            hasResults={day.date ? dates.includes(day.date) : false}
            onSelect={() => day.date && setSelectedDate(day.date)}
          />
        ))}
      </div>

      {selectedDate && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-300">
            {formatDate(selectedDate)} · {formatDate(selectedDate, 'mm')}
          </h3>
          {dayResults.length > 0 ? (
            <div className="space-y-2">
              {dayResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between rounded-xl bg-surface-card px-4 py-3 ring-1 ring-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-brand-gold">{result.number}</span>
                    <div>
                      <p className="text-xs text-slate-400">{slotLabel(result.slot)}</p>
                      <p className="text-[11px] text-slate-500">
                        Set {result.set} · Val {result.value}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-surface-card/40 py-8 text-center text-sm text-slate-500">
              No results for this date
            </p>
          )}
        </section>
      )}

      {stats && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-300">Quick Stats</h3>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Total Draws" value={String(stats.totalDraws)} />
            <StatCard label="Days" value={String(stats.totalDays)} />
            <StatCard
              label="Latest"
              value={stats.latestDate ? formatDate(stats.latestDate).split(' ').slice(0, 2).join(' ') : '-'}
            />
          </div>
        </section>
      )}
    </div>
  )
}

interface CalendarDayData {
  date: string | null
  dayNum: number | null
}

function buildCalendarDays(selectedDate: string): CalendarDayData[] {
  if (!selectedDate) return []

  const d = new Date(selectedDate + 'T00:00:00')
  const year = d.getFullYear()
  const month = d.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()
  const days: CalendarDayData[] = []

  for (let i = 0; i < startPad; i++) days.push({ date: null, dayNum: null })

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    days.push({ date: dateStr, dayNum: day })
  }

  return days
}

function MonthNavigator({
  selectedDate,
  onChange,
  availableDates,
}: {
  selectedDate: string
  onChange: (date: string) => void
  availableDates: string[]
}) {
  const d = new Date(selectedDate + 'T00:00:00')

  const navigate = (delta: number) => {
    const nd = new Date(d)
    nd.setMonth(nd.getMonth() + delta)
    const dateStr = nd.toISOString().split('T')[0]
    const closest = availableDates.find((ad) => ad.startsWith(dateStr.slice(0, 7)))
    onChange(closest ?? dateStr)
  }

  return (
    <div className="flex items-center justify-between rounded-xl bg-surface-card px-4 py-3 ring-1 ring-slate-700/50">
      <button type="button" onClick={() => navigate(-1)} className="rounded-lg p-2 text-slate-400 hover:bg-surface-elevated hover:text-white" aria-label="Previous month">‹</button>
      <span className="text-sm font-semibold text-slate-200">
        {formatDate(selectedDate)} · {formatDate(selectedDate, 'mm')}
      </span>
      <button type="button" onClick={() => navigate(1)} className="rounded-lg p-2 text-slate-400 hover:bg-surface-elevated hover:text-white" aria-label="Next month">›</button>
    </div>
  )
}

function CalendarDay({
  day,
  isSelected,
  hasResults,
  onSelect,
}: {
  day: CalendarDayData
  isSelected: boolean
  hasResults: boolean
  onSelect: () => void
}) {
  if (!day.dayNum) return <div className="aspect-square" />

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`aspect-square rounded-lg text-xs font-medium transition-colors ${
        isSelected
          ? 'bg-brand-gold text-surface'
          : hasResults
            ? 'bg-surface-elevated/60 text-slate-200 hover:bg-surface-elevated'
            : 'text-slate-500 hover:bg-surface-elevated/30'
      }`}
    >
      {day.dayNum}
      {hasResults && !isSelected && (
        <span className="mx-auto mt-0.5 block h-1 w-1 rounded-full bg-brand-gold" />
      )}
    </button>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-card px-3 py-3 text-center ring-1 ring-slate-700/50">
      <p className="text-lg font-bold text-brand-gold">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  )
}
