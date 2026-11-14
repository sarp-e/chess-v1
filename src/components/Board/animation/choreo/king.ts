import { add, at, impact, knockOff, pieceActor, scale, sub, walk, type Choreography, type ChoreoContext } from '../engine'

// King: a stately walk (with a big bobbing crown on cburnett).
// Capture: walks up, leans back, and delivers one graceful jab — the victim
// floats away in a slow spinning arc — then steps onto the square.
export function kingMove({ from, to, piece, dist, dir, victim, costumes }: ChoreoContext): Choreography {
  const costume = costumes ? 'crown' as const : undefined
  if (!victim) {
    const T = Math.min(1400, 650 + 180 * (dist - 1))
    return { duration: T, actors: [pieceActor('mover', piece, walk(0, T, from, to, 2, 0.06, 6), 3, costume)] }
  }

  const sideSign = dir.x >= 0 ? 1 : -1
  const reach = sub(to, scale(dir, 0.55))
  const tWalk = 450
  const tLean = tWalk + 260
  const tHit = tLean + 170
  const king = [
    ...walk(0, tWalk, from, reach, 2, 0.06, 6),
    at(tLean, sub(reach, scale(dir, 0.08)), { r: -9 * sideSign, ease: 'cubic-bezier(.5,0,.3,1)' }),
    at(tHit, sub(to, scale(dir, 0.38)), { r: 7 * sideSign, ease: 'ease-in-out' }),
    at(tHit + 260, sub(to, scale(dir, 0.45)), { r: 0, ease: 'ease-in-out' }),
    ...walk(tHit + 380, tHit + 700, sub(to, scale(dir, 0.45)), to, 2, 0.05, 5),
  ]
  return {
    duration: tHit + 900,
    actors: [
      pieceActor('victim', victim.piece, knockOff(tHit, victim.at, add(dir, { x: 0, y: -0.4 }), 900, 360 * sideSign, 0.9), 2),
      pieceActor('mover', piece, king, 3, costume),
      impact(tHit, add(to, scale(dir, -0.2)), 0.7),
    ],
  }
}
