import type { PieceRenderObject } from 'react-chessboard'

// Free "standard" piece set — flat geometric silhouettes, distinct from the
// library's built-in default (which is the classic Cburnett set, sold
// separately in the shop as the 'cburnett' pieceSet). Same 45x45 viewBox and
// footprint (base plinth at y=36-39) so both sets drop into the board
// interchangeably. See src/components/Board/ChessBoard.tsx for the swap.

const PLINTH = <rect x="9" y="36" width="27" height="3" rx="1" />

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

// Some shapes need an internal detail (bishop's slit, knight's eye) that must
// contrast with the piece body — black on a white piece, white on a black one.
// The group's own stroke is always black, so these details are drawn with an
// explicit `accent` color rather than inheriting it (a black-on-black stroke
// would otherwise vanish on black pieces).
const SHAPES: Record<'P' | 'R' | 'N' | 'B' | 'Q' | 'K', (accent: string) => React.ReactNode> = {
  P: () => (
    <>
      <circle cx="22.5" cy="14" r="6" />
      <path d="M15,36 C15,27 18,24 22.5,24 C27,24 30,27 30,36 Z" />
    </>
  ),
  R: () => (
    <>
      <rect x="13" y="9" width="5" height="8" />
      <rect x="20" y="9" width="5" height="8" />
      <rect x="27" y="9" width="5" height="8" />
      <rect x="13" y="17" width="19" height="19" />
    </>
  ),
  N: accent => (
    <>
      <path d="M12,26 C12,23 13,20 15,17 C16,14 17,12 18,10 L20,5 L23,10 C26,8 29,9 31,11 C34,13 35,17 35,22 L35,36 L18,36 L18,29 C16,28 14,27 12,26 Z" />
      <circle cx="25" cy="15" r="1.4" fill={accent} stroke="none" />
    </>
  ),
  B: accent => (
    <>
      <circle cx="22.5" cy="10" r="2.6" />
      <path d="M13,36 C13,27 17,24 22.5,19 C28,24 32,27 32,36 Z" />
      <path d="M18,23 L27,27" style={{ stroke: accent, fill: 'none' }} />
    </>
  ),
  Q: () => (
    <>
      <rect x="12" y="14" width="21" height="3" rx="1.5" />
      <circle cx="13" cy="13" r="2.2" />
      <circle cx="18.5" cy="13" r="2.2" />
      <circle cx="22.5" cy="13" r="2.2" />
      <circle cx="26.5" cy="13" r="2.2" />
      <circle cx="32" cy="13" r="2.2" />
      <path d="M14,36 C14,27 18,24 22.5,24 C27,24 31,27 31,36 Z" />
    </>
  ),
  K: () => (
    <>
      <rect x="21" y="6" width="3" height="6" />
      <rect x="18.5" y="8" width="8" height="3" />
      <path d="M14,36 C14,26 18,22 22.5,22 C27,22 31,26 31,36 Z" />
      <path d="M15,30 L30,30" style={{ fill: 'none' }} />
    </>
  ),
}

export const standardPieces: PieceRenderObject = Object.fromEntries(
  (['P', 'R', 'N', 'B', 'Q', 'K'] as const).flatMap(type => [
    [`w${type}`, () => piece('#ffffff', SHAPES[type]('#000000'))],
    [`b${type}`, () => piece('#000000', SHAPES[type]('#ffffff'))],
  ])
)
