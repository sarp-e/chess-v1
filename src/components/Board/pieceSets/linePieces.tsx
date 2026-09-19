import type { PieceRenderObject } from 'react-chessboard'
import { PIECE_TYPES } from './shapes'

// Paid "line" piece set (shop item pieceSet:line) — stroke only, airy and
// light. Like ./bauhausPieces this is self-contained design-handoff artwork on
// a 45x45 viewBox with its own base near y=37.5, so it does not use ./shapes'
// shared silhouette; only PIECE_TYPES is reused from there.
//
// Raw SVG markup strings injected with dangerouslySetInnerHTML into a <g> that
// carries the stroke presentation attributes; stroke="currentColor" picks up
// the CSS `color` set per piece colour.

const PIECES: Record<(typeof PIECE_TYPES)[number], string> = {
  K: `<path d="M22.5 7.5v10M18 11.5h9"/><path d="M13.5 37.5V26a9 9 0 0 1 18 0v11.5z"/><path d="M12.5 37.5h20"/>`,
  Q: `<path d="M12 17.5 17.4 23.5 22.5 15 27.6 23.5 33 17.5 29.5 31.5h-14z"/><path d="M15.5 34.5h14"/><path d="M12.5 37.5h20"/>`,
  R: `<path d="M14 21.5v-8h3.8v3h3.1v-3h3.2v3h3.1v-3H31v8z"/><path d="M16.5 21.5v16h12v-16"/><path d="M12.5 37.5h20"/>`,
  B: `<path d="M22.5 9.5 30 26.5a7.8 7.8 0 0 1-15 0z"/><path d="M16 32.5h13"/><path d="M12.5 37.5h20"/>`,
  N: `<path d="M12.5 37.5V19.5l5.5-4.5 1-5.5 3 2.8 5.5-2.8-1.8 6.5c3.5 1.9 5.3 4.7 5.3 9.2v12.3z"/><path d="M12.5 37.5h20"/>`,
  P: `<circle cx="22.5" cy="15" r="5.2"/><path d="M16.5 37.5 19 24.5h7l2.5 13z"/><path d="M12.5 37.5h20"/>`,
}

function piece(color: string, markup: string) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%">
      <g
        style={{ color }}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinejoin="round"
        strokeLinecap="round"
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    </svg>
  )
}

const WHITE = '#ffffff'
const BLACK = '#111111'

export const linePieces: PieceRenderObject = Object.fromEntries(
  PIECE_TYPES.flatMap(type => [
    [`w${type}`, () => piece(WHITE, PIECES[type])],
    [`b${type}`, () => piece(BLACK, PIECES[type])],
  ])
)
