import type { PieceRenderObject } from 'react-chessboard'
import { PIECE_TYPES, PLINTH, SHAPES } from './shapes'

// Paid "glass" piece set (shop item pieceSet:glass) — the shared silhouettes cast
// in translucent tinted glass, so the square shows through.
//
// Transparency is set on the group, not on each fill: the silhouettes overlap
// (pawn head over body, crown over bell) and per-shape opacity would stack into
// dark seams at every overlap. One group-level opacity composites the whole
// piece once instead.
//
// The sheen is baked into the fill gradient rather than laid on as a separate
// highlight shape, which keeps it inside the silhouette on every piece: a bright
// band at the top, a hard stop where the "surface" turns, then a deeper tint
// below. White and black glass are pulled apart in lightness (pale ice vs deep
// midnight) and both carry a contrasting rim, so they never wash out into the
// same grey or disappear into a square.

function piece(
  id: string,
  stops: [string, string, string, string],
  rim: string,
  opacity: number,
  shapes: React.ReactNode
) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%">
      <defs>
        <linearGradient id={`glass-${id}`} gradientUnits="userSpaceOnUse" x1="16" y1="4" x2="28" y2="39">
          <stop offset="0%" stopColor={stops[0]} />
          <stop offset="34%" stopColor={stops[1]} />
          <stop offset="35%" stopColor={stops[2]} />
          <stop offset="100%" stopColor={stops[3]} />
        </linearGradient>
      </defs>
      <g
        opacity={opacity}
        style={{
          fill: `url(#glass-${id})`,
          stroke: rim,
          strokeWidth: 1.1,
          strokeLinejoin: 'round',
          strokeLinecap: 'round',
          filter: 'drop-shadow(0.6px 1.2px 1.1px rgba(0,0,0,0.45))',
        }}
      >
        {shapes}
        {PLINTH}
      </g>
    </svg>
  )
}

export const glassPieces: PieceRenderObject = Object.fromEntries(
  PIECE_TYPES.flatMap(type => [
    [
      `w${type}`,
      () =>
        piece(
          `w${type}`,
          ['#ffffff', '#e8f3ff', '#bcd8f2', '#8fb8dd'],
          '#33506b',
          0.66,
          SHAPES[type]('#33506b')
        ),
    ],
    [
      `b${type}`,
      () =>
        piece(
          `b${type}`,
          ['#6b7f99', '#33435c', '#1d2738', '#080d16'],
          '#a9c6e6',
          0.72,
          SHAPES[type]('#a9c6e6')
        ),
    ],
  ])
)
