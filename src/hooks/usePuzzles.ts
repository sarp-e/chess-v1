import { useState, useCallback, useEffect } from 'react'
import { PUZZLES } from '../data/puzzles'
import type { PuzzleProgress, Puzzle } from '../types'

function getDayOfYear(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

export function usePuzzles() {
  const [progress, setProgress] = useState<PuzzleProgress>(() => {
    const stored = localStorage.getItem('chess_puzzle_progress')
    return stored ? JSON.parse(stored) : {}
  })

  const [currentIndex, setCurrentIndex] = useState(() => {
    return getDayOfYear() % PUZZLES.length
  })

  useEffect(() => {
    localStorage.setItem('chess_puzzle_progress', JSON.stringify(progress))
  }, [progress])

  const currentPuzzle: Puzzle = PUZZLES[currentIndex]
  const dailyIndex = getDayOfYear() % PUZZLES.length

  const markCompleted = useCallback((puzzleId: string, usedHint: boolean, gaveUp: boolean) => {
    setProgress(prev => ({
      ...prev,
      [puzzleId]: {
        completed: !gaveUp,
        usedHint,
        gaveUp,
        completedAt: new Date().toISOString(),
      },
    }))
  }, [])

  const goToDaily = useCallback(() => setCurrentIndex(dailyIndex), [dailyIndex])
  const goToNext = useCallback(() => setCurrentIndex(i => (i + 1) % PUZZLES.length), [])
  const goToPrev = useCallback(() => setCurrentIndex(i => (i - 1 + PUZZLES.length) % PUZZLES.length), [])
  const goToIndex = useCallback((i: number) => setCurrentIndex(i), [])

  return {
    puzzles: PUZZLES,
    currentPuzzle,
    currentIndex,
    dailyIndex,
    progress,
    markCompleted,
    goToDaily,
    goToNext,
    goToPrev,
    goToIndex,
  }
}
