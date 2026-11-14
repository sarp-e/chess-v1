import { add, at, exitDistance, impact, pieceActor, scale, sub, walk, type Choreography, type ChoreoContext } from '../engine'

// Queen: a slow, swaying, majestic walk (in a gown on cburnett).
// Capture: walks up to the victim, winds up, punches hard, drags it to the
// edge and off the board, then walks back to her new square.
export function queenMove({ from, to, piece, dist, dir, victim, costumes }: ChoreoContext): Choreography {
  const costume = costumes ? 'gown' as const : undefined
  const walkTime = (d: number) => Math.min(1500, 600 + 160 * d)
  if (!victim) {
    const T = walkTime(dist)
    return { duration: T, actors: [pieceActor('mover', piece, walk(0, T, from, to, 1.4, 0.05, 5), 3, costume)] }
  }

  const sideSign = dir.x >= 0 ? 1 : -1
  const reach = sub(to, scale(dir, 0.62))
  const tWalk = dist > 0.62 ? Math.min(1000, walkTime(dist - 0.62) * 0.75) : 0
  const tWind = tWalk + 220
  const tHit = tWind + 110
  const edge = exitDistance(to, dir) // squares from the victim's square to off-board
  const tDrag = tHit + 180 + 110 * edge
  const dragEnd = add(to, scale(dir, Math.max(0, edge - 0.95)))
  const tBack = tDrag + 200 + 110 * Math.max(0.5, edge - 0.95)

  const queen = [
    ...walk(0, Math.max(tWalk, 1), from, reach, 1.4, 0.05, 5),
    at(tWind, sub(reach, scale(dir, 0.15)), { r: -12 * sideSign, ease: 'cubic-bezier(.6,0,1,1)' }), // wind up
    at(tHit, sub(to, scale(dir, 0.3)), { r: 10 * sideSign, s: 1.12, ease: 'ease-out' }), // punch
    at(tHit + 180, sub(to, scale(dir, 0.15)), { r: 0, s: 1.05, ease: 'ease-in' }),
    at(tDrag, dragEnd, { r: 4 * sideSign, s: 1.05, ease: 'ease-in-out' }), // drag to the edge
    at(tDrag + 200, dragEnd, { r: 0 }),
    ...walk(tDrag + 200, tBack, dragEnd, to, 1.4, 0.05, 5),
  ]

  const victimFrames = [
    at(0, to),
    at(tHit, to, { ease: 'ease-out' }),
    at(tHit + 120, add(to, scale(dir, 0.55)), { r: 25 * sideSign, s: 0.95 }), // knocked back
    at(tHit + 180, add(to, scale(dir, 0.6)), { r: 30 * sideSign, ease: 'ease-in-out' }),
    at(tDrag, add(dragEnd, scale(dir, 0.75)), { r: 60 * sideSign, ease: 'ease-in' }), // dragged
    at(tDrag + 260, add(dragEnd, scale(dir, 2.2)), { r: 220 * sideSign, o: 0 }), // flung off
  ]

  return {
    duration: Math.max(tBack, tDrag + 260),
    actors: [
      pieceActor('victim', victim.piece, victimFrames, 2),
      pieceActor('mover', piece, queen, 3, costume),
      impact(tHit, add(to, scale(dir, -0.15)), 1.3),
    ],
  }
}
