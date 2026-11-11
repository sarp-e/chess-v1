import { Chess } from 'chess.js'
import type { Move } from 'chess.js'

// ── Coordinates ──────────────────────────────────────────────────────────────
// Everything in a choreography is expressed in *screen squares*: x grows to the
// right, y grows downward, 1 unit = one board square. Overlay actors are sized
// to exactly one square, so a CSS `translate(100%, 0)` moves one square — the
// whole overlay scales with the board without measuring anything.

export interface Vec { x: number; y: number }
export type Orientation = 'white' | 'black'

export function cell(square: string, orientation: Orientation): Vec {
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1]) - 1
  return orientation === 'white' ? { x: file, y: 7 - rank } : { x: 7 - file, y: rank }
}

export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y })
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y })
export const scale = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k })
export const len = (a: Vec): number => Math.hypot(a.x, a.y)
export const unit = (a: Vec): Vec => {
  const l = len(a)
  return l === 0 ? { x: 0, y: -1 } : { x: a.x / l, y: a.y / l }
}
export const lerp = (a: Vec, b: Vec, p: number): Vec => ({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p })

/** How far (in squares) from `from` along `dir` until a piece is fully off the board. */
export function exitDistance(from: Vec, dir: Vec): number {
  const d = unit(dir)
  let best = Infinity
  if (d.x > 0) best = Math.min(best, (8 - from.x) / d.x)
  if (d.x < 0) best = Math.min(best, (from.x + 1) / -d.x)
  if (d.y > 0) best = Math.min(best, (8 - from.y) / d.y)
  if (d.y < 0) best = Math.min(best, (from.y + 1) / -d.y)
  return Number.isFinite(best) ? best : 8
}

// ── Actors & frames ──────────────────────────────────────────────────────────

/** One pose of an actor. x/y are absolute screen-square coordinates. */
export interface Frame {
  t: number // ms from the start of the choreography
  x: number
  y: number
  r?: number // rotation, deg (clockwise)
  s?: number // uniform scale
  sx?: number
  sy?: number
  o?: number // opacity
  blur?: number // px
  ease?: string // easing from this frame to the next
}

export type Costume = 'legs' | 'gown' | 'crown'
export type SpriteKind = 'impact' | 'flash' | 'handshake'

export type ActorContent =
  | { kind: 'piece'; piece: string; costume?: Costume }
  | { kind: 'sprite'; sprite: SpriteKind; tone?: 'w' | 'b' }

export interface Actor {
  id: string
  content: ActorContent
  frames: Frame[]
  z?: number
  origin?: string // CSS transform-origin
}

export interface Choreography {
  duration: number
  actors: Actor[]
}

export interface ChoreoContext {
  move: Move
  orientation: Orientation
  from: Vec
  to: Vec
  piece: string // e.g. 'wN'
  costumes: boolean // costume art only on the cburnett set
}

export const pieceCode = (color: string, type: string) => `${color}${type.toUpperCase()}`

/** Convert absolute-position frames into WAAPI keyframes relative to the actor's start cell. */
export function toKeyframes(frames: Frame[], origin: Vec, total: number): Keyframe[] {
  const fs = [...frames].sort((a, b) => a.t - b.t)
  if (fs[0].t > 0) fs.unshift({ ...fs[0], t: 0, ease: undefined })
  const last = fs[fs.length - 1]
  if (last.t < total) fs.push({ ...last, t: total })
  const hasBlur = fs.some(f => f.blur)
  return fs.map(f => {
    const k = f.s ?? 1
    const kf: Keyframe = {
      offset: Math.min(1, Math.max(0, f.t / total)),
      transform: `translate(${(f.x - origin.x) * 100}%, ${(f.y - origin.y) * 100}%) rotate(${f.r ?? 0}deg) scale(${(f.sx ?? 1) * k}, ${(f.sy ?? 1) * k})`,
      opacity: f.o ?? 1,
      easing: f.ease ?? 'linear',
    }
    if (hasBlur) kf.filter = `blur(${f.blur ?? 0}px)`
    return kf
  })
}

// ── Reusable motion pieces ───────────────────────────────────────────────────

/** A stationary pose at `p` at time t. */
export const at = (t: number, p: Vec, extra: Partial<Frame> = {}): Frame => ({ t, x: p.x, y: p.y, ...extra })

/**
 * A ballistic hop from a to b between t0 and t1, sampled so the WAAPI linear
 * interpolation traces a parabola. `grow` swells the piece at the apex (it
 * reads as coming toward the viewer); `tilt` rotates into the jump.
 */
export function arc(t0: number, t1: number, a: Vec, b: Vec, height: number, grow = 0, tilt = 0, steps = 10): Frame[] {
  const out: Frame[] = []
  for (let i = 0; i <= steps; i++) {
    const p = i / steps
    const bump = 4 * p * (1 - p)
    const pos = lerp(a, b, p)
    out.push({ t: t0 + (t1 - t0) * p, x: pos.x, y: pos.y - height * bump, s: 1 + grow * bump, r: tilt * (1 - 2 * p) })
  }
  return out
}

/** A squash-on-landing pose sequence starting at t at p. */
export function land(t: number, p: Vec, squash = 0.12, settle = 140): Frame[] {
  return [
    at(t, p, { sx: 1 + squash, sy: 1 - squash, ease: 'ease-out' }),
    at(t + settle, p),
  ]
}

/** Crouch before a jump. */
export function crouch(t0: number, t1: number, p: Vec, amount = 0.12): Frame[] {
  return [at(t0, p, { ease: 'ease-in' }), at(t1, p, { sx: 1 + amount, sy: 1 - amount })]
}

/**
 * Captured piece: sits still until `tHit`, then is knocked along `dir` until it
 * is off the board, spinning and fading at the end of its flight.
 */
export function knockOff(tHit: number, p: Vec, dir: Vec, flight = 550, spin = 540, lift = 0.6): Frame[] {
  const d = unit(dir)
  const dist = exitDistance(p, d) + 0.6
  const end = add(p, scale(d, dist))
  const mid = add(lerp(p, end, 0.5), { x: 0, y: -lift })
  return [
    at(0, p),
    at(tHit, p, { ease: 'ease-out' }),
    at(tHit + 60, add(p, scale(d, 0.12)), { s: 1.15, r: spin * 0.05 }),
    at(tHit + flight * 0.5, mid, { r: spin * 0.5, s: 1.05 }),
    at(tHit + flight * 0.85, add(p, scale(d, dist * 0.9)), { r: spin * 0.85, o: 0.9 }),
    at(tHit + flight, end, { r: spin, o: 0 }),
  ]
}

/** Captured piece that simply pops up and away (pawn captures). */
export function popOff(tHit: number, p: Vec, side: number, flight = 450): Frame[] {
  return [
    at(0, p),
    at(tHit, p, { ease: 'ease-out' }),
    at(tHit + 90, add(p, { x: 0.1 * side, y: -0.35 }), { s: 1.25, r: 40 * side }),
    at(tHit + flight, add(p, { x: 1.1 * side, y: -1.4 }), { s: 0.6, r: 300 * side, o: 0 }),
  ]
}

export const pieceActor = (id: string, piece: string, frames: Frame[], z = 2, costume?: Costume): Actor => ({
  id,
  content: { kind: 'piece', piece, costume },
  frames,
  z,
})

export const spriteActor = (id: string, sprite: SpriteKind, frames: Frame[], z = 4, tone?: 'w' | 'b'): Actor => ({
  id,
  content: { kind: 'sprite', sprite, tone },
  frames,
  z,
})

/** Impact starburst at p, popping at time t. */
export function impact(t: number, p: Vec, size = 1, id = 'impact'): Actor {
  return spriteActor(id, 'impact', [
    at(0, p, { o: 0, s: 0.2 }),
    at(t - 1, p, { o: 0, s: 0.2 }),
    at(t, p, { o: 1, s: 0.5 * size, ease: 'ease-out' }),
    at(t + 180, p, { o: 0, s: 1.3 * size, r: 30 }),
  ], 5)
}

/** Victim actor for the captured piece, if any. Returns the square it sits on. */
export function capturedSquare(move: Move): string | null {
  if (!move.captured) return null
  if (move.flags.includes('e')) return move.to[0] + move.from[1]
  return move.to
}

// ── Move detection ───────────────────────────────────────────────────────────

/**
 * The single legal move that turns prevFen into nextFen, or null when the
 * positions are not one move apart (new game, undo, jumping around review).
 * Matches on the placement field only, so clocks/castling-rights noise in the
 * FEN does not matter.
 */
export function detectMove(prevFen: string, nextFen: string): Move | null {
  if (prevFen === nextFen) return null
  try {
    const target = nextFen.split(' ')[0]
    return new Chess(prevFen).moves({ verbose: true }).find(m => m.after.split(' ')[0] === target) ?? null
  } catch {
    return null
  }
}

/** react-chessboard position object for `fen` with `squares` left empty. */
export function positionWithout(fen: string, squares: string[]): Record<string, { pieceType: string }> {
  const out: Record<string, { pieceType: string }> = {}
  for (const row of new Chess(fen).board()) {
    for (const p of row) {
      if (p && !squares.includes(p.square)) out[p.square] = { pieceType: pieceCode(p.color, p.type) }
    }
  }
  return out
}

/** Squares the real board must leave empty while the overlay plays. */
export function maskedSquares(move: Move): string[] {
  const squares: string[] = [move.to]
  if (move.flags.includes('k')) squares.push('f' + move.to[1])
  if (move.flags.includes('q')) squares.push('d' + move.to[1])
  return squares
}
