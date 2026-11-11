import { arc, crouch, land, pieceActor, type Choreography, type ChoreoContext } from '../engine'

// Knight: crouch, then a high arc over whatever is in the way, leaning into
// the jump, swelling at the apex, and landing with a squash.
export function knightMove({ from, to, piece }: ChoreoContext): Choreography {
  const tilt = to.x >= from.x ? -14 : 14
  const frames = [
    ...crouch(0, 110, from, 0.14),
    ...arc(110, 680, from, to, 1.3, 0.3, tilt),
    ...land(680, to, 0.14, 170),
  ]
  return { duration: 850, actors: [pieceActor('mover', piece, frames, 3)] }
}
