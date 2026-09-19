import type { PieceRenderObject } from 'react-chessboard'
import { PIECE_TYPES } from './shapes'

// Paid "bauhaus" piece set (shop item pieceSet:bauhaus) — stacked blocks, bold
// and graphic. Unlike the other paid sets this one does NOT share ./shapes'
// silhouette: the artwork is a self-contained design handoff (45x45 viewBox,
// its own plinth near y=35-41), so only PIECE_TYPES is reused from there.
//
// The art arrives as raw SVG markup strings, so each piece is injected with
// dangerouslySetInnerHTML into a <g> that carries the presentation attributes
// (the markup uses fill="currentColor", which reads the CSS `color` we set).

const PIECES: Record<(typeof PIECE_TYPES)[number], string> = {
  K: `<path fill-rule="evenodd" d="M12 9h21v21H12z M20.9 12.5h3.2v14h-3.2z M16 17.3h4.9v3.2H16z M24.1 17.3h4.9v3.2h-4.9z"/><rect x="16" y="30" width="13" height="5"/><rect x="10" y="35" width="25" height="6" rx="1"/>`,
  Q: `<circle cx="22.5" cy="9.5" r="3.2"/><path d="M13 25a9.5 9.5 0 0 1 19 0z"/><rect x="16" y="25" width="13" height="10"/><rect x="10" y="35" width="25" height="6" rx="1"/>`,
  R: `<rect x="13" y="9" width="4" height="7"/><rect x="20.5" y="9" width="4" height="7"/><rect x="28" y="9" width="4" height="7"/><rect x="13" y="16" width="19" height="19"/><rect x="10" y="35" width="25" height="6" rx="1"/>`,
  B: `<path d="M22.5 9 32 30H13z"/><rect x="16" y="30" width="13" height="5"/><rect x="11" y="35" width="23" height="6" rx="1"/>`,
  N: `<path d="M13 35V22a12 12 0 0 1 12-12h7v10H23v15z"/><rect x="10" y="35" width="25" height="6" rx="1"/>`,
  P: `<circle cx="22.5" cy="16" r="6.5"/><rect x="16" y="26" width="13" height="9"/><rect x="11" y="35" width="23" height="6" rx="1"/>`,
}

// The art is fill-only, so a piece the same tone as the square underneath would
// vanish. A thin rim in the opposite tone keeps both colours readable on both
// light and dark squares without altering the shapes.
function piece(color: string, rim: string, markup: string) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%">
      <g
        style={{ color }}
        fill="currentColor"
        stroke={rim}
        strokeWidth={1.1}
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    </svg>
  )
}

const WHITE = '#ffffff'
const BLACK = '#111111'

export const bauhausPieces: PieceRenderObject = Object.fromEntries(
  PIECE_TYPES.flatMap(type => [
    [`w${type}`, () => piece(WHITE, BLACK, PIECES[type])],
    [`b${type}`, () => piece(BLACK, WHITE, PIECES[type])],
  ])
)
