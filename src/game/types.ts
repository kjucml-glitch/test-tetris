export type PieceKind = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

export type BoardCell = PieceKind | null

export type Board = BoardCell[][]

export type Matrix = number[][]

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover'

export type ActivePiece = {
  kind: PieceKind
  matrix: Matrix
  row: number
  col: number
}

export type GameState = {
  board: Board
  activePiece: ActivePiece | null
  nextKind: PieceKind
  score: number
  lines: number
  level: number
  status: GameStatus
  lastCleared: number
}

export type GameResult = {
  score: number
  lines: number
  level: number
}