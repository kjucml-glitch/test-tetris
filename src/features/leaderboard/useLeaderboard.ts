import { useEffect, useState } from 'react'
import { fetchLeaderboard, subscribeToLeaderboard, type LeaderboardEntry } from '../../lib/api.ts'
import { isSupabaseConfigured } from '../../lib/supabase.ts'

type LeaderboardState = {
  entries: LeaderboardEntry[]
  isLoading: boolean
  error: string | null
}

export function useLeaderboard(limit = 8): LeaderboardState {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setEntries([])
      setIsLoading(false)
      setError(null)
      return
    }

    let isActive = true

    async function loadLeaderboard() {
      setIsLoading(true)
      try {
        const nextEntries = await fetchLeaderboard(limit)
        if (!isActive) {
          return
        }

        setEntries(nextEntries)
        setError(null)
      } catch (loadError) {
        if (!isActive) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : '리더보드를 불러오지 못했습니다.')
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadLeaderboard()
    const unsubscribe = subscribeToLeaderboard(() => {
      void loadLeaderboard()
    })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [limit])

  return { entries, isLoading, error }
}