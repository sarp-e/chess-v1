import type { Move } from 'chess.js'
import {
  at,
  capturedSquare,
  cell,
  len,
  pieceActor,
  pieceCode,
  sub,
  unit,
  type Choreography,
  type ChoreoContext,
  type Orientation,
  type Vec,
} from '../engine'
import { pawnMove } from './pawn'
import { knightMove } from './knight'
import { bishopMove } from './bishop'
import { rookMove } from './rook'
import { queenMove } from './queen'
import { kingMove } from './king'

function slide(id: string, piece: string, a: Vec, b: Vec, t0 = 0): Choreography {
  const travel = Math.max(400, 250 + 120 * len(sub(b, a)))
  return {
    duration: t0 + travel,
    actors: [pieceActor(id, piece, [at(t0, a, { ease: 'ease-in-out' }), at(t0 + travel, b)])],
  }
}

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

  if (move.flags.includes('k') || move.flags.includes('q')) {
    const rank = move.from[1]
    const rookFrom = cell((move.flags.includes('k') ? 'h' : 'a') + rank, orientation)
    const rookTo = cell((move.flags.includes('k') ? 'f' : 'd') + rank, orientation)
    const king = slide('mover', ctx.piece, ctx.from, ctx.to)
    const rook = slide('rook', pieceCode(move.color, 'r'), rookFrom, rookTo)
    return { duration: Math.max(king.duration, rook.duration), actors: [...king.actors, ...rook.actors] }
  }

  switch (move.piece) {
    case 'p': return pawnMove(ctx)
    case 'n': return knightMove(ctx)
    case 'b': return bishopMove(ctx)
    case 'r': return rookMove(ctx)
    case 'q': return queenMove(ctx)
    default: return kingMove(ctx)
  }
}
