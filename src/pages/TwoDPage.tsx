import { useEffect, useState } from 'react'
import { fetch2DResults } from '../api/client'
import { useLiveData } from '../hooks/useLiveData'
import LiveBadge from '../components/LiveBadge'
import { Result2DCard, SetIndexBar } from '../components/NumberDisplay'
import type { Result2D } from '../types/lottery'
import { formatDate, groupByDate } from '../utils/format'

export default function TwoDPage() {
  const { data: live } = useLiveData()
  const [results, setResults] = useState<Result2D[]>([])

  useEffect(() => {
    fetch2DResults().then(setResults).catch(() => {})
  }, [])

  const grouped = groupByDate(results)
  const dates = [...grouped.keys()]
  const liveStatus = live?.liveStatus
  const setIndex = live?.setIndex

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">2D Results</h2>
          <p className="text-xs text-slate-400">၂D ရလဒ်များ</p>
        </div>
        {liveStatus && (
          <LiveBadge
            isLive={liveStatus.isLive}
            label={liveStatus.message}
            labelMm={liveStatus.messageMm}
          />
        )}
      </div>

      {setIndex && (
        <SetIndexBar
          value={setIndex.value}
          change={setIndex.change}
          changePercent={setIndex.changePercent}
        />
      )}

      {results.length > 0 && <Result2DCard result={results[0]} variant="hero" />}

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-300">History</h3>
        <div className="space-y-4">
          {dates.map((date) => (
            <div key={date}>
              <p className="mb-2 text-xs font-medium text-slate-400">
                {formatDate(date)} · {formatDate(date, 'mm')}
              </p>
              <div className="space-y-2">
                {(grouped.get(date) ?? []).map((result) => (
                  <Result2DCard key={result.id} result={result} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
