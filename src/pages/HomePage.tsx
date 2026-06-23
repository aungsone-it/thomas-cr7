import { useLiveData } from '../hooks/useLiveData'
import LiveBadge from '../components/LiveBadge'
import { NumberDisplay, Result2DCard, Result3DCard, SetIndexBar } from '../components/NumberDisplay'
import { formatDate, slotLabel } from '../utils/format'
import { useSettings } from '../context/SettingsContext'

export default function HomePage() {
  const { data, loading, error } = useLiveData()
  const settings = useSettings()

  if (loading && !data) {
    return <LoadingState />
  }

  if (error && !data) {
    return <ErrorState message={error} />
  }

  if (!data?.latest2D) {
    return <ErrorState message="No results yet. Start the backend server." />
  }

  const { setIndex, latest2D, previous2D, latest3D, liveStatus } = data

  return (
    <div className="space-y-4 animate-slide-up">
      {settings.announcement && (
        <div className="rounded-xl bg-brand-gold/10 px-4 py-3 text-sm text-brand-gold ring-1 ring-brand-gold/30">
          {settings.announcement}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Live Results</h2>
          <p className="text-xs text-slate-400">ရလဒ်များ · {formatDate(latest2D.date, 'mm')}</p>
        </div>
        <LiveBadge
          isLive={liveStatus.isLive}
          label={liveStatus.message}
          labelMm={liveStatus.messageMm}
        />
      </div>

      <SetIndexBar
        value={setIndex.value}
        change={setIndex.change}
        changePercent={setIndex.changePercent}
      />

      <section>
        <SectionHeader title="2D Latest" subtitle="နောက်ဆုံးရ ၂D" />
        <Result2DCard result={latest2D} variant="hero" />
      </section>

      {previous2D && (
        <section>
          <SectionHeader title="Previous Draw" subtitle="ယခင်ရလဒ်" />
          <div className="rounded-xl bg-surface-card/60 p-4 ring-1 ring-slate-700/30">
            <div className="flex items-center justify-between">
              <NumberDisplay number={previous2D.number} size="md" />
              <div className="text-right">
                <p className="text-sm text-slate-300">{slotLabel(previous2D.slot)}</p>
                <p className="text-xs text-slate-500">
                  Set {previous2D.set} · {previous2D.value}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {latest3D && (
        <section>
          <SectionHeader title="3D Latest" subtitle="နောက်ဆုံးရ ၃D" />
          <Result3DCard
            number={latest3D.number}
            date={latest3D.date}
            drawDay={latest3D.drawDay}
            variant="hero"
          />
        </section>
      )}

      <DrawSchedule />
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-2 flex items-baseline gap-2">
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <span className="text-[11px] text-slate-500">{subtitle}</span>
    </div>
  )
}

function DrawSchedule() {
  const slots = [
    { time: '09:30 AM', session: 'Morning', sessionMm: 'မနက်' },
    { time: '12:01 PM', session: 'Morning', sessionMm: 'မနက်' },
    { time: '02:00 PM', session: 'Evening', sessionMm: 'ညနေ' },
    { time: '04:30 PM', session: 'Evening', sessionMm: 'ညနေ' },
  ]

  return (
    <section className="rounded-xl bg-surface-card/40 p-4 ring-1 ring-slate-700/30">
      <h3 className="mb-3 text-sm font-semibold text-slate-300">Draw Schedule</h3>
      <p className="mb-3 text-[11px] text-slate-500">Thailand working days · Myanmar Time (MMT)</p>
      <div className="grid grid-cols-2 gap-2">
        {slots.map(({ time, session, sessionMm }) => (
          <div key={time} className="rounded-lg bg-surface-elevated/50 px-3 py-2 text-center">
            <p className="text-sm font-semibold text-brand-gold">{time}</p>
            <p className="text-[10px] text-slate-400">{session} · {sessionMm}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" />
      <p className="text-sm">Loading live data…</p>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-brand-red/10 p-6 text-center ring-1 ring-brand-red/30">
      <p className="text-sm font-medium text-brand-red">{message}</p>
      <p className="mt-2 text-xs text-slate-400">
        Run: <code className="text-slate-300">npm run dev:all</code>
      </p>
    </div>
  )
}
