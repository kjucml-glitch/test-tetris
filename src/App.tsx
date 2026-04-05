import { useEffect, useState } from 'react'
import './App.css'
import { AuthPanel } from './features/auth/AuthPanel.tsx'
import { useAuth } from './features/auth/useAuth.ts'
import { GamePanel } from './features/game/GamePanel.tsx'
import { LeaderboardPanel } from './features/leaderboard/LeaderboardPanel.tsx'
import type { GameResult } from './game/types.ts'
import { saveScore } from './lib/api.ts'
import { getSupabaseSetupMessage, isSupabaseConfigured } from './lib/supabase.ts'

type SaveFeedback = {
  status: 'idle' | 'saving' | 'success' | 'error'
  message: string
}

function App() {
  const { user } = useAuth()
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback>({
    status: 'idle',
    message: '로그인하면 최고 점수와 플레이 기록을 저장할 수 있습니다.',
  })

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSaveFeedback({
        status: 'idle',
        message: getSupabaseSetupMessage(),
      })
      return
    }

    if (user) {
      setSaveFeedback({
        status: 'idle',
        message: '로그인됨. 게임이 끝나면 점수를 Supabase에 저장합니다.',
      })
      return
    }

    setSaveFeedback({
      status: 'idle',
      message: '게스트로도 플레이할 수 있지만 점수 저장은 로그인 후에만 가능합니다.',
    })
  }, [user])

  async function handleGameFinished(result: GameResult) {
    if (!user) {
      setSaveFeedback({
        status: 'idle',
        message: '로그인 후 다시 플레이하면 현재 최고 점수를 리더보드에 올릴 수 있습니다.',
      })
      return
    }

    setSaveFeedback({
      status: 'saving',
      message: '점수를 저장하는 중입니다...',
    })

    const response = await saveScore(user, result)
    setSaveFeedback({
      status: response.ok ? 'success' : 'error',
      message: response.message,
    })
  }

  return (
    <div className="app-shell">
      <header className="hero-panel panel">
        <div>
          <p className="eyebrow">Vite + React + Supabase</p>
          <h1>Signal Stack Tetris</h1>
          <p className="hero-copy">
            클라이언트에서 즉시 플레이 가능한 테트리스 코어와, 로그인 및 리더보드를
            붙일 Supabase 배포 뼈대를 함께 시작했습니다.
          </p>
        </div>
        <div className="hero-meta">
          <span className={`status-pill ${isSupabaseConfigured ? 'online' : 'offline'}`}>
            {isSupabaseConfigured ? 'Supabase ready' : 'Supabase pending'}
          </span>
          <p>
            현재 버전은 게임 엔진, 인증 UI, 리더보드 구독, Supabase 마이그레이션 초안을
            포함합니다.
          </p>
        </div>
      </header>

      <main className="content-grid">
        <section className="play-column">
          <GamePanel
            canSubmitScores={Boolean(user)}
            onGameFinished={handleGameFinished}
            saveFeedback={saveFeedback}
          />
        </section>

        <aside className="side-column">
          <AuthPanel />
          <LeaderboardPanel />
        </aside>
      </main>
    </div>
  )
}

export default App
