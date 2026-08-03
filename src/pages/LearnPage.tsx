import { useState } from 'react'
import { Chessboard } from 'react-chessboard'
import { LESSONS } from '../data/lessons'
import type { Lesson, LessonSection } from '../types'

const CATEGORY_LABELS: Record<string, string> = {
  fundamentals: 'Fundamentals',
  opening: 'Openings',
  endgame: 'Endgames',
  tactics: 'Tactics',
}

const CATEGORY_COLORS: Record<string, string> = {
  fundamentals: 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--border)]',
  opening:      'bg-[var(--success-soft)] text-[var(--success)] border-[var(--border)]',
  endgame:      'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--border)]',
  tactics:      'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--border)]',
}

export default function LearnPage() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [sectionIndex, setSectionIndex] = useState(0)

  const categories = ['fundamentals', 'opening', 'endgame', 'tactics'] as const

  if (selectedLesson) {
    const section: LessonSection = selectedLesson.sections[sectionIndex]
    const isLast = sectionIndex === selectedLesson.sections.length - 1

    return (
      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        {/* Breadcrumb */}
        <button
          onClick={() => { setSelectedLesson(null); setSectionIndex(0) }}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm mb-4 flex items-center gap-1 transition-colors"
        >
          ← Back to Lessons
        </button>

        {/* Lesson header */}
        <div className="mb-6">
          <span className={`text-xs px-2 py-1 rounded border capitalize ${CATEGORY_COLORS[selectedLesson.category]}`}>
            {CATEGORY_LABELS[selectedLesson.category]}
          </span>
          <h1 className="text-[var(--text-primary)] text-2xl font-bold mt-2">{selectedLesson.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[var(--warning)] text-sm">{'★'.repeat(selectedLesson.difficulty)}{'☆'.repeat(3 - selectedLesson.difficulty)}</span>
            <span className="text-[var(--text-muted)] text-xs">{selectedLesson.sections.length} sections</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-6">
          {selectedLesson.sections.map((_, i) => (
            <button
              key={i}
              onClick={() => setSectionIndex(i)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= sectionIndex ? 'bg-[var(--accent)]' : 'bg-[var(--panel-alt)]'
              }`}
            />
          ))}
        </div>

        {/* Section content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-3">{section.heading}</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">{section.body}</p>
          </div>

          {section.fen && (
            <div>
              <div className="max-w-xs mx-auto">
                <Chessboard
                  options={{
                    position: section.fen,
                    allowDragging: false,
                    lightSquareStyle: { backgroundColor: 'var(--board-light)' },
                    darkSquareStyle: { backgroundColor: 'var(--board-dark)' },
                    animationDurationInMs: 0,
                  }}
                />
              </div>
              {section.caption && (
                <p className="text-[var(--text-muted)] text-xs text-center mt-2 italic">{section.caption}</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setSectionIndex(i => Math.max(0, i - 1))}
            disabled={sectionIndex === 0}
            className="px-4 py-2 bg-[var(--panel-alt)] hover:bg-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-primary)] text-sm rounded-lg transition-colors"
          >
            ← Previous
          </button>

          {isLast ? (
            <button
              onClick={() => { setSelectedLesson(null); setSectionIndex(0) }}
              className="px-4 py-2 bg-[var(--success)] hover:opacity-90 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Complete ✓
            </button>
          ) : (
            <button
              onClick={() => setSectionIndex(i => i + 1)}
              className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm rounded-lg transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6">
      <h1 className="text-[var(--text-primary)] text-2xl font-bold mb-1">Learn Chess</h1>
      <p className="text-[var(--text-secondary)] text-sm mb-6">Study openings, endgames, tactics, and fundamentals.</p>

      {categories.map(cat => {
        const lessons = LESSONS.filter(l => l.category === cat)
        if (!lessons.length) return null
        return (
          <div key={cat} className="mb-8">
            <h2 className="text-[var(--text-secondary)] font-semibold text-sm uppercase tracking-wider mb-3">
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lessons.map(lesson => (
                <button
                  key={lesson.id}
                  onClick={() => { setSelectedLesson(lesson); setSectionIndex(0) }}
                  className="bg-[var(--panel-alt)] hover:bg-[var(--border)] border border-[var(--border)] rounded-xl p-4 text-left transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded border capitalize ${CATEGORY_COLORS[cat]}`}>
                      {CATEGORY_LABELS[cat]}
                    </span>
                    <span className="text-[var(--warning)] text-xs">
                      {'★'.repeat(lesson.difficulty)}{'☆'.repeat(3 - lesson.difficulty)}
                    </span>
                  </div>
                  <h3 className="text-[var(--text-primary)] font-medium group-hover:text-[var(--accent)] transition-colors">
                    {lesson.title}
                  </h3>
                  <p className="text-[var(--text-muted)] text-xs mt-1 leading-relaxed">{lesson.description}</p>
                  <p className="text-[var(--text-muted)] text-xs mt-2">{lesson.sections.length} sections</p>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
