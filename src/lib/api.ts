import type { User } from '@supabase/supabase-js'
import type { GameResult } from '../game/types.ts'
import { supabase } from './supabase.ts'

export type LeaderboardEntry = {
  userId: string
  username: string
  highestScore: number
  totalGames: number
  totalLines: number
  updatedAt: string
}

type StatsRow = {
  user_id: string
  username: string
  highest_score: number
  last_score: number
  total_games: number
  total_lines: number
  avg_score: number | string
  updated_at: string
}

type SubmitScoreRow = {
  score: number
  highest_score: number
  last_score: number
  total_games: number
  total_lines: number
  avg_score: number | string
}

function fallbackName(user: User): string {
  return user.email ?? `pilot-${user.id.slice(0, 8)}`
}

export async function saveScore(user: User, result: GameResult): Promise<{ ok: boolean; message: string }> {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase 환경변수가 아직 설정되지 않았습니다.',
    }
  }

  const scoreResponse = await supabase.rpc('submit_score', {
    p_score: result.score,
    p_lines: result.lines,
    p_level: result.level,
  })

  if (scoreResponse.error) {
    return {
      ok: false,
      message: `점수 저장 RPC에 실패했습니다: ${scoreResponse.error.message}`,
    }
  }

  const summary = (scoreResponse.data?.[0] ?? null) as SubmitScoreRow | null
  const username = fallbackName(user)

  return {
    ok: true,
    message: summary
      ? `${username} 점수 ${summary.score.toLocaleString()}점을 저장했습니다. 최고 점수는 ${summary.highest_score.toLocaleString()}점입니다.`
      : `점수 ${result.score.toLocaleString()}점을 저장했습니다.`,
  }
}

export async function fetchLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  if (!supabase) {
    return []
  }

  const response = await supabase
    .from('leaderboard')
    .select('user_id, username, highest_score, last_score, total_games, total_lines, avg_score, updated_at')
    .order('highest_score', { ascending: false })
    .order('updated_at', { ascending: true })
    .limit(limit)

  if (response.error) {
    throw response.error
  }

  const rows = (response.data ?? []) as unknown as StatsRow[]
  return rows.map((row) => ({
    userId: row.user_id,
    username: row.username ?? `pilot-${row.user_id.slice(0, 8)}`,
    highestScore: row.highest_score,
    totalGames: row.total_games,
    totalLines: row.total_lines,
    updatedAt: row.updated_at,
  }))
}

export function subscribeToLeaderboard(onChange: () => void): () => void {
  const client = supabase
  if (!client) {
    return () => undefined
  }

  const channel = client
    .channel('leaderboard-feed')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stats' }, () => {
      onChange()
    })
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}