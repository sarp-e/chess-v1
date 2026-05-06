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
  fundamentals: 'bg-purple-900/30 text-purple-300 border-purple-700',
  opening: 'bg-blue-900/30 text-blue-300 border-blue-700',
  endgame: 'bg-orange-900/30 text-orange-300 border-orange-700',
  tactics: 'bg-red-900/30 text-red-300 border-red-700',
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
          className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-1 transition-colors"
        >
          ← Back to Lessons
        </button>

        {/* Lesson header */}
        <div className="mb-6">
          <span className={`text-xs px-2 py-1 rounded border capitalize ${CATEGORY_COLORS[selectedLesson.category]}`}>
            {CATEGORY_LABELS[selectedLesson.category]}
          </span>
          <h1 className="text-white text-2xl font-bold mt-2">{selectedLesson.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-yellow-400 text-sm">{'★'.repeat(selectedLesson.difficulty)}{'☆'.repeat(3 - selectedLesson.difficulty)}</span>
            <span className="text-gray-500 text-xs">{selectedLesson.sections.length} sections</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-6">
          {selectedLesson.sections.map((_, i) => (
            <button
              key={i}
              onClick={() => setSectionIndex(i)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= sectionIndex ? 'bg-blue-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Section content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-white text-xl font-semibold mb-3">{section.heading}</h2>
            <p className="text-gray-300 leading-relaxed">{section.body}</p>
          </div>

          {section.fen && (
            <div>
              <div className="max-w-xs mx-auto">
                <Chessboard
                  options={{
                    position: section.fen,
                    allowDragging: false,
                    lightSquareStyle: { backgroundColor: '#f0d9b5' },
                    darkSquareStyle: { backgroundColor: '#b58863' },
                    animationDurationInMs: 0,
                  }}
                />
              </div>
              {section.caption && (
                <p className="text-gray-500 text-xs text-center mt-2 italic">{section.caption}</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setSectionIndex(i => Math.max(0, i - 1))}
            disabled={sectionIndex === 0}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            ← Previous
          </button>

          {isLast ? (
            <button
              onClick={() => { setSelectedLesson(null); setSectionIndex(0) }}
              className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Complete ✓
            </button>
          ) : (
            <button
              onClick={() => setSectionIndex(i => i + 1)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
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
      <h1 className="text-white text-2xl font-bold mb-1">Learn Chess</h1>
      <p className="text-gray-400 text-sm mb-6">Study openings, endgames, tactics, and fundamentals.</p>

      {categories.map(cat => {
        const lessons = LESSONS.filter(l => l.category === cat)
        if (!lessons.length) return null
        return (
          <div key={cat} className="mb-8">
            <h2 className="text-gray-300 font-semibold text-sm uppercase tracking-wider mb-3">
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lessons.map(lesson => (
                <button
                  key={lesson.id}
                  onClick={() => { setSelectedLesson(lesson); setSectionIndex(0) }}
                  className="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-xl p-4 text-left transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded border capitalize ${CATEGORY_COLORS[cat]}`}>
                      {CATEGORY_LABELS[cat]}
                    </span>
                    <span className="text-yellow-400 text-xs">
                      {'★'.repeat(lesson.difficulty)}{'☆'.repeat(3 - lesson.difficulty)}
                    </span>
                  </div>
                  <h3 className="text-white font-medium group-hover:text-blue-300 transition-colors">
                    {lesson.title}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">{lesson.description}</p>
                  <p className="text-gray-600 text-xs mt-2">{lesson.sections.length} sections</p>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
