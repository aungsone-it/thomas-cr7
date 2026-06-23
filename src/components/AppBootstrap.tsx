import { useEffect, useState, type ReactNode } from 'react'
import LoadingScreen from './LoadingScreen'
import { useSettingsContext } from '../context/SettingsContext'

const MIN_MS = 800

export default function AppBootstrap({ children }: { children: ReactNode }) {
  const { ready } = useSettingsContext()
  const [showLoader, setShowLoader] = useState(true)
  const [minDone, setMinDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), MIN_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (ready && minDone) {
      const t = setTimeout(() => setShowLoader(false), 200)
      return () => clearTimeout(t)
    }
  }, [ready, minDone])

  return (
    <>
      <LoadingScreen visible={showLoader} />
      <div
        className={`transition-opacity duration-300 ${showLoader ? 'opacity-0' : 'opacity-100'}`}
      >
        {children}
      </div>
    </>
  )
}
