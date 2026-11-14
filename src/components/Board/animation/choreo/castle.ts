import { add, arc, at, cell, land, lerp, pieceActor, pieceCode, scale, spriteActor, sub, unit, walk, type Choreography, type ChoreoContext, type Frame } from '../engine'

// Castling: king and rook walk toward each other, meet in the middle and
// shake hands, then trade places — the rook walks under while the king hops
// over it — to their final squares.
export function castle({ move, orientation, from, to, piece, costumes }: ChoreoContext): Choreography {
  const kingside = move.flags.includes('k')
  const rank = move.from[1]
  const rookFrom = cell((kingside ? 'h' : 'a') + rank, orientation)
  const rookTo = cell((kingside ? 'f' : 'd') + rank, orientation)
  const rook = pieceCode(move.color, 'r')

  const u = unit(sub(rookFrom, from))
  const mid = lerp(from, rookFrom, 0.5)
  const kMeet = sub(mid, scale(u, 0.42))
  const rMeet = add(mid, scale(u, 0.42))

  const tMeet = 650
  const tShake = tMeet + 700
  const tEnd = tShake + 600

  // Three pumps of the handshake; both pieces bob along with it.
  const pump = (p: typeof mid, amp: number): Frame[] =>
    [0, 1, 2, 3, 4, 5].map(i => at(tMeet + 100 + i * 100, add(p, { x: 0, y: i % 2 === 0 ? -amp : amp * 0.5 }), { ease: 'ease-in-out' }))

  const king: Frame[] = [
    ...walk(0, tMeet, from, kMeet, 2, 0.06, 6),
    ...pump(kMeet, 0.04),
    at(tShake, kMeet, { ease: 'ease-in' }),
    ...arc(tShake + 80, tEnd - 120, kMeet, to, 0.8, 0.2, u.x > 0 ? -10 : 10),
    ...land(tEnd - 120, to, 0.1, 120),
  ]
  const rookFrames: Frame[] = [
    ...walk(0, tMeet, rookFrom, rMeet, 3, 0.07, 5),
    ...pump(rMeet, 0.04),
    at(tShake, rMeet),
    ...walk(tShake + 80, tEnd - 60, rMeet, rookTo, 3, 0.07, 5),
  ]
  const shakeAt = add(mid, { x: 0, y: 0.08 })
  const hands: Frame[] = [
    at(0, shakeAt, { o: 0, s: 0.3 }),
    at(tMeet - 40, shakeAt, { o: 0, s: 0.3, ease: 'ease-out' }),
    at(tMeet + 60, shakeAt, { o: 1, s: 0.8 }),
    ...pump(shakeAt, 0.1).map(f => ({ ...f, s: 0.8 })),
    at(tShake - 60, shakeAt, { s: 0.8, ease: 'ease-in' }),
    at(tShake + 60, shakeAt, { o: 0, s: 0.5 }),
  ]

  return {
    duration: tEnd,
    actors: [
      pieceActor('rook', rook, rookFrames, 2, costumes ? 'legs' : undefined),
      pieceActor('mover', piece, king, 3, costumes ? 'crown' : undefined),
      spriteActor('hands', 'handshake', hands, 4, move.color as 'w' | 'b'),
    ],
  }
}
