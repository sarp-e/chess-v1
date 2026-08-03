import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameReview, type MoveClass, type ReviewMove } from '../hooks/useGameReview'
import ChessBoard from '../components/Board/ChessBoard'

const CLASS_DOT: Record<MoveClass, { dot: string; label: string }> = {
  best:       { dot: 'bg-[var(--success)]',  label: 'Best' },
  inaccuracy: { dot: 'bg-[var(--warning)]',  label: 'Inaccuracy' },
  mistake:    { dot: 'bg-orange-400',         label: 'Mistake' },
  blunder:    { dot: 'bg-[var(--danger)]',    label: 'Blunder' },
}

function formatEval(cp: number | null): string {
  if (cp === null) return '...'
  if (cp >= 9900) return 'M'
  if (cp <= -9900) return '-M'
  const val = cp / 100
  return val >= 0 ? `+${val.toFixed(1)}` : val.toFixed(1)
}

function EvalBar({ cp }: { cp: number | null }) {
  const pct = cp === null
    ? 50
    : Math.min(90, Math.max(10, 50 + (cp / (Math.abs(cp) + 200)) * 50))

  return (
    <div className="flex flex-col w-5 rounded overflow-hidden" style={{ height: '100%', minHeight: 200 }}>
      <div className="bg-[var(--board-dark)] transition-all duration-500" style={{ height: `${100 - pct}%` }} />
      <div className="bg-[var(--board-light)] transition-all duration-500" style={{ height: `${pct}%` }} />
    </div>
  )
}

export default function GameReviewPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const uciMoves: string[] = (location.state as { uciMoves?: string[] })?.uciMoves ?? []
  const playerColor: 'white' | 'black' = (location.state as { playerColor?: 'white' | 'black' })?.playerColor ?? 'white'

  const { fens, moves, evals, currentIndex, evaluating, progress, goTo, prev, next } =
    useGameReview(uciMoves)

  const moveListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next])

  useEffect(() => {
    if (!moveListRef.current) return
    const active = moveListRef.current.querySelector('[data-active="true"]')
    active?.scrollIntoView({ block: 'nearest' })
  }, [currentIndex])

  if (uciMoves.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="text-center space-y-3">
          <p className="text-[var(--text-secondary)]">No game to review.</p>
          <button onClick={() => navigate(-1)} className="text-[var(--accent)] underline text-sm">Go back</button>
        </div>
      </div>
    )
  }

  const currentFen = fens[currentIndex] ?? fens[fens.length - 1]
  const currentEval = evals[currentIndex] ?? null

  const pairs: { moveNumber: number; whiteIdx: number; blackIdx: number | null }[] = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({ moveNumber: Math.floor(i / 2) + 1, whiteIdx: i, blackIdx: i + 1 < moves.length ? i + 1 : null })
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6 min-h-[calc(100vh-56px)]">
      {/* Board + eval bar */}
      <div className="flex-1 flex items-center justify-center gap-3">
        <EvalBar cp={currentEval} />
        <div className="flex flex-col items-center gap-2">
          <ChessBoard
            fen={currentFen}
            onMove={() => false}
            orientation={playerColor}
            disabled
            lastMove={
              currentIndex > 0
                ? { from: uciMoves[currentIndex - 1].slice(0, 2), to: uciMoves[currentIndex - 1].slice(2, 4) }
                : null
            }
          />
          <div className="flex gap-2 mt-1">
            <button onClick={() => goTo(0)} className="px-3 py-1.5 bg-[var(--panel-alt)] hover:bg-[var(--border)] text-[var(--text-secondary)] text-sm rounded-lg transition-colors">⏮</button>
            <button onClick={prev} className="px-4 py-1.5 bg-[var(--panel-alt)] hover:bg-[var(--border)] text-[var(--text-secondary)] text-sm rounded-lg transition-colors">◀</button>
            <button onClick={next} className="px-4 py-1.5 bg-[var(--panel-alt)] hover:bg-[var(--border)] text-[var(--text-secondary)] text-sm rounded-lg transition-colors">▶</button>
            <button onClick={() => goTo(fens.length - 1)} className="px-3 py-1.5 bg-[var(--panel-alt)] hover:bg-[var(--border)] text-[var(--text-secondary)] text-sm rounded-lg transition-colors">⏭</button>
          </div>
          <p className="text-[var(--text-muted)] text-xs">← → arrow keys to navigate</p>
        </div>
      </div>

      {/* Panel */}
      <div className="w-full lg:w-72 xl:w-80 flex flex-col gap-4">

        {/* Eval + progress */}
        <div className="bg-[var(--panel)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[var(--text-primary)] font-semibold text-lg">{formatEval(currentEval)}</span>
            <span className="text-[var(--text-muted)] text-xs">
              {evaluating ? `Analyzing… ${progress}%` : 'Analysis complete'}
            </span>
          </div>
          {evaluating && (
            <div className="w-full h-1 bg-[var(--panel-alt)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-3 flex-wrap">
          {(Object.entries(CLASS_DOT) as [MoveClass, typeof CLASS_DOT[MoveClass]][]).map(([cls, { dot, label }]) => (
            <div key={cls} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
              <span className="text-[var(--text-muted)] text-xs">{label}</span>
            </div>
          ))}
        </div>

        {/* Move list */}
        <div className="bg-[var(--panel)] rounded-xl p-3 flex-1 overflow-hidden flex flex-col">
          <div ref={moveListRef} className="overflow-y-auto space-y-0.5 flex-1 max-h-96">
            {pairs.map(({ moveNumber, whiteIdx, blackIdx }) => (
              <div key={moveNumber} className="flex gap-1 text-sm">
                <span className="text-[var(--text-muted)] w-7 text-right shrink-0">{moveNumber}.</span>
                <MoveCell move={moves[whiteIdx]} active={currentIndex === whiteIdx + 1} onClick={() => goTo(whiteIdx + 1)} />
                {blackIdx !== null
                  ? <MoveCell move={moves[blackIdx]} active={currentIndex === blackIdx + 1} onClick={() => goTo(blackIdx + 1)} />
                  : <span className="flex-1" />
                }
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="w-full py-2.5 bg-[var(--panel-alt)] hover:bg-[var(--border)] text-[var(--text-secondary)] font-medium rounded-lg transition-colors"
        >
          Back to game
        </button>
      </div>
    </div>
  )
}

function MoveCell({ move, active, onClick }: { move: ReviewMove | undefined; active: boolean; onClick: () => void }) {
  if (!move) return <span className="flex-1" />
  const cls = move.classification
  const dot = cls ? CLASS_DOT[cls].dot : null

  return (
    <button
      data-active={active}
      onClick={onClick}
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors flex-1 text-left ${
        active ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--panel-alt)]'
      }`}
    >
      <span className="font-mono">{move.san}</span>
      {dot && <span className={`ml-auto w-2 h-2 rounded-full shrink-0 ${dot}`} />}
    </button>
  )
}
