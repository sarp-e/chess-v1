import type { SpriteKind } from './engine'

// Small effect sprites drawn in the same 45×45 box as a piece.
export function Sprite({ kind }: { kind: SpriteKind; tone?: 'w' | 'b' }) {
  if (kind === 'impact') {
    return (
      <svg viewBox="0 0 45 45" width="100%" height="100%" style={{ overflow: 'visible' }}>
        <polygon
          points="22.5,2 26.5,15 39,8 31,19.5 43,24 30,27 35,40 24.5,30.5 18,43 17,30 4,36 12.5,25.5 2,18 15,17 10,5 20.5,13.5"
          fill="#ffd23f"
          stroke="#f26b1d"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="22.5" cy="22.5" r="6" fill="#fff6c9" />
      </svg>
    )
  }
  // flash
  return (
    <svg viewBox="0 0 45 45" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="pa-flash">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="45%" stopColor="#fff3b0" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffd23f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="22.5" cy="22.5" r="30" fill="url(#pa-flash)" />
    </svg>
  )
}
