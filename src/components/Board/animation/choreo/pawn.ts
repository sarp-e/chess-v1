import { arc, crouch, land, pieceActor, type Choreography, type ChoreoContext } from '../engine'

// Pawn: a tiny hop forward; the opening two-square push is a big leap that
// swells toward the viewer at the apex and lands with a squash.
export function pawnMove({ from, to, piece, move }: ChoreoContext): Choreography {
  if (move.flags.includes('b')) {
    const frames = [
      ...crouch(0, 160, from, 0.2),
      ...arc(160, 900, from, to, 2.6, 0.45),
      ...land(900, to, 0.18, 200),
    ]
    return { duration: 1100, actors: [pieceActor('mover', piece, frames)] }
  }
  const frames = [
    ...crouch(0, 90, from),
    ...arc(90, 460, from, to, 0.45, 0.1),
    ...land(460, to, 0.1, 140),
  ]
  return { duration: 600, actors: [pieceActor('mover', piece, frames)] }
}
