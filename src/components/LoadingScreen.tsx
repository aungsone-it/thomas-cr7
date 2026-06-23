import { mediaUrl } from '../api/client'
import { useSettings } from '../context/SettingsContext'

interface LoadingScreenProps {
  visible: boolean
}

export default function LoadingScreen({ visible }: LoadingScreenProps) {
  const settings = useSettings()
  const banner = mediaUrl(settings.loadingBannerUrl)

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface">
      {banner ? (
        <img
          src={banner}
          alt="Loading"
          className="max-h-[70vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
        />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
          <p className="text-sm text-slate-400">Loading…</p>
        </div>
      )}
      <div className="absolute bottom-10 flex items-center gap-2">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-gold" />
        <p className="text-xs text-slate-500">{settings.appName}</p>
      </div>
    </div>
  )
}
