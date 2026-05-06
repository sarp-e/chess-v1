export type Difficulty = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

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

export interface Settings {
  showLegalMoves: boolean
  boardTheme: 'classic' | 'wood' | 'tournament'
  pieceSet: 'standard' | 'cburnett'
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
  fen?: string           // Optional board position to display
  caption?: string       // Caption for the board position
}
