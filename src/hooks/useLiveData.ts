import { useCallback, useEffect, useState } from 'react'
import { fetchLive } from '../api/client'
import type { LivePayload } from '../types/api'

export function useLiveData(pollMs = 10_000) {
  const [data, setData] = useState<LivePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const payload = await fetchLive()
      setData(payload)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, pollMs)
    return () => clearInterval(id)
  }, [refresh, pollMs])

  return { data, loading, error, refresh }
}
