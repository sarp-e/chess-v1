import type { PieceRenderObject } from 'react-chessboard'
import type { Costume } from './engine'

// Hand-drawn costume art, layered onto the cburnett pieces in the same 45×45
// viewBox. Idle motion (running legs, swaying gown, bobbing crown) is plain CSS
// in src/styles/piece-animations.css so it runs independently of the
// choreography's Web Animations.

const layer = { position: 'absolute', inset: 0, overflow: 'visible' } as const

function Legs() {
  const leg = (x: number, cls: string) => (
    <g className={`pa-leg ${cls}`} style={{ transformOrigin: `${x}px 31px` }}>
      <path d={`M${x},31 L${x},42`} stroke="#000" strokeWidth="2.6" strokeLinecap="round" />
      <ellipse cx={x + 1.4} cy="42.8" rx="3.2" ry="1.7" fill="#c0392b" stroke="#000" strokeWidth="0.8" />
    </g>
  )
  return (
    <svg viewBox="0 0 45 45" width="100%" height="100%" style={layer}>
      {leg(17.5, 'pa-leg-a')}
      {leg(27.5, 'pa-leg-b')}
    </svg>
  )
}

function Gown({ color }: { color: string }) {
  const fill = color === 'w' ? '#dccbff' : '#6b0f2a'
  const fold = color === 'w' ? '#b9a2ee' : '#4a0a1d'
  return (
    <svg viewBox="0 0 45 45" width="100%" height="100%" style={layer}>
      <g className="pa-gown" style={{ transformOrigin: '22.5px 25px' }}>
        <path
          d="M14,25.5 C18,24 27,24 31,25.5 L38.5,40.5 Q35.5,43 32.5,41 Q29.5,43.5 26.5,41.5 Q22.5,44 18.5,41.5 Q15.5,43.5 12.5,41 Q9.5,43 6.5,40.5 Z"
          fill={fill}
          stroke="#000"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path d="M18,27 L14.5,40 M22.5,26.5 L22.5,41 M27,27 L30.5,40" stroke={fold} strokeWidth="1" fill="none" />
        <path d="M14,25.5 C18,24 27,24 31,25.5" stroke="#d4a017" strokeWidth="2" fill="none" />
        <circle cx="22.5" cy="25" r="1.3" fill="#d4a017" stroke="#7a5a00" strokeWidth="0.5" />
      </g>
    </svg>
  )
}

function Crown() {
  return (
    <svg viewBox="0 0 45 45" width="100%" height="100%" style={layer}>
      <g transform="translate(0,3.5)">
      <g className="pa-crown" style={{ transformOrigin: '22.5px 9px' }}>
        <path
          d="M12.5,10 L10.5,-2.5 L16.5,3.5 L22.5,-6 L28.5,3.5 L34.5,-2.5 L32.5,10 Z"
          fill="#f7c843"
          stroke="#8a6200"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <rect x="12" y="7.5" width="21" height="3.6" rx="1" fill="#e9b52f" stroke="#8a6200" strokeWidth="1" />
        <circle cx="22.5" cy="-6" r="1.7" fill="#e0245e" stroke="#8a6200" strokeWidth="0.6" />
        <circle cx="10.5" cy="-2.5" r="1.3" fill="#3b82f6" stroke="#8a6200" strokeWidth="0.6" />
        <circle cx="34.5" cy="-2.5" r="1.3" fill="#3b82f6" stroke="#8a6200" strokeWidth="0.6" />
        <circle cx="17" cy="9.3" r="0.9" fill="#e0245e" />
        <circle cx="22.5" cy="9.3" r="0.9" fill="#22c55e" />
        <circle cx="28" cy="9.3" r="0.9" fill="#e0245e" />
        <path className="pa-sparkle" d="M30,-6 l0.8,2 2,0.8 -2,0.8 -0.8,2 -0.8,-2 -2,-0.8 2,-0.8 z" fill="#fff" />
      </g>
      </g>
    </svg>
  )
}

/** A piece rendered with its costume (or bare, when no costume applies). */
export function CostumedPiece({ pieces, piece, costume }: { pieces: PieceRenderObject; piece: string; costume?: Costume }) {
  const Svg = pieces[piece]
  if (!Svg) return null
  if (!costume) return <Svg />
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {costume === 'legs' && <Legs />}
      {/* Rook stands up on its legs: body shrinks a touch and lifts. */}
      <div style={{ position: 'absolute', inset: 0, transform: costume === 'legs' ? 'translateY(-11%) scale(0.86)' : undefined }}><Svg /></div>
      {costume === 'gown' && <Gown color={piece[0]} />}
      {costume === 'crown' && <Crown />}
    </div>
  )
}
