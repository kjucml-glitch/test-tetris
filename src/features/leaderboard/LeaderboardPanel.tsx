import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { useLeaderboard } from './useLeaderboard.ts'

export function LeaderboardPanel() {
  const { entries, error, isLoading } = useLeaderboard()

  return (
    <section className="panel leaderboard-panel">
      <div className="panel-heading">
        <p className="eyebrow">Realtime</p>
        <h2>Leaderboard Feed</h2>
      </div>

      {!isSupabaseConfigured ? (
        <div className="empty-state">
          <p>연동 전에는 로컬 플레이만 가능합니다.</p>
          <p className="muted">환경변수를 넣고 Supabase SQL을 적용하면 순위표가 활성화됩니다.</p>
        </div>
      ) : isLoading ? (
        <div className="empty-state">
          <p>리더보드를 불러오는 중입니다...</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <p>리더보드를 아직 읽지 못했습니다.</p>
          <p className="muted">{error}</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <p>첫 점수를 기다리는 중입니다.</p>
          <p className="muted">로그인 후 게임을 한 판 끝내면 순위표가 채워집니다.</p>
        </div>
      ) : (
        <ol className="leaderboard-list">
          {entries.map((entry, index) => (
            <li key={entry.userId} className="leaderboard-row">
              <span className="rank">#{index + 1}</span>
              <div>
                <strong>{entry.username}</strong>
                <p>{entry.totalGames} games · {entry.totalLines} lines</p>
              </div>
              <span className="score">{entry.highestScore.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}