import { add, at, knockOff, land, pieceActor, scale, sub, walk, type Choreography, type ChoreoContext, type Frame, type Vec } from '../engine'

// Rook: runs (quick bouncy gait, legs on cburnett) to its square.
// Capture: runs up to the square before the victim, floats up off the board,
// pulls back and swings like a pendulum into the victim, knocking it off, then
// settles onto the square.
export function rookMove({ from, to, piece, dist, dir, victim, costumes }: ChoreoContext): Choreography {
  const costume = costumes ? 'legs' as const : undefined
  const runTime = (d: number) => 260 + 120 * d
  if (!victim) {
    const T = Math.min(1300, Math.max(600, runTime(dist)))
    const frames = [...walk(0, T - 120, from, to, 3, 0.08, 5), ...land(T - 120, to, 0.08, 120)]
    return { duration: T, actors: [pieceActor('mover', piece, frames, 3, costume)] }
  }

  // Run to the square in front of the victim (or stay put when adjacent).
  const stand = dist >= 2 ? sub(to, dir) : from
  const tRun = dist >= 2 ? Math.min(1000, runTime(dist - 1)) : 0
  const frames: Frame[] = dist >= 2 ? walk(0, tRun, from, stand, 3, 0.08, 5) : [at(0, from)]

  // Float: rises (scale up = toward the viewer) a little above the board.
  const lift = 1.18
  const hang = add(stand, { x: 0, y: -0.12 })
  const tFloat = tRun + 300
  frames.push(at(tRun, stand, { ease: 'ease-out' }), at(tFloat, hang, { s: lift }))

  // Pendulum around a pivot "behind" the rook (above it for sideways swings,
  // beside it for up/down swings).
  const v: Vec = dir.y === 0 ? { x: 0, y: 1 } : { x: 1, y: 0 }
  const cross = dir.x * v.y - dir.y * v.x
  const L = 1.6
  const pivot = sub(hang, scale(v, L))
  const swing = (deg: number): Vec => {
    const th = (deg * Math.PI) / 180
    return add(pivot, add(scale(dir, L * Math.sin(th)), scale(v, L * Math.cos(th))))
  }
  const pose = (t: number, deg: number, ease = 'linear'): Frame => at(t, swing(deg), { r: -deg * cross, s: lift, ease })

  const tBack = tFloat + 450
  const tHit = tBack + 260
  for (let i = 1; i <= 5; i++) frames.push(pose(tFloat + (450 * i) / 5, -38 * Math.sin((i / 5) * (Math.PI / 2))))
  for (let i = 1; i <= 5; i++) frames.push(pose(tBack + (260 * i) / 5, -38 + 70 * (i / 5) ** 1.6))
  frames.push(pose(tHit + 160, 20, 'ease-in-out'))
  frames.push(at(tHit + 420, add(to, { x: 0, y: -0.1 }), { s: 1.08, ease: 'ease-in' }))
  frames.push(...land(tHit + 560, to, 0.1, 140))

  return {
    duration: tHit + 700,
    actors: [
      pieceActor('victim', victim.piece, knockOff(tHit, victim.at, add(dir, scale(v, -0.25)), 500, 540 * (cross || 1), 0.3), 2),
      pieceActor('mover', piece, frames, 3, costume),
    ],
  }
}
