import { Chess } from 'chess.js'

export function getMaterialScore(capturedByWhite: string[], capturedByBlack: string[]): number {
  const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 }
  const sum = (pieces: string[]) => pieces.reduce((acc, p) => acc + (values[p] ?? 0), 0)
  return sum(capturedByWhite) - sum(capturedByBlack)
}

export function formatMoveHistory(moves: string[]): Array<{ moveNumber: number; white: string; black?: string }> {
  const pairs: Array<{ moveNumber: number; white: string; black?: string }> = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    })
  }
  return pairs
}

export function pieceSymbol(piece: string): string {
  const symbols: Record<string, string> = {
    p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚',
  }
  return symbols[piece] ?? piece
}

export function isValidFen(fen: string): boolean {
  try {
    new Chess(fen)
    return true
  } catch {
    return false
  }
}
