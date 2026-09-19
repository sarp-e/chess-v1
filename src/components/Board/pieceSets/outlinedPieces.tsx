import type { PieceRenderObject } from 'react-chessboard'
import { PIECE_TYPES, PLINTH, SHAPES } from './shapes'

// Paid "outlined" piece set (shop item pieceSet:outlined) — the same silhouettes
// as the other paid sets, wrapped in a thick rim drawn in the *opposite* colour
// to the body. White pieces get an ink rim, black pieces a bone-white one, so
// both stay legible on light and dark squares alike (a plain black stroke goes
// invisible around a black piece on a dark square).
//
// The rim is a double-stroke: the whole silhouette is drawn once oversized in
// the rim colour, then the piece is drawn at normal size on top. That gives a
// crisper, more even edge than a single wide stroke, which bleeds unevenly into
// the concave parts of the knight and crown.

const RIM_WIDTH = 5
const EDGE_WIDTH = 1.2

function piece(fill: string, rim: string, shapes: React.ReactNode) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%">
      {/* oversized silhouette — becomes the rim once the body covers its middle */}
      <g
        style={{
          fill: rim,
          stroke: rim,
          strokeWidth: RIM_WIDTH,
          strokeLinejoin: 'round',
          strokeLinecap: 'round',
        }}
      >
        {shapes}
        {PLINTH}
      </g>
      <g
        style={{
          fill,
          stroke: rim,
          strokeWidth: EDGE_WIDTH,
          strokeLinejoin: 'round',
          strokeLinecap: 'round',
        }}
      >
        {shapes}
        {PLINTH}
      </g>
    </svg>
  )
}

const INK = '#16203a'
const BONE = '#f4f6fb'

export const outlinedPieces: PieceRenderObject = Object.fromEntries(
  PIECE_TYPES.flatMap(type => [
    [`w${type}`, () => piece(BONE, INK, SHAPES[type](INK))],
    [`b${type}`, () => piece(INK, BONE, SHAPES[type](BONE))],
  ])
)
