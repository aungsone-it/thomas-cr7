import { useEffect, useState } from 'react'

export function useLiveClock(intervalMs = 1000): string {
  const [time, setTime] = useState(getMMTTime)

  useEffect(() => {
    const id = setInterval(() => setTime(getMMTTime()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return time
}

function getMMTTime(): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Yangon',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date())
}
