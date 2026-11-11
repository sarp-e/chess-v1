import type { SpriteKind } from './engine'

// Small effect sprites drawn in the same 45×45 box as a piece.
export function Sprite({ kind, tone = 'w' }: { kind: SpriteKind; tone?: 'w' | 'b' }) {
  if (kind === 'handshake') {
    const sleeve = tone === 'w' ? '#ffffff' : '#2a2a2a'
    return (
      <svg viewBox="0 0 45 45" width="100%" height="100%" style={{ overflow: 'visible' }}>
        <rect x="-6" y="19" width="20" height="8" rx="3" fill={sleeve} stroke="#000" strokeWidth="1.2" />
        <rect x="31" y="19" width="20" height="8" rx="3" fill={sleeve} stroke="#000" strokeWidth="1.2" />
        <path d="M12,18.5 C17,15 28,15 33,18.5 L33,27.5 C28,31 17,31 12,27.5 Z" fill="#f2c9a0" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M18,18 L18,28 M22.5,17 L22.5,29 M27,18 L27,28" stroke="#b7835a" strokeWidth="1" />
        <path d="M14,17 C16,13.5 20,13.5 21,16.5" fill="#f2c9a0" stroke="#000" strokeWidth="1.1" />
        <path d="M8,12 l2,3 M22.5,9 v3.5 M37,12 l-2,3" stroke="#d4a017" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    )
  }
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
