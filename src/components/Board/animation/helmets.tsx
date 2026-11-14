import type { PieceRenderObject } from 'react-chessboard'

// Permanent pawn helmets for Animated Pieces owners (cburnett only).
function helmet(color: 'w' | 'b') {
  const white = color === 'w'
  return (
    <g>
      <path d="M17.2,14.4 A5.3,5.8 0 0 1 27.8,14.4 Z" fill={white ? '#e6d3a3' : '#121216'} stroke={white ? '#6b5530' : '#000'} strokeWidth="1.1" />
      <rect x="15.8" y="13.6" width="13.4" height="2" rx="1" fill={white ? '#d6bf86' : '#1d1d24'} stroke={white ? '#6b5530' : '#000'} strokeWidth="0.9" />
      <circle cx="22.5" cy="8.4" r="1" fill={white ? '#d6bf86' : '#1d1d24'} stroke={white ? '#6b5530' : '#000'} strokeWidth="0.7" />
      {!white && <path d="M19.6,12.6 A3.6,4.2 0 0 1 23.2,9.8" stroke="#fff" strokeOpacity="0.55" strokeWidth="1" strokeLinecap="round" fill="none" />}
    </g>
  )
}

/** cburnett pieces with the permanent pawn helmets (beige for white, obsidian for black). */
export function withHelmets(base: PieceRenderObject): PieceRenderObject {
  const wrap = (code: 'wP' | 'bP'): PieceRenderObject[string] => {
    const Pawn = base[code]
    return props => (
      <svg viewBox="0 0 45 45" width="100%" height="100%" style={{ ...props?.svgStyle, overflow: 'visible' }}>
        <Pawn {...props} svgStyle={undefined} />
        {helmet(code[0] as 'w' | 'b')}
      </svg>
    )
  }
  return { ...base, wP: wrap('wP'), bP: wrap('bP') }
}
