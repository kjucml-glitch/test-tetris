import { useEffect, useRef, useState } from 'react'
import { PIECE_SHAPES } from '../../game/constants.ts'
import {
  createInitialGameState,
  getDropInterval,
  hardDropActivePiece,
  moveActivePiece,
  rotateActivePiece,
  softDropActivePiece,
  startGame,
  tickGame,
  togglePause,
} from '../../game/engine.ts'
import type { GameResult, GameState, Matrix } from '../../game/types.ts'
import { GameBoard } from './GameBoard.tsx'

type SaveFeedback = {
  status: 'idle' | 'saving' | 'success' | 'error'
  message: string
}

type GamePanelProps = {
  canSubmitScores: boolean
  onGameFinished: (result: GameResult) => Promise<void> | void
  saveFeedback: SaveFeedback
}

function createPreviewGrid(matrix: Matrix): number[][] {
  const width = Math.max(4, matrix[0].length)
  const height = Math.max(4, matrix.length)
  const grid = Array.from({ length: height }, () => Array.from({ length: width }, () => 0))

  matrix.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      grid[rowIndex][colIndex] = cell
    })
  })

  return grid
}

export function GamePanel({ canSubmitScores, onGameFinished, saveFeedback }: GamePanelProps) {
  const [state, setState] = useState<GameState>(() => createInitialGameState())
  const [round, setRound] = useState(0)
  const lastReportedRound = useRef<number | null>(null)

  useEffect(() => {
    if (state.status !== 'playing') {
      return
    }

    const timer = window.setInterval(() => {
      setState((currentState) => tickGame(currentState))
    }, getDropInterval(state.level))

    return () => {
      window.clearInterval(timer)
    }
  }, [state.level, state.status])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const trackedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'p', 'P']
      if (!trackedKeys.includes(event.key)) {
        return
      }

      event.preventDefault()

      if (event.key === 'p' || event.key === 'P') {
        setState((currentState) => togglePause(currentState))
        return
      }

      setState((currentState) => {
        switch (event.key) {
          case 'ArrowLeft':
            return moveActivePiece(currentState, -1)
          case 'ArrowRight':
            return moveActivePiece(currentState, 1)
          case 'ArrowDown':
            return softDropActivePiece(currentState)
          case 'ArrowUp':
            return rotateActivePiece(currentState)
          case ' ':
            return hardDropActivePiece(currentState)
          default:
            return currentState
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (state.status !== 'gameover' || round === 0 || lastReportedRound.current === round) {
      return
    }

    lastReportedRound.current = round
    void onGameFinished({
      score: state.score,
      lines: state.lines,
      level: state.level,
    })
  }, [onGameFinished, round, state.level, state.lines, state.score, state.status])

  const nextShape = createPreviewGrid(PIECE_SHAPES[state.nextKind])

  function beginRound() {
    setRound((currentRound) => currentRound + 1)
    lastReportedRound.current = null
    setState(startGame())
  }

  return (
    <section className="panel game-panel">
      <div className="panel-heading compact">
        <div>
          <p className="eyebrow">Gameplay</p>
          <h2>Drop Engine</h2>
        </div>
        <div className="inline-actions">
          <button className="primary-button" type="button" onClick={beginRound}>
            {state.status === 'idle' ? '게임 시작' : '새 게임'}
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => setState((currentState) => togglePause(currentState))}
            disabled={state.status === 'idle' || state.status === 'gameover'}
          >
            {state.status === 'paused' ? '재개' : '일시정지'}
          </button>
        </div>
      </div>

      <div className="game-layout">
        <GameBoard state={state} />

        <div className="hud-column">
          <div className="stats-grid">
            <article>
              <span>Score</span>
              <strong>{state.score.toLocaleString()}</strong>
            </article>
            <article>
              <span>Lines</span>
              <strong>{state.lines}</strong>
            </article>
            <article>
              <span>Level</span>
              <strong>{state.level}</strong>
            </article>
            <article>
              <span>Store</span>
              <strong>{canSubmitScores ? 'Live' : 'Guest'}</strong>
            </article>
          </div>

          <div className="next-piece-card">
            <p className="mini-label">Next piece</p>
            <div className="preview-grid" aria-label={`Next piece ${state.nextKind}`}>
              {nextShape.flatMap((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <span
                    key={`${rowIndex}-${colIndex}`}
                    className={cell ? `preview-cell kind-${state.nextKind}` : 'preview-cell'}
                  />
                )),
              )}
            </div>
          </div>

          <div className="controls-card">
            <p className="mini-label">Controls</p>
            <ul>
              <li>← → 이동</li>
              <li>↑ 회전</li>
              <li>↓ 빠른 낙하</li>
              <li>Space 하드 드롭</li>
              <li>P 일시정지</li>
            </ul>
          </div>
        </div>
      </div>

      <p className={`panel-message ${saveFeedback.status}`}>{saveFeedback.message}</p>
    </section>
  )
}