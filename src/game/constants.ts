import type { Matrix, PieceKind } from './types.ts'

export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20
export const CELL_SIZE = 28
export const BASE_DROP_INTERVAL = 700
export const MIN_DROP_INTERVAL = 120

export const SCORE_BY_CLEAR: Record<number, number> = {
  0: 0,
  1: 100,
  2: 300,
  3: 500,
  4: 800,
}

export const PIECE_SHAPES: Record<PieceKind, Matrix> = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
}

export const PIECE_COLORS: Record<PieceKind, string> = {
  I: '#66f2ff',
  O: '#ffd166',
  T: '#d289ff',
  S: '#4ddb8c',
  Z: '#ff7b8f',
  J: '#77a7ff',
  L: '#ffab5c',
}

export const PIECE_ORDER = Object.keys(PIECE_SHAPES) as PieceKind[]