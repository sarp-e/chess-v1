import { add, arc, at, crouch, knockOff, land, pieceActor, type Choreography, type ChoreoContext } from '../engine'

// Knight: crouch, then a high arc over whatever is in the way, leaning into
// the jump, swelling at the apex, and landing with a squash.
// Capture: the arc lands *on top of* the victim, the knight bounces once,
// kicks it off the board, and drops onto the square.
export function knightMove({ from, to, piece, victim }: ChoreoContext): Choreography {
  const side = to.x >= from.x ? 1 : -1
  const tilt = -14 * side
  if (!victim) {
    const frames = [
      ...crouch(0, 110, from, 0.14),
      ...arc(110, 680, from, to, 1.3, 0.3, tilt),
      ...land(680, to, 0.14, 170),
    ]
    return { duration: 850, actors: [pieceActor('mover', piece, frames, 3)] }
  }

  const perch = add(to, { x: 0, y: -0.42 })
  const tKick = 1000
  const frames = [
    ...crouch(0, 110, from, 0.14),
    ...arc(110, 680, from, perch, 1.2, 0.3, tilt),
    at(680, perch, { sx: 1.12, sy: 0.88, ease: 'ease-out' }),
    at(780, add(perch, { x: 0, y: -0.12 }), { ease: 'ease-in' }),
    at(880, perch, { ease: 'ease-in' }),
    at(tKick - 60, perch, { r: 14 * side }), // wind up
    at(tKick, add(perch, { x: 0.1 * side, y: 0 }), { r: -26 * side, ease: 'ease-in' }), // kick
    at(tKick + 120, perch, { r: -10 * side, ease: 'ease-in' }),
    ...land(tKick + 300, to, 0.14, 160),
  ]
  return {
    duration: tKick + 460,
    actors: [
      pieceActor('victim', victim.piece, knockOff(tKick, victim.at, { x: side, y: 0.35 }, 560, 600 * side, 0.4), 2),
      pieceActor('mover', piece, frames, 3),
    ],
  }
}
