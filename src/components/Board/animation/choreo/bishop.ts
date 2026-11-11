import { add, at, knockOff, lerp, pieceActor, scale, type Choreography, type ChoreoContext, type Frame } from '../engine'

// Bishop: a smooth, unhurried diagonal glide with a slight lean.
// Capture: starts at the same medium pace, then accelerates to a blur — two
// fading after-images trail it — and rams the victim off the board.
export function bishopMove({ from, to, piece, dist, dir, victim }: ChoreoContext): Choreography {
  const lean = to.x >= from.x ? 6 : -6
  if (!victim) {
    const travel = Math.min(1200, Math.max(600, 300 + 130 * dist))
    const frames = [
      at(0, from, { ease: 'cubic-bezier(.45,0,1,1)' }),
      at(travel * 0.5, lerp(from, to, 0.5), { r: lean, ease: 'cubic-bezier(0,0,.55,1)' }),
      at(travel, to),
    ]
    return { duration: travel, actors: [pieceActor('mover', piece, frames)] }
  }

  // Path progress p(t): linear for the first 30% of the path, then a
  // quadratic ease-in whose starting slope matches, ending ~5× faster.
  const T = Math.min(1200, 520 + 90 * dist)
  const tA = 0.55 * T
  const a = (0.3 * (T - tA)) / (tA * 0.7)
  const progress = (t: number) => {
    if (t <= 0) return 0
    if (t <= tA) return 0.3 * (t / tA)
    const q = Math.min(1, (t - tA) / (T - tA))
    return 0.3 + 0.7 * (a * q + (1 - a) * q * q)
  }
  const blurAt = (t: number) => (t <= tA ? 0 : 3.5 * Math.min(1, (t - tA) / (T - tA)))

  const samples = 14
  const path = (lag: number, o: number): Frame[] => {
    const out: Frame[] = []
    for (let i = 0; i <= samples; i++) {
      const t = (T * i) / samples
      const visible = t >= tA && t <= T
      out.push(at(t, lerp(from, to, progress(t - lag)), { r: lean * Math.min(1, t / tA), blur: blurAt(t), o: lag ? (visible ? o : 0) : 1 }))
    }
    return out
  }

  const mover = path(0, 1)
  mover.push(
    at(T + 70, add(to, scale(dir, 0.1)), { sx: 0.85, sy: 1.12, blur: 0, ease: 'ease-out' }),
    at(T + 320, to),
  )
  const ghost1 = [...path(45, 0.4), at(T + 60, to, { o: 0 })]
  const ghost2 = [...path(90, 0.2), at(T + 60, to, { o: 0 })]

  return {
    duration: T + 420,
    actors: [
      pieceActor('victim', victim.piece, knockOff(T, victim.at, dir, 420, 720, 0.25), 2),
      pieceActor('ghost2', piece, ghost2, 3),
      pieceActor('ghost1', piece, ghost1, 3),
      pieceActor('mover', piece, mover, 4),
    ],
  }
}
