import { useEffect, useRef } from 'react'
import { BOARD_HEIGHT, BOARD_WIDTH, CELL_SIZE, PIECE_COLORS } from '../../game/constants.ts'
import { getRenderableBoard } from '../../game/engine.ts'
import type { GameState } from '../../game/types.ts'

type GameBoardProps = {
  state: GameState
}

export function GameBoard({ state }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    const board = getRenderableBoard(state)
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#05131d'
    context.fillRect(0, 0, canvas.width, canvas.height)

    board.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = colIndex * CELL_SIZE
        const y = rowIndex * CELL_SIZE

        context.fillStyle = cell ? PIECE_COLORS[cell] : '#0d2230'
        context.fillRect(x, y, CELL_SIZE - 1, CELL_SIZE - 1)

        if (cell) {
          context.fillStyle = 'rgba(255, 255, 255, 0.18)'
          context.fillRect(x + 3, y + 3, CELL_SIZE - 10, 6)
        }
      })
    })
  }, [state])

  return (
    <div className="board-shell">
      <canvas
        ref={canvasRef}
        width={BOARD_WIDTH * CELL_SIZE}
        height={BOARD_HEIGHT * CELL_SIZE}
        aria-label="Tetris board"
      />
      {state.status !== 'playing' ? (
        <div className="board-overlay">
          <strong>
            {state.status === 'idle' && 'Ready'}
            {state.status === 'paused' && 'Paused'}
            {state.status === 'gameover' && 'Game Over'}
          </strong>
          <span>
            {state.status === 'idle' && 'Start mission to drop the first block.'}
            {state.status === 'paused' && 'Press P or resume to continue.'}
            {state.status === 'gameover' && 'Restart to chase a higher score.'}
          </span>
        </div>
      ) : null}
    </div>
  )
}