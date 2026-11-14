import { useLayoutEffect, useMemo, useRef } from 'react'
import type { Move } from 'chess.js'
import type { PieceRenderObject } from 'react-chessboard'
import { toKeyframes, type Actor, type Orientation } from './engine'
import { choreograph } from './choreo'
import { Sprite } from './sprites'
import { CostumedPiece } from './costumes'

interface Props {
  move: Move
  orientation: Orientation
  pieces: PieceRenderObject
  costumes: boolean
  onDone: () => void
}

// Absolutely positioned layer over the board. Each actor is a one-square box
// placed on its starting cell and driven by the Web Animations API, so the
// whole show runs off the main React render loop. Unmounting the overlay
// (new position arrived) cancels every running animation instantly.
export default function AnimationOverlay({ move, orientation, pieces, costumes, onDone }: Props) {
  const choreo = useMemo(() => choreograph(move, orientation, costumes), [move, orientation, costumes])
  const refs = useRef(new Map<string, HTMLDivElement>())
  const doneRef = useRef(onDone)
  useLayoutEffect(() => { doneRef.current = onDone })

  const total = Math.max(choreo.duration, ...choreo.actors.flatMap(a => a.frames.map(f => f.t)))

  useLayoutEffect(() => {
    const running: Animation[] = []
    for (const actor of choreo.actors) {
      const el = refs.current.get(actor.id)
      if (!el) continue
      running.push(el.animate(toKeyframes(actor.frames, start(actor), total), { duration: total, fill: 'forwards' }))
    }
    let cancelled = false
    Promise.all(running.map(a => a.finished))
      .then(() => { if (!cancelled) doneRef.current() })
      .catch(() => { /* cancelled by an interrupting position */ })
    return () => {
      cancelled = true
      running.forEach(a => a.cancel())
    }
  }, [choreo, total])

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }} aria-hidden>
      {choreo.actors.map(actor => {
        const s = start(actor)
        return (
          <div
            key={actor.id}
            style={{
              position: 'absolute',
              left: `${s.x * 12.5}%`,
              top: `${s.y * 12.5}%`,
              width: '12.5%',
              height: '12.5%',
              zIndex: actor.z ?? 2,
            }}
          >
            <div
              ref={el => { if (el) refs.current.set(actor.id, el); else refs.current.delete(actor.id) }}
              style={{ width: '100%', height: '100%', transformOrigin: actor.origin ?? '50% 50%', willChange: 'transform' }}
            >
              {actor.content.kind === 'piece'
                ? <CostumedPiece pieces={pieces} piece={actor.content.piece} costume={costumes ? actor.content.costume : undefined} />
                : <Sprite kind={actor.content.sprite} tone={actor.content.tone} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function start(actor: Actor) {
  const f = [...actor.frames].sort((a, b) => a.t - b.t)[0]
  return { x: f.x, y: f.y }
}
