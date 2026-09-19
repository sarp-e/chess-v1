import type { PieceRenderObject } from 'react-chessboard'
import { PIECE_TYPES, PLINTH, SHAPES } from './shapes'

// Paid "modern" piece set (shop item pieceSet:modern) — flat geometric
// silhouettes, distinct from the library's built-in default (the classic
// Cburnett set, which is the free default pieceSet). Shares its geometry with
// the other paid sets (see ./shapes). See src/components/Board/ChessBoard.tsx
// for the swap.

function piece(fill: string, shapes: React.ReactNode) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%">
      <g
        style={{
          fill,
          stroke: '#000000',
          strokeWidth: 1.5,
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

export const modernPieces: PieceRenderObject = Object.fromEntries(
  PIECE_TYPES.flatMap(type => [
    [`w${type}`, () => piece('#ffffff', SHAPES[type]('#000000'))],
    [`b${type}`, () => piece('#000000', SHAPES[type]('#ffffff'))],
  ])
)
