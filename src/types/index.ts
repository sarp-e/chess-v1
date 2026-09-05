export type Difficulty = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

// 'assisted' allows hints and takebacks; 'regular' is standard play with neither.
export type AssistLevel = 'assisted' | 'regular'

export interface Bot {
  id: string
  name: string
  elo: number
  tagline: string
  bio: string
  depth: number
  blunderChance: number  // 0–1, chance of playing second-best move
  avatar: string         // emoji for now
}

export interface Puzzle {
  id: string
  title: string
  fen: string
  solution: string[]     // UCI format e.g. ["e2e4", "e7e5"]
  playerColor: 'w' | 'b'
  difficulty: 1 | 2 | 3 | 4 | 5
  theme: string
  description: string
}

export interface PuzzleProgress {
  [puzzleId: string]: {
    completed: boolean
    usedHint: boolean
    gaveUp: boolean
    completedAt?: string
  }
}

export type ColorTheme = 'walnut' | 'slate-mono' | 'championship-green' | 'forest' | 'ocean'
export type ColorMode = 'system' | 'light' | 'dark'

// Built-in app backgrounds (procedural CSS/SVG) plus curated "photo" gradients.
// A user's uploaded image is stored as `custom:<uuid>` — the uuid keys a blob
// in IndexedDB (see src/lib/bgStore.ts).
export type BuiltinBackground =
  | 'none'
  | 'flat'
  | 'ambient-glow'
  | 'vignette'
  | 'checkered'
  | 'contour'
  | 'photo-aurora'
  | 'photo-dusk'
  | 'photo-lagoon'
export type BackgroundId = BuiltinBackground | `custom:${string}`

export interface Settings {
  showLegalMoves: boolean
  colorTheme: ColorTheme
  colorMode: ColorMode
  pieceSet: 'standard' | 'cburnett'
  allowPremove: boolean
  background: BackgroundId
}

export interface Lesson {
  id: string
  title: string
  category: 'opening' | 'endgame' | 'tactics' | 'fundamentals'
  difficulty: 1 | 2 | 3
  description: string
  sections: LessonSection[]
}

export interface LessonSection {
  heading: string
  body: string
  fen?: string
  caption?: string
}
