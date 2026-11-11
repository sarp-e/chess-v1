import type { Move } from 'chess.js'
import {
  at,
  capturedSquare,
  cell,
  len,
  pieceActor,
  pieceCode,
  sub,
  type Choreography,
  type ChoreoContext,
  type Orientation,
  type Vec,
} from '../engine'
import { pawnMove } from './pawn'
import { knightMove } from './knight'
import { bishopMove } from './bishop'

function slide(id: string, piece: string, a: Vec, b: Vec, t0 = 0): Choreography {
  const travel = Math.max(400, 250 + 120 * len(sub(b, a)))
  return {
    duration: t0 + travel,
    actors: [pieceActor(id, piece, [at(t0, a, { ease: 'ease-in-out' }), at(t0 + travel, b)])],
  }
}

export function choreograph(move: Move, orientation: Orientation, costumes: boolean): Choreography {
  const ctx: ChoreoContext = {
    move,
    orientation,
    from: cell(move.from, orientation),
    to: cell(move.to, orientation),
    piece: pieceCode(move.color, move.piece),
    costumes,
  }

  if (move.flags.includes('k') || move.flags.includes('q')) {
    const rank = move.from[1]
    const rookFrom = cell((move.flags.includes('k') ? 'h' : 'a') + rank, orientation)
    const rookTo = cell((move.flags.includes('k') ? 'f' : 'd') + rank, orientation)
    const king = slide('mover', ctx.piece, ctx.from, ctx.to)
    const rook = slide('rook', pieceCode(move.color, 'r'), rookFrom, rookTo)
    return { duration: Math.max(king.duration, rook.duration), actors: [...king.actors, ...rook.actors] }
  }

  let c: Choreography
  switch (move.piece) {
    case 'p': c = pawnMove(ctx); break
    case 'n': c = knightMove(ctx); break
    case 'b': c = bishopMove(ctx); break
    default: c = slide('mover', ctx.piece, ctx.from, ctx.to)
  }

  // Until each piece has its own capture routine, the victim just fades as
  // the attacker arrives.
  const victimSq = capturedSquare(move)
  if (victimSq) {
    const p = cell(victimSq, orientation)
    const hit = c.duration * 0.8
    c.actors.unshift(pieceActor('victim', pieceCode(move.color === 'w' ? 'b' : 'w', move.captured!), [
      at(0, p),
      at(hit, p, { ease: 'ease-out' }),
      at(c.duration, p, { o: 0, s: 0.6 }),
    ], 1))
  }
  return c
}
