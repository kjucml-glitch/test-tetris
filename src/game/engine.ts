import {
  BASE_DROP_INTERVAL,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  MIN_DROP_INTERVAL,
  PIECE_ORDER,
  PIECE_SHAPES,
  SCORE_BY_CLEAR,
} from './constants.ts'
import type { ActivePiece, Board, GameState, Matrix, PieceKind } from './types.ts'

function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array.from({ length: BOARD_WIDTH }, () => null))
}

function cloneMatrix(matrix: Matrix): Matrix {
  return matrix.map((row) => [...row])
}

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row])
}

function randomPieceKind(): PieceKind {
  const index = Math.floor(Math.random() * PIECE_ORDER.length)
  return PIECE_ORDER[index]
}

function createPiece(kind: PieceKind): ActivePiece {
  const matrix = cloneMatrix(PIECE_SHAPES[kind])
  const col = Math.floor((BOARD_WIDTH - matrix[0].length) / 2)
  return {
    kind,
    matrix,
    row: 0,
    col,
  }
}

function hasCollision(board: Board, piece: ActivePiece): boolean {
  return piece.matrix.some((matrixRow, rowIndex) => {
    return matrixRow.some((cell, colIndex) => {
      if (!cell) {
        return false
      }

      const boardRow = piece.row + rowIndex
      const boardCol = piece.col + colIndex
      if (boardCol < 0 || boardCol >= BOARD_WIDTH || boardRow >= BOARD_HEIGHT) {
        return true
      }

      if (boardRow < 0) {
        return false
      }

      return board[boardRow][boardCol] !== null
    })
  })
}

function rotateMatrix(matrix: Matrix): Matrix {
  return matrix[0].map((_, columnIndex) => matrix.map((row) => row[columnIndex]).reverse())
}

function mergePiece(board: Board, piece: ActivePiece): Board {
  const mergedBoard = cloneBoard(board)

  piece.matrix.forEach((matrixRow, rowIndex) => {
    matrixRow.forEach((cell, colIndex) => {
      if (!cell) {
        return
      }

      const boardRow = piece.row + rowIndex
      const boardCol = piece.col + colIndex
      if (boardRow >= 0 && boardRow < BOARD_HEIGHT && boardCol >= 0 && boardCol < BOARD_WIDTH) {
        mergedBoard[boardRow][boardCol] = piece.kind
      }
    })
  })

  return mergedBoard
}

function clearLines(board: Board): { board: Board; cleared: number } {
  const nextRows = board.filter((row) => row.some((cell) => cell === null))
  const cleared = BOARD_HEIGHT - nextRows.length

  if (!cleared) {
    return { board, cleared: 0 }
  }

  const emptyRows = Array.from({ length: cleared }, () => Array.from({ length: BOARD_WIDTH }, () => null))
  return {
    board: [...emptyRows, ...nextRows],
    cleared,
  }
}

function levelForLines(lines: number): number {
  return Math.floor(lines / 10) + 1
}

function scoreForClear(cleared: number, level: number): number {
  return SCORE_BY_CLEAR[cleared] * level
}

function spawnFromNext(state: GameState): GameState {
  const activePiece = createPiece(state.nextKind)
  const nextKind = randomPieceKind()
  const tentativeState: GameState = {
    ...state,
    activePiece,
    nextKind,
  }

  if (hasCollision(tentativeState.board, activePiece)) {
    return {
      ...tentativeState,
      activePiece: null,
      status: 'gameover',
    }
  }

  return tentativeState
}

function lockActivePiece(state: GameState): GameState {
  if (!state.activePiece) {
    return state
  }

  const mergedBoard = mergePiece(state.board, state.activePiece)
  const clearedResult = clearLines(mergedBoard)
  const lines = state.lines + clearedResult.cleared
  const level = levelForLines(lines)
  const score = state.score + scoreForClear(clearedResult.cleared, state.level)

  return spawnFromNext({
    ...state,
    board: clearedResult.board,
    score,
    lines,
    level,
    lastCleared: clearedResult.cleared,
    activePiece: null,
    status: 'playing',
  })
}

export function createInitialGameState(): GameState {
  return {
    board: createEmptyBoard(),
    activePiece: null,
    nextKind: randomPieceKind(),
    score: 0,
    lines: 0,
    level: 1,
    status: 'idle',
    lastCleared: 0,
  }
}

export function startGame(): GameState {
  return spawnFromNext({
    board: createEmptyBoard(),
    activePiece: null,
    nextKind: randomPieceKind(),
    score: 0,
    lines: 0,
    level: 1,
    status: 'playing',
    lastCleared: 0,
  })
}

export function getDropInterval(level: number): number {
  return Math.max(MIN_DROP_INTERVAL, BASE_DROP_INTERVAL - (level - 1) * 55)
}

export function moveActivePiece(state: GameState, deltaCol: number): GameState {
  if (state.status !== 'playing' || !state.activePiece) {
    return state
  }

  const nextPiece = { ...state.activePiece, col: state.activePiece.col + deltaCol }
  if (hasCollision(state.board, nextPiece)) {
    return state
  }

  return {
    ...state,
    activePiece: nextPiece,
  }
}

export function rotateActivePiece(state: GameState): GameState {
  if (state.status !== 'playing' || !state.activePiece) {
    return state
  }

  const rotated = rotateMatrix(state.activePiece.matrix)
  const kicks = [0, -1, 1, -2, 2]

  for (const kick of kicks) {
    const rotatedPiece: ActivePiece = {
      ...state.activePiece,
      matrix: rotated,
      col: state.activePiece.col + kick,
    }

    if (!hasCollision(state.board, rotatedPiece)) {
      return {
        ...state,
        activePiece: rotatedPiece,
      }
    }
  }

  return state
}

export function softDropActivePiece(state: GameState): GameState {
  if (state.status !== 'playing' || !state.activePiece) {
    return state
  }

  const nextPiece = { ...state.activePiece, row: state.activePiece.row + 1 }
  if (hasCollision(state.board, nextPiece)) {
    return lockActivePiece(state)
  }

  return {
    ...state,
    activePiece: nextPiece,
    score: state.score + 1,
  }
}

export function hardDropActivePiece(state: GameState): GameState {
  if (state.status !== 'playing' || !state.activePiece) {
    return state
  }

  let piece = state.activePiece
  let distance = 0

  while (!hasCollision(state.board, { ...piece, row: piece.row + 1 })) {
    piece = { ...piece, row: piece.row + 1 }
    distance += 1
  }

  return lockActivePiece({
    ...state,
    activePiece: piece,
    score: state.score + distance * 2,
  })
}

export function tickGame(state: GameState): GameState {
  if (state.status !== 'playing' || !state.activePiece) {
    return state
  }

  const nextPiece = { ...state.activePiece, row: state.activePiece.row + 1 }
  if (hasCollision(state.board, nextPiece)) {
    return lockActivePiece(state)
  }

  return {
    ...state,
    activePiece: nextPiece,
    lastCleared: 0,
  }
}

export function togglePause(state: GameState): GameState {
  if (state.status === 'playing') {
    return {
      ...state,
      status: 'paused',
    }
  }

  if (state.status === 'paused') {
    return {
      ...state,
      status: 'playing',
    }
  }

  return state
}

export function getRenderableBoard(state: GameState): Board {
  const board = cloneBoard(state.board)
  const { activePiece } = state
  if (!activePiece) {
    return board
  }

  activePiece.matrix.forEach((matrixRow, rowIndex) => {
    matrixRow.forEach((cell, colIndex) => {
      if (!cell) {
        return
      }

      const boardRow = activePiece.row + rowIndex
      const boardCol = activePiece.col + colIndex
      if (boardRow >= 0 && boardRow < BOARD_HEIGHT && boardCol >= 0 && boardCol < BOARD_WIDTH) {
        board[boardRow][boardCol] = activePiece.kind
      }
    })
  })

  return board
}