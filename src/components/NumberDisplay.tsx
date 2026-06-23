import type { Result2D } from '../types/lottery'
import { formatDate, sessionLabel, slotLabel } from '../utils/format'

interface NumberDisplayProps {
  number: string
  size?: 'lg' | 'md' | 'sm'
  glowing?: boolean
}

export function NumberDisplay({ number, size = 'lg', glowing = false }: NumberDisplayProps) {
  const sizeClasses = {
    lg: 'text-7xl tracking-widest',
    md: 'text-5xl tracking-wider',
    sm: 'text-3xl tracking-wide',
  }

  return (
    <div
      className={`font-bold text-brand-gold ${sizeClasses[size]} ${glowing ? 'animate-number-glow' : ''}`}
    >
      {number}
    </div>
  )
}

interface Result2DCardProps {
  result: Result2D
  variant?: 'hero' | 'compact'
}

export function Result2DCard({ result, variant = 'compact' }: Result2DCardProps) {
  const session = sessionLabel(result.session)

  if (variant === 'hero') {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-surface-card to-surface-elevated p-6 ring-1 ring-slate-600/50">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">{formatDate(result.date)}</p>
            <p className="text-sm font-medium text-slate-300">
              {session.en} · {session.mm}
            </p>
          </div>
          <span className="rounded-lg bg-brand-gold/15 px-2.5 py-1 text-xs font-semibold text-brand-gold">
            {slotLabel(result.slot)}
          </span>
        </div>
        <div className="flex flex-col items-center py-4">
          <NumberDisplay number={result.number} glowing />
          <div className="mt-4 flex gap-6 text-center">
            <Stat label="Set" value={String(result.set)} />
            <Stat label="Value" value={String(result.value).padStart(2, '0')} />
            <Stat label="SET Index" value={result.setIndex.toFixed(2)} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-xl bg-surface-card px-4 py-3 ring-1 ring-slate-700/50">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-brand-gold">{result.number}</span>
        <div>
          <p className="text-xs text-slate-400">{slotLabel(result.slot)}</p>
          <p className="text-[11px] text-slate-500">
            Set {result.set} · Val {result.value}
          </p>
        </div>
      </div>
      <span className="text-[10px] text-slate-500">{session.en}</span>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-200">{value}</p>
    </div>
  )
}

interface Result3DCardProps {
  number: string
  date: string
  drawDay: number
  variant?: 'hero' | 'compact'
}

export function Result3DCard({ number, date, drawDay, variant = 'compact' }: Result3DCardProps) {
  if (variant === 'hero') {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-surface-card to-surface-elevated p-6 ring-1 ring-slate-600/50">
        <div className="mb-4 text-center">
          <p className="text-xs text-slate-400">{formatDate(date)}</p>
          <p className="text-sm text-slate-300">Draw Day: {drawDay}</p>
        </div>
        <div className="flex justify-center py-4">
          <NumberDisplay number={number} size="lg" glowing />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-xl bg-surface-card px-4 py-3 ring-1 ring-slate-700/50">
      <span className="text-2xl font-bold text-brand-gold">{number}</span>
      <div className="text-right">
        <p className="text-xs text-slate-400">{formatDate(date)}</p>
        <p className="text-[10px] text-slate-500">Day {drawDay}</p>
      </div>
    </div>
  )
}

interface SetIndexBarProps {
  value: number
  change: number
  changePercent: number
}

export function SetIndexBar({ value, change, changePercent }: SetIndexBarProps) {
  const isUp = change >= 0

  return (
    <div className="rounded-xl bg-surface-card p-4 ring-1 ring-slate-700/50">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🇹🇭</span>
          <span className="text-sm font-medium text-slate-300">SET Index</span>
        </div>
        <span className="text-[10px] text-slate-500">Thailand Stock Exchange</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold tabular-nums text-white">
          {value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
        <div className={`text-right text-sm font-semibold ${isUp ? 'text-brand-green' : 'text-brand-red'}`}>
          <span>{isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}</span>
          <span className="ml-1 text-xs">({isUp ? '+' : ''}{changePercent.toFixed(2)}%)</span>
        </div>
      </div>
    </div>
  )
}
