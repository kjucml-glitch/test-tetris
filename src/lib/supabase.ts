import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const isServiceRoleKey = typeof supabaseAnonKey === 'string' && supabaseAnonKey.startsWith('sb_secret_')

export const hasSupabaseUrl = Boolean(supabaseUrl)
export const hasSupabaseAnonKey = Boolean(supabaseAnonKey) && !isServiceRoleKey
export const isSupabaseConfigured = hasSupabaseUrl && hasSupabaseAnonKey

export function getSupabaseSetupMessage() {
  if (!hasSupabaseUrl && !hasSupabaseAnonKey) {
    return '.env.local에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 추가하세요.'
  }

  if (isServiceRoleKey) {
    return '현재 VITE_SUPABASE_ANON_KEY에 service role key가 들어 있습니다. 이 키는 브라우저에 넣으면 안 되며, Supabase API 설정의 anon public key로 교체해야 합니다.'
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