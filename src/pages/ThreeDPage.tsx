import { useEffect, useState } from 'react'
import { fetch3DResults, fetchHolidays } from '../api/client'
import { Result3DCard } from '../components/NumberDisplay'
import type { Holiday, Result3D } from '../types/lottery'
import { formatDate } from '../utils/format'

export default function ThreeDPage() {
  const [results, setResults] = useState<Result3D[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])

  useEffect(() => {
    fetch3DResults().then(setResults).catch(() => {})
    fetchHolidays().then(setHolidays).catch(() => {})
  }, [])

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h2 className="text-lg font-bold text-white">3D Results</h2>
        <p className="text-xs text-slate-400">၃D ရလဒ်များ · Draw on 1st & 16th</p>
      </div>

      {results.length > 0 && (
        <Result3DCard
          number={results[0].number}
          date={results[0].date}
          drawDay={results[0].drawDay}
          variant="hero"
        />
      )}

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-300">Draw History</h3>
        <div className="space-y-2">
          {results.map((result) => (
            <Result3DCard
              key={result.id}
              number={result.number}
              date={result.date}
              drawDay={result.drawDay}
            />
          ))}
        </div>
      </section>

      {holidays.length > 0 && (
        <section className="rounded-xl bg-surface-card/40 p-4 ring-1 ring-slate-700/30">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">Upcoming Holidays</h3>
          <p className="mb-3 text-[11px] text-slate-500">No draws on public holidays</p>
          <div className="space-y-2">
            {holidays.slice(0, 5).map((holiday) => (
              <div
                key={holiday.date}
                className="flex items-center justify-between rounded-lg bg-surface-elevated/40 px-3 py-2"
              >
                <div>
                  <p className="text-xs font-medium text-slate-300">{holiday.name}</p>
                  <p className="text-[10px] text-slate-500">{holiday.nameMm}</p>
                </div>
                <span className="text-[11px] text-slate-400">{formatDate(holiday.date)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
