# Chess App — V1 Product Specification

**Version:** 1.0  
**Status:** Ready for development  
**Target:** Local development build (no deployment required)  
**Stack:** React + TypeScript, Node.js backend, chess.js, Stockfish

---

## 1. Overview

A locally-run chess web application with two core features: playing against an AI opponent at selectable difficulty levels, and solving daily puzzles of increasing difficulty. The V1 scope is intentionally minimal — no accounts, no database, no multiplayer. The goal is a polished, functional UI that can be iterated on before backend infrastructure is added in V2.

---

## 2. Technical Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18 + TypeScript | Vite for local dev server |
| Chess logic | chess.js | Move validation, FEN/PGN, game state |
| Board UI | react-chessboard | Drag-and-drop, piece rendering |
| AI engine | stockfish.js (WASM) | Runs in browser via Web Worker |
| Styling | Tailwind CSS | Utility-first, no extra UI library |
| State | React Context + useReducer | No Redux needed at this scope |
| Persistence | localStorage | Saves puzzle progress and settings |
| Backend | None (V1 is fully client-side) | Node.js dev server via Vite only |

---

## 3. Project Structure

```
chess-app/
├── public/
│   └── stockfish/          # Stockfish WASM files
│       ├── stockfish.js
│       └── stockfish.wasm
├── src/
│   ├── components/
│   │   ├── Board/           # Chessboard wrapper component
│   │   ├── GamePanel/       # Move history, captured pieces, clock
│   │   ├── AIGame/          # Play vs AI page
│   │   ├── Puzzles/         # Daily puzzles page
│   │   └── Layout/          # Nav, shell
│   ├── hooks/
│   │   ├── useChessGame.ts  # Core game state logic
│   │   ├── useStockfish.ts  # AI engine interface
│   │   └── usePuzzles.ts    # Puzzle state and progress
│   ├── data/
│   │   └── puzzles.ts       # Static puzzle definitions (see Section 6)
│   ├── types/
│   │   └── index.ts         # Shared TypeScript types
│   ├── utils/
│   │   └── chess.ts         # FEN helpers, move formatting
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 4. Pages & Navigation

The app has two pages accessible from a top navigation bar. Navigation uses React Router.

```
/           → redirects to /play
/play       → Play vs AI
/puzzles    → Daily Puzzles
```

### Navigation bar
- App name / logo on the left (clicking returns to /play)
- Two nav links: "Play" and "Puzzles"
- Active link is visually highlighted
- Clean, minimal design — no sidebar

---

## 5. Play vs AI Page (`/play`)

### 5.1 Layout

Two-column layout on desktop (≥768px), stacked on mobile:
- **Left column** — chess board (square, fills available height)
- **Right column** — game controls panel

### 5.2 Chess Board

- Rendered using `react-chessboard`
- Pieces movable by drag-and-drop and click-to-select
- Legal move hints: highlight valid destination squares when a piece is selected (dots for empty squares, ring for captures)
- Last move highlighted (subtle tint on from/to squares)
- Board orientation: player always plays as White in V1
- Board is locked (non-interactive) during AI thinking and after game ends

### 5.3 Game Controls Panel

Contains the following sections, top to bottom:

**Difficulty selector**
- Label: "AI Difficulty"
- Five levels displayed as a segmented control or button group:
  - Beginner (Stockfish depth 1, ELO ~400)
  - Easy (depth 3, ELO ~800)
  - Medium (depth 5, ELO ~1200)
  - Hard (depth 8, ELO ~1600)
  - Expert (depth 12, ELO ~2000)
- Changing difficulty only takes effect on the next new game (not mid-game)
- Currently active difficulty is visually distinguished

**Game status bar**
- Displays current state: "Your turn", "AI is thinking…", "You win!", "AI wins", "Draw"
- "AI is thinking…" state shows a subtle animated indicator (e.g. pulsing dots)

**Action buttons**
- "New Game" — resets board, starts fresh game at selected difficulty
- "Undo Move" — undoes the last two half-moves (player move + AI response); disabled if fewer than 2 half-moves played or game is over
- "Flip Board" — toggles board orientation for reviewing positions

**Move history**
- Scrollable list of moves in standard algebraic notation (SAN), e.g. "1. e4 e5  2. Nf3 Nc6"
- Displayed in two columns (White | Black) per row
- Auto-scrolls to the latest move
- Clicking a move in history does NOT navigate to that position in V1 (future feature)

**Captured pieces**
- Two rows: pieces captured by White (shown above or below board), pieces captured by Black
- Displayed as piece icons grouped by type
- Material advantage shown as a numeric score (e.g. "+3") next to the leading side

### 5.4 AI Behavior

- Stockfish runs in a Web Worker to avoid blocking the UI
- After the player's move, trigger Stockfish with the current FEN and the configured depth
- Stockfish responds with the best move; apply it after a minimum 300ms delay (prevents instant responses feeling robotic at low difficulties)
- At Beginner difficulty, add a random chance (30%) of playing a sub-optimal move (second-best from Stockfish's MultiPV output) to simulate realistic blunders

### 5.5 Game End Detection

Detect and handle all terminal states via chess.js:
- Checkmate (win or loss)
- Stalemate (draw)
- Insufficient material (draw)
- Threefold repetition (draw)
- 50-move rule (draw)

On game end, display an overlay or banner with the result and a "New Game" button.

---

## 6. Daily Puzzles Page (`/puzzles`)

### 6.1 Concept

A set of chess puzzles presented in order of increasing difficulty. "Daily" in V1 means one puzzle is designated as today's based on the current date (cycle through the puzzle set using `dayOfYear % puzzleCount`). Players can also browse and replay all puzzles.

### 6.2 Puzzle Data Structure

Puzzles are stored as a static TypeScript array in `src/data/puzzles.ts`:

```typescript
interface Puzzle {
  id: string;
  title: string;                // e.g. "Fork the King"
  fen: string;                  // Starting position
  solution: string[];           // Sequence of moves in UCI format, e.g. ["e2e4", "e7e5"]
  playerColor: "w" | "b";      // Which side the player controls
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 = easiest, 5 = hardest
  theme: string;                // e.g. "fork", "pin", "checkmate-in-2"
  description: string;          // One-sentence hint shown on request
}
```

Seed the app with at least **20 puzzles** covering all five difficulty levels (4 per level). Puzzles should span common tactical themes: fork, pin, skewer, discovered attack, back-rank mate, checkmate in 1, checkmate in 2.

Use real chess positions in FEN notation. Source from Lichess open puzzle database (https://database.lichess.org/#puzzles) — pick positions that are clearly correct and have clean, unambiguous solutions.

### 6.3 Puzzle UI Layout

Same two-column layout as the Play page.

**Left column:** chess board, locked to only allow moves matching the solution sequence.

**Right column:**

- Puzzle title and difficulty indicator (1–5 stars or colored badge)
- Theme tag (e.g. "Fork")
- Status message: "Find the best move", "Correct! Keep going", "Incorrect — try again", "Puzzle complete!"
- "Show hint" button — reveals the `description` field; can only be used once per puzzle attempt
- "Give up / Show solution" button — plays through the solution automatically with 600ms delay between moves; marks puzzle as failed
- Navigation: "← Previous" / "Next →" buttons to move between puzzles
- "Today's Puzzle" button — jumps to the date-computed daily puzzle

### 6.4 Puzzle Interaction Flow

1. Board loads with the starting FEN. Player's turn is indicated.
2. Player selects and moves a piece.
3. If the move matches `solution[0]`: mark correct, briefly highlight the square green, then automatically play the opponent's response (`solution[1]`) after 400ms.
4. If the move does not match: briefly highlight the square red, display "Incorrect — try again", allow retry without resetting.
5. Continue until all moves in the solution are played.
6. On completion: display a success message, record completion in localStorage.

### 6.5 Progress Persistence

Store puzzle progress in localStorage under the key `chess_puzzle_progress`:

```typescript
interface PuzzleProgress {
  [puzzleId: string]: {
    completed: boolean;
    usedHint: boolean;
    gaveUp: boolean;
    completedAt?: string; // ISO date string
  }
}
```

On the puzzle list/navigation, show a completion checkmark or badge next to completed puzzles.

---

## 7. Settings

No dedicated settings page in V1. Persist the following to localStorage under `chess_settings`:

```typescript
interface Settings {
  difficulty: 1 | 2 | 3 | 4 | 5;   // Default: 2 (Easy)
  showLegalMoves: boolean;           // Default: true
  boardTheme: "classic" | "wood" | "tournament"; // Default: "classic"
  pieceSet: "standard" | "cburnett"; // Default: "standard"
}
```

Board theme and piece set can be toggled via a small gear icon in the navigation bar that opens a dropdown — no full settings page required.

---

## 8. Visual Design Principles

- Clean, focused interface — chess board is the hero element
- Dark mode support via Tailwind's `dark:` prefix; default to system preference
- Board takes up maximum useful height without scrolling on a 1080p screen
- Responsive: functional (not just readable) on screens ≥ 375px wide
- Animations: piece movement uses react-chessboard's built-in animation; keep transition durations at 150–200ms
- No external fonts required — use system font stack

---

## 9. Key Constraints & Non-Goals for V1

The following are explicitly out of scope and should not be built:

- User accounts or authentication
- Server-side game state or database
- Multiplayer (real-time or async)
- Game save/load beyond localStorage
- Opening explorer or endgame tablebase
- Analysis mode / engine evaluation overlay
- Time controls / chess clock
- ELO rating system
- Social features (sharing, leaderboards)

---

## 10. Local Development Setup

The developer should be able to run the full app with:

```bash
npm install
npm run dev
```

This starts the Vite dev server at `http://localhost:5173`. No additional processes, environment variables, or external services are required.

Stockfish WASM files must be placed in `public/stockfish/` and loaded via a Web Worker. The Vite config must set the correct headers to allow SharedArrayBuffer if required by the Stockfish build used.

---

## 11. Acceptance Criteria

### Play vs AI
- [ ] Player can make any legal move via drag-and-drop and click-to-select
- [ ] Legal move hints display correctly for all piece types
- [ ] AI responds within 5 seconds at all difficulty levels
- [ ] AI plays noticeably stronger at higher difficulty settings
- [ ] All five game-end conditions are detected and displayed
- [ ] Undo correctly reverts two half-moves
- [ ] Move history displays in correct SAN format
- [ ] Captured pieces and material score display correctly

### Daily Puzzles
- [ ] Today's puzzle loads correctly based on the current date
- [ ] Correct moves are accepted and opponent responses play automatically
- [ ] Incorrect moves are rejected with visual feedback without resetting the position
- [ ] Hint reveals description and is limited to one use
- [ ] "Show solution" animates through all moves correctly
- [ ] Completion is saved to localStorage and persists on page reload
- [ ] All 20+ puzzles are solvable and solutions are correct

### General
- [ ] App runs with `npm install && npm run dev` with no errors
- [ ] Dark mode renders correctly
- [ ] No console errors during normal gameplay
- [ ] App is functional on Chrome, Firefox, and Safari

---

## 12. Suggested Build Order

Build in this sequence to allow incremental testing:

1. Project scaffold (Vite + React + TypeScript + Tailwind + React Router)
2. Static board with react-chessboard and chess.js — two human players, legal moves only
3. Stockfish Web Worker integration — AI responds to player moves
4. Difficulty selector wired to Stockfish depth
5. Game panel: status, move history, captured pieces, action buttons
6. Puzzle data file with 20+ seeded puzzles
7. Puzzle page: board interaction, solution validation, feedback states
8. Progress persistence via localStorage
9. Settings dropdown (board theme, piece set)
10. Polish: dark mode, responsive layout, animations, edge cases
