import type { PieceRenderObject } from 'react-chessboard'
import { PIECE_TYPES, PLINTH, SHAPES } from './shapes'

// Paid "sculpted" piece set (shop item pieceSet:sculpted) — the shared
// silhouettes given a pseudo-3D relief.
//
// Depth is a stack of copies of the silhouette, each nudged one small step
// further down-right in a darker shade of the body colour and drawn *under* the
// lit top face, so the copies fuse into what reads as a solid side wall rather
// than one offset ghost. The steps are drawn as transforms in viewBox units
// rather than as a chain of CSS drop-shadow() filters: filter lengths resolve
// against the rendered pixel size, which at board scale blows the extrusion out
// into a long hard shadow instead of a short relief.
//
// A blurred ellipse on the plinth line (y=36-39) is the cast shadow that plants
// the piece on its square, and a diagonal gradient on the top face gives it a
// lit upper-left and a shaded lower-right.

const STEPS = 5
const STEP = 0.55

function piece(id: string, top: string, bottom: string, side: string, edge: string, shapes: React.ReactNode) {
  const body = (
    <>
      {shapes}
      {PLINTH}
    </>
  )
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%">
      <defs>
        <linearGradient id={`sculpt-face-${id}`} gradientUnits="userSpaceOnUse" x1="14" y1="4" x2="30" y2="39">
          <stop offset="0%" stopColor={top} />
          <stop offset="100%" stopColor={bottom} />
        </linearGradient>
        <filter id={`sculpt-cast-${id}`} x="-40%" y="-300%" width="180%" height="700%">
          <feGaussianBlur stdDeviation="1.1" />
        </filter>
      </defs>
      {/* cast shadow on the square, under the piece's footprint */}
      <ellipse cx="23.5" cy="39" rx="13.5" ry="1.9" fill="rgba(0,0,0,0.35)" filter={`url(#sculpt-cast-${id})`} />
      {/* extruded side wall */}
      {Array.from({ length: STEPS }, (_, i) => STEPS - i).map(step => (
        <g
          key={step}
          transform={`translate(${(step * STEP).toFixed(2)}, ${(step * STEP).toFixed(2)})`}
          style={{ fill: side, stroke: side, strokeWidth: 0.9, strokeLinejoin: 'round', strokeLinecap: 'round' }}
        >
          {body}
        </g>
      ))}
      {/* lit top face */}
      <g
        style={{
          fill: `url(#sculpt-face-${id})`,
          stroke: edge,
          strokeWidth: 0.9,
          strokeLinejoin: 'round',
          strokeLinecap: 'round',
        }}
      >
        {body}
      </g>
    </svg>
  )
}

export const sculptedPieces: PieceRenderObject = Object.fromEntries(
  PIECE_TYPES.flatMap(type => [
    [`w${type}`, () => piece(`w${type}`, '#ffffff', '#c4c7cf', '#8b8e97', '#4e525d', SHAPES[type]('#3a3d46'))],
    [`b${type}`, () => piece(`b${type}`, '#636673', '#26282f', '#0f1015', '#000000', SHAPES[type]('#d8dae2'))],
  ])
)
