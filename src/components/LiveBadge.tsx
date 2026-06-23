interface LiveBadgeProps {
  isLive: boolean
  label: string
  labelMm: string
}

export default function LiveBadge({ isLive, label, labelMm }: LiveBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
        isLive
          ? 'bg-brand-red/20 text-brand-red ring-1 ring-brand-red/40'
          : 'bg-slate-700/50 text-slate-300 ring-1 ring-slate-600'
      }`}
    >
      {isLive && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-red opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-red animate-pulse-live" />
        </span>
      )}
      <span>{label}</span>
      <span className="opacity-70">· {labelMm}</span>
    </div>
  )
}
