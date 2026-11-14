import { arc, at, crouch, land, pieceActor, pieceCode, popOff, spriteActor, type Choreography, type ChoreoContext } from '../engine'

// Pawn: a tiny hop forward; the opening two-square push is a big leap that
// swells toward the viewer at the apex and lands with a squash. Captures are
// the same tiny hop onto the target while the victim pops off (en passant:
// the victim pops from its own square). Promotion ends in a flash as the new
// piece appears.
export function pawnMove(ctx: ChoreoContext): Choreography {
  const { from, to, piece, move, victim } = ctx
  if (move.flags.includes('b')) {
    const frames = [
      ...crouch(0, 160, from, 0.2),
      ...arc(160, 900, from, to, 2.6, 0.45),
      ...land(900, to, 0.18, 200),
    ]
    return { duration: 1100, actors: [pieceActor('mover', piece, frames)] }
  }

  const tLand = 460
  const frames = [
    ...crouch(0, 90, from),
    ...arc(90, tLand, from, to, victim ? 0.6 : 0.45, 0.12),
    ...(move.promotion ? [at(tLand, to, { sx: 1.1, sy: 0.9 })] : land(tLand, to, 0.1, 140)),
  ]
  const c: Choreography = { duration: 600, actors: [pieceActor('mover', piece, frames, 3)] }

  if (victim) {
    c.actors.push(pieceActor('victim', victim.piece, popOff(tLand - 20, victim.at, to.x >= from.x ? 1 : -1), 2))
    c.duration = Math.max(c.duration, tLand + 450)
  }

  if (move.promotion) {
    const t = tLand + 60
    frames.push(at(t, to, { ease: 'ease-in' }), at(t + 120, to, { s: 1.2, o: 0 }))
    c.actors.push(
      spriteActor('flash', 'flash', [at(0, to, { o: 0, s: 0.3 }), at(t, to, { o: 0, s: 0.3, ease: 'ease-out' }), at(t + 150, to, { o: 1, s: 1.4 }), at(t + 450, to, { o: 0, s: 1.8 })], 4),
      pieceActor('promoted', pieceCode(move.color, move.promotion), [
        at(0, to, { o: 0, s: 0.4 }),
        at(t + 60, to, { o: 0, s: 0.4, ease: 'ease-out' }),
        at(t + 220, to, { o: 1, s: 1.25, ease: 'ease-in-out' }),
        at(t + 380, to, { s: 1 }),
      ], 5),
    )
    c.duration = Math.max(c.duration, t + 450)
  }
  return c
}
