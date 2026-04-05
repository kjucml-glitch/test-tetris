import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseUrl = Boolean(supabaseUrl)
export const hasSupabaseAnonKey = Boolean(supabaseAnonKey)
export const isSupabaseConfigured = hasSupabaseUrl && hasSupabaseAnonKey

export function getSupabaseSetupMessage() {
  if (!hasSupabaseUrl && !hasSupabaseAnonKey) {
    return '.env.local에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 추가하세요.'
  }

  if (!hasSupabaseAnonKey) {
    return 'VITE_SUPABASE_ANON_KEY가 비어 있습니다. 브라우저에는 service role key가 아니라 anon public key를 넣어야 합니다.'
  }

  if (!hasSupabaseUrl) {
    return 'VITE_SUPABASE_URL이 비어 있습니다. Supabase Project URL을 넣어야 합니다.'
  }

  return 'Supabase 설정이 준비되었습니다.'
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null