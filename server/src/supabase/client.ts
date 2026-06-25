import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'assets'

let client: SupabaseClient | null = null

export function isSupabaseEnabled(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function getSupabase(): SupabaseClient {
  if (!isSupabaseEnabled()) {
    throw new Error('Supabase is not configured')
  }
  if (!client) {
    client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
  }
  return client
}

export function getStoragePublicUrl(path: string): string {
  const base = process.env.SUPABASE_URL!.replace(/\/$/, '')
  return `${base}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`
}
