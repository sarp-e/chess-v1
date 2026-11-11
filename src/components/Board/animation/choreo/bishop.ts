import { at, len, lerp, sub, pieceActor, type Choreography, type ChoreoContext } from '../engine'

// Bishop: a smooth, unhurried diagonal glide with a slight lean.
export function bishopMove({ from, to, piece }: ChoreoContext): Choreography {
  const travel = Math.min(1200, Math.max(600, 300 + 130 * len(sub(to, from))))
  const lean = to.x >= from.x ? 6 : -6
  const frames = [
    at(0, from, { ease: 'cubic-bezier(.45,0,1,1)' }),
    at(travel * 0.5, lerp(from, to, 0.5), { r: lean, ease: 'cubic-bezier(0,0,.55,1)' }),
    at(travel, to),
  ]
  return { duration: travel, actors: [pieceActor('mover', piece, frames)] }
}
