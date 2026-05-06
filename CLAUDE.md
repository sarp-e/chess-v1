# Chess V1 — Claude Context

## Spec
The full product specification lives at `chess_v1_spec.md`. Read it before making any architectural or feature decisions.

## Directions
User directions, preferences, and decisions made during development are tracked in the memory system at:
`~/.claude/projects/-Users-sarp-src-Chess-V1/memory/`

Check `MEMORY.md` there for an index of all saved context before starting any session.

## Puzzle Authoring Rules

All puzzles live in `src/data/puzzles.ts` and are validated by `scripts/validate-puzzles.ts`, which runs automatically on every `npm run build`.

**Before adding or editing any puzzle, verify:**

1. **Legal starting position** — the opponent's king must not be in check when it's the active side's turn. (The p014 bug: Re2 was checking ke8 before white moved.)
2. **Every solution move is legal** — play the sequence out in a board tool first.
3. **Checkmate themes end in checkmate** — puzzles with theme `back-rank`, `checkmate-in-1`, `checkmate-in-2`, or `checkmate-in-3` must leave the opponent in checkmate after the final move.
4. **UCI move format** — `e2e4`, no `x` for captures, promotions as `e7e8q`.

**Run validation manually:**
```
npm run validate-puzzles            # Tier 1 only — chess.js, fast
npm run validate-puzzles -- --deep  # + Tier 2 — Stockfish depth 18, slow (requires stockfish in PATH)
```

Tier 2 verifies Stockfish's best move at depth 18 matches `solution[0]`. Run it when adding new puzzles or changing a solution.

## Project State
- No code has been written yet.
- Build order is defined in Section 12 of the spec.
- Stack: React 18 + TypeScript, Vite, chess.js, react-chessboard, stockfish.js (WASM), Tailwind CSS.
- Fully client-side — no backend in V1.
