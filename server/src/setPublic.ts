import type { SetIndexData } from './types.js'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const SET_JSON_URL =
  'https://www.set.or.th/api/set/index/info/list?type=INDEX&sort=sequence&order=asc&language=en'

const SET_MARKET_SUMMARY_URL =
  'https://marketdata.set.or.th/mkt/marketsummary.do?language=en&country=US'

function parseNum(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  const n = Number(String(raw ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

function toSetIndex(value: number, change: number, updatedAt?: string): SetIndexData {
  const prior = value - change
  return {
    value,
    change,
    changePercent: prior !== 0 ? Math.round((change / prior) * 10000) / 100 : 0,
    updatedAt: updatedAt ?? new Date().toISOString(),
  }
}

async function fetchSetJson(): Promise<SetIndexData | null> {
  const res = await fetch(SET_JSON_URL, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
    signal: AbortSignal.timeout(12_000),
  })
  if (!res.ok) return null

  const data = (await res.json()) as Record<string, unknown>[]
  const row = data.find((r) => String(r.indexName ?? r.symbol ?? '').toUpperCase() === 'SET')
  if (!row) return null

  const value = parseNum(row.last ?? row.lastIndex ?? row.indexValue)
  const change = parseNum(row.change ?? row.indexChange)
  if (value <= 0) return null

  return toSetIndex(value, change, String(row.lastUpdate ?? row.updatedAt ?? ''))
}

async function fetchSetHtml(): Promise<SetIndexData | null> {
  const res = await fetch(SET_MARKET_SUMMARY_URL, {
    headers: { Accept: 'text/html', 'User-Agent': UA },
    signal: AbortSignal.timeout(12_000),
  })
  if (!res.ok) return null

  const html = await res.text()
  const rowMatch = html.match(
    /<tr[^>]*>[\s\S]*?>\s*SET\s*<[\s\S]*?<td[^>]*>\s*([\d,]+\.?\d*)\s*<[\s\S]*?<td[^>]*>\s*(-?[\d,]+\.?\d*)\s*<[\s\S]*?<td[^>]*>\s*(-?[\d,]+\.?\d*)\s*</i,
  )
  if (!rowMatch) return null

  const value = parseNum(rowMatch[1])
  const change = parseNum(rowMatch[2])
  if (value <= 0) return null

  const timeMatch = html.match(/Last Update\s+([\d/:\s]+)/i)
  const updatedAt = timeMatch?.[1]?.trim()

  return toSetIndex(value, change, updatedAt)
}

/** Free SET index — no API key. Used by Myanmar 2D apps worldwide. */
export async function fetchSetIndexPublic(): Promise<SetIndexData> {
  const sources = [fetchSetJson, fetchSetHtml]
  const errors: string[] = []

  for (const source of sources) {
    try {
      const data = await source()
      if (data) {
        console.log(`[SET] Live index ${data.value} (${source.name})`)
        return data
      }
      errors.push(`${source.name}: empty response`)
    } catch (err) {
      errors.push(`${source.name}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  throw new Error(`Could not fetch SET index — ${errors.join('; ')}`)
}
