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
  highest_score: number | null
  total_games: number | null
  total_lines: number | null
  avg_score: number | string | null
}

type LeaderboardRow = {
  user_id: string
  highest_score: number
  total_games: number
  total_lines: number
  updated_at: string
  profiles: {
    username: string | null
  } | null
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

  const username = fallbackName(user)
  const profileResponse = await supabase.from('profiles').upsert(
    {
      id: user.id,
      username,
    },
    {
      onConflict: 'id',
    },
  )

  if (profileResponse.error) {
    return {
      ok: false,
      message: `프로필 초기화에 실패했습니다: ${profileResponse.error.message}`,
    }
  }

  const scoreResponse = await supabase.from('scores').insert({
    user_id: user.id,
    score: result.score,
    lines: result.lines,
    level: result.level,
  })

  if (scoreResponse.error) {
    return {
      ok: false,
      message: `점수 저장에 실패했습니다: ${scoreResponse.error.message}`,
    }
  }

  const statsResponse = await supabase
    .from('user_stats')
    .select('highest_score, total_games, total_lines, avg_score')
    .eq('user_id', user.id)
    .maybeSingle<StatsRow>()

  if (statsResponse.error) {
    return {
      ok: false,
      message: `통계 조회에 실패했습니다: ${statsResponse.error.message}`,
    }
  }

  const previousGames = statsResponse.data?.total_games ?? 0
  const previousLines = statsResponse.data?.total_lines ?? 0
  const previousHighest = statsResponse.data?.highest_score ?? 0
  const previousAverage = Number(statsResponse.data?.avg_score ?? 0)
  const nextGames = previousGames + 1
  const nextHighest = Math.max(previousHighest, result.score)
  const nextLines = previousLines + result.lines
  const nextAverage = (previousAverage * previousGames + result.score) / nextGames

  const upsertResponse = await supabase.from('user_stats').upsert(
    {
      user_id: user.id,
      highest_score: nextHighest,
      total_games: nextGames,
      total_lines: nextLines,
      avg_score: Number(nextAverage.toFixed(2)),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id',
    },
  )

  if (upsertResponse.error) {
    return {
      ok: false,
      message: `통계 업데이트에 실패했습니다: ${upsertResponse.error.message}`,
    }
  }

  return {
    ok: true,
    message: `점수 ${result.score.toLocaleString()}점을 저장했습니다.`,
  }
}

export async function fetchLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  if (!supabase) {
    return []
  }

  const response = await supabase
    .from('user_stats')
    .select('user_id, highest_score, total_games, total_lines, updated_at, profiles(username)')
    .order('highest_score', { ascending: false })
    .order('updated_at', { ascending: true })
    .limit(limit)

  if (response.error) {
    throw response.error
  }

  const rows = (response.data ?? []) as unknown as LeaderboardRow[]
  return rows.map((row) => ({
    userId: row.user_id,
    username: row.profiles?.username ?? `pilot-${row.user_id.slice(0, 8)}`,
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