import type { Move } from 'chess.js'
import {
  capturedSquare,
  cell,
  len,
  pieceCode,
  sub,
  unit,
  type Choreography,
  type ChoreoContext,
  type Orientation,
} from '../engine'
import { pawnMove } from './pawn'
import { knightMove } from './knight'
import { bishopMove } from './bishop'
import { rookMove } from './rook'
import { queenMove } from './queen'
import { kingMove } from './king'
import { castle } from './castle'

export function choreograph(move: Move, orientation: Orientation, costumes: boolean): Choreography {
  const from = cell(move.from, orientation)
  const to = cell(move.to, orientation)
  const victimSq = capturedSquare(move)
  const ctx: ChoreoContext = {
    move,
    orientation,
    from,
    to,
    piece: pieceCode(move.color, move.piece),
    costumes,
    dir: unit(sub(to, from)),
    dist: len(sub(to, from)),
    victim: victimSq
      ? { piece: pieceCode(move.color === 'w' ? 'b' : 'w', move.captured!), at: cell(victimSq, orientation) }
      : null,
  }

  if (move.flags.includes('k') || move.flags.includes('q')) return castle(ctx)

  switch (move.piece) {
    case 'p': return pawnMove(ctx)
    case 'n': return knightMove(ctx)
    case 'b': return bishopMove(ctx)
    case 'r': return rookMove(ctx)
    case 'q': return queenMove(ctx)
    default: return kingMove(ctx)
  }
}
