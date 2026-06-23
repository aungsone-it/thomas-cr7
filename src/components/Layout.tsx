import { NavLink, Outlet } from 'react-router-dom'
import { useLiveClock } from '../hooks/useLiveClock'
import { useSettings } from '../context/SettingsContext'

const navItems = [
  { to: '/', label: 'Home', labelMm: 'ပင်မစာမျက်နှာ', icon: HomeIcon },
  { to: '/2d', label: '2D', labelMm: '၂D', icon: TwoDIcon },
  { to: '/3d', label: '3D', labelMm: '၃D', icon: ThreeDIcon },
  { to: '/calendar', label: 'Calendar', labelMm: 'ပြက္ခဒိန်', icon: CalendarIcon },
]

export default function Layout() {
  const settings = useSettings()

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gold/20 ring-1 ring-brand-gold/40">
              <span className="text-sm font-bold text-brand-gold">2D</span>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-white">{settings.appName}</h1>
              <p className="text-[11px] text-slate-400">{settings.appSubtitle}</p>
            </div>
          </div>
          <Clock />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700/50 bg-surface-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg">
          {navItems.map(({ to, label, labelMm, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors ${
                  isActive
                    ? 'text-brand-gold'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  <span className="text-[10px] font-medium">{label}</span>
                  <span className="text-[9px] opacity-70">{labelMm}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

function Clock() {
  const time = useLiveClock()

  return (
    <div className="text-right">
      <p className="text-sm font-semibold tabular-nums text-slate-200">{time}</p>
      <p className="text-[10px] text-slate-500">MMT (UTC+6:30)</p>
    </div>
  )
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'fill-brand-gold' : 'fill-none stroke-current'}`} viewBox="0 0 24 24" strokeWidth={active ? 0 : 1.5}>
      {!active && <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />}
      {active && <path d="M11.47 3.841a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />}
    </svg>
  )
}

function TwoDIcon({ active }: { active: boolean }) {
  return (
    <div className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${active ? 'bg-brand-gold text-surface' : 'border border-current'}`}>
      2D
    </div>
  )
}

function ThreeDIcon({ active }: { active: boolean }) {
  return (
    <div className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${active ? 'bg-brand-gold text-surface' : 'border border-current'}`}>
      3D
    </div>
  )
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-brand-gold' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}
