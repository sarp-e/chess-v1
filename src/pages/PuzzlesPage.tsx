import { useState, useCallback, useEffect } from 'react'
import { Chess } from 'chess.js'
import ChessBoard from '../components/Board/ChessBoard'
import { usePuzzles } from '../hooks/usePuzzles'
import { PUZZLES } from '../data/puzzles'

type PuzzleState = 'idle' | 'playing' | 'correct' | 'incorrect' | 'complete' | 'showing-solution'

export default function PuzzlesPage() {
  const {
    currentPuzzle, currentIndex, dailyIndex, progress,
    markCompleted, goToDaily, goToNext, goToPrev, goToIndex,
  } = usePuzzles()

  const [fen, setFen] = useState(currentPuzzle.fen)
  const [moveIndex, setMoveIndex] = useState(0)
  const [puzzleState, setPuzzleState] = useState<PuzzleState>('idle')
  const [hintUsed, setHintUsed] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [feedback, setFeedback] = useState('')

  const resetPuzzle = useCallback(() => {
    setFen(currentPuzzle.fen)
    setMoveIndex(0)
    setPuzzleState('idle')
    setHintUsed(false)
    setShowHint(false)
    setFeedback('')
  }, [currentPuzzle])

  useEffect(() => { resetPuzzle() }, [currentPuzzle])

  const playOpponentMove = useCallback((game: Chess, solutionMoveIndex: number) => {
    const oppMove = currentPuzzle.solution[solutionMoveIndex]
    if (!oppMove) return
    setTimeout(() => {
      const from = oppMove.slice(0, 2)
      const to = oppMove.slice(2, 4)
      const promotion = oppMove.length > 4 ? oppMove[4] : 'q'
      try {
        game.move({ from, to, promotion })
        setFen(game.fen())
        setMoveIndex(solutionMoveIndex + 1)
        setPuzzleState('playing')
      } catch {
        // move may be invalid in seeded data
      }
    }, 400)
  }, [currentPuzzle])

  const handleMove = useCallback((from: string, to: string): boolean => {
    if (puzzleState === 'complete' || puzzleState === 'showing-solution') return false
    if (puzzleState === 'idle') setPuzzleState('playing')

    const expectedUCI = currentPuzzle.solution[moveIndex]
    const playedUCI = `${from}${to}`

    const game = new Chess(fen)
    try {
      game.move({ from, to, promotion: 'q' })
    } catch {
      return false
    }

    const isCorrect = playedUCI === expectedUCI || playedUCI === expectedUCI.slice(0, 4)

    if (isCorrect) {
      setFen(game.fen())
      const nextPlayerMoveIndex = moveIndex + 2
      const solutionDone = nextPlayerMoveIndex >= currentPuzzle.solution.length

      if (solutionDone || moveIndex + 1 >= currentPuzzle.solution.length) {
        setPuzzleState('complete')
        setFeedback('Puzzle complete! Well done.')
        markCompleted(currentPuzzle.id, hintUsed, false)
      } else {
        setPuzzleState('correct')
        setFeedback('Correct! Keep going.')
        playOpponentMove(game, moveIndex + 1)
        setMoveIndex(nextPlayerMoveIndex)
      }
    } else {
      setPuzzleState('incorrect')
      setFeedback('Incorrect — try again.')
      setTimeout(() => {
        setFen(fen)
        setPuzzleState('playing')
      }, 800)
      return false
    }

    return isCorrect
  }, [puzzleState, moveIndex, fen, currentPuzzle, hintUsed, markCompleted, playOpponentMove])

  const showSolution = useCallback(() => {
    setPuzzleState('showing-solution')
    markCompleted(currentPuzzle.id, hintUsed, true)
    const game = new Chess(fen)
    let i = moveIndex
    const interval = setInterval(() => {
      if (i >= currentPuzzle.solution.length) {
        clearInterval(interval)
        return
      }
      const move = currentPuzzle.solution[i]
      const from = move.slice(0, 2)
      const to = move.slice(2, 4)
      const promotion = move.length > 4 ? move[4] : 'q'
      try {
        game.move({ from, to, promotion })
        setFen(game.fen())
      } catch { clearInterval(interval) }
      i++
    }, 600)
  }, [fen, moveIndex, currentPuzzle, hintUsed, markCompleted])

  const stars = '★'.repeat(currentPuzzle.difficulty) + '☆'.repeat(5 - currentPuzzle.difficulty)
  const prog = progress[currentPuzzle.id]
  const isCompleted = prog?.completed
  const isDailyPuzzle = currentIndex === dailyIndex

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6 min-h-[calc(100vh-56px)]">
      {/* Board */}
      <div className="flex-1 flex items-center justify-center">
        <ChessBoard
          fen={fen}
          onMove={handleMove}
          orientation={currentPuzzle.playerColor === 'w' ? 'white' : 'black'}
          disabled={puzzleState === 'complete' || puzzleState === 'showing-solution' || puzzleState === 'incorrect'}
        />
      </div>

      {/* Panel */}
      <div className="w-full lg:w-72 xl:w-80 space-y-3">
        {/* Header */}
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {isDailyPuzzle && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Daily</span>
                )}
                {isCompleted && (
                  <span className="text-xs bg-green-700 text-white px-2 py-0.5 rounded-full">✓ Done</span>
                )}
              </div>
              <h2 className="text-white font-semibold">{currentPuzzle.title}</h2>
              <div className="text-yellow-400 text-sm mt-0.5">{stars}</div>
            </div>
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded capitalize">
              {currentPuzzle.theme.replace('-', ' ')}
            </span>
          </div>
          <p className="text-gray-400 text-xs">
            {currentPuzzle.playerColor === 'w' ? 'White' : 'Black'} to move
          </p>
        </div>

        {/* Status */}
        {feedback && (
          <div className={`rounded-lg p-3 text-sm text-center font-medium ${
            puzzleState === 'complete' ? 'bg-green-900/30 text-green-400' :
            puzzleState === 'correct' ? 'bg-green-900/20 text-green-400' :
            puzzleState === 'incorrect' ? 'bg-red-900/30 text-red-400' :
            'bg-gray-800 text-gray-300'
          }`}>
            {feedback}
          </div>
        )}

        {/* Hint */}
        {!showHint ? (
          <button
            onClick={() => { setShowHint(true); setHintUsed(true) }}
            disabled={puzzleState === 'complete'}
            className="w-full py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 text-sm rounded-lg transition-colors"
          >
            Show Hint
          </button>
        ) : (
          <div className="bg-gray-800 rounded-lg p-3 text-gray-400 text-sm italic">
            💡 {currentPuzzle.description}
          </div>
        )}

        {/* Give up */}
        {puzzleState !== 'complete' && puzzleState !== 'showing-solution' && (
          <button
            onClick={showSolution}
            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-500 text-sm rounded-lg transition-colors"
          >
            Show Solution
          </button>
        )}

        {/* Navigation */}
        <div className="flex gap-2">
          <button
            onClick={goToPrev}
            className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
          >
            ← Prev
          </button>
          <button
            onClick={goToDaily}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors whitespace-nowrap"
          >
            Today's
          </button>
          <button
            onClick={goToNext}
            className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
          >
            Next →
          </button>
        </div>

        {/* Puzzle list */}
        <div className="bg-gray-800 rounded-xl p-3">
          <div className="text-gray-400 text-xs mb-2">All Puzzles</div>
          <div className="grid grid-cols-5 gap-1">
            {PUZZLES.map((p, i) => {
              const pProg = progress[p.id]
              return (
                <button
                  key={p.id}
                  onClick={() => goToIndex(i)}
                  className={`aspect-square rounded text-xs font-medium transition-colors ${
                    i === currentIndex ? 'bg-blue-600 text-white' :
                    pProg?.completed ? 'bg-green-800 text-green-300' :
                    pProg?.gaveUp ? 'bg-red-900 text-red-400' :
                    'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                  title={p.title}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
