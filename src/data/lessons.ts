import type { Lesson } from '../types'

export const LESSONS: Lesson[] = [
  // Fundamentals
  {
    id: 'l001',
    title: 'How Pieces Move',
    category: 'fundamentals',
    difficulty: 1,
    description: 'A quick refresher on how each chess piece moves and captures.',
    sections: [
      {
        heading: 'The King',
        body: 'The king moves one square in any direction — horizontally, vertically, or diagonally. It can never move into check. Protecting your king is the most important goal in chess.',
        fen: '8/8/8/8/8/8/8/4K3 w - - 0 1',
        caption: 'The king can move to any adjacent square.',
      },
      {
        heading: 'The Queen',
        body: 'The queen is the most powerful piece. It moves any number of squares in any direction — horizontally, vertically, or diagonally. Think of it as a rook and bishop combined.',
        fen: '8/8/8/8/8/8/8/3Q4 w - - 0 1',
        caption: 'The queen dominates open positions.',
      },
      {
        heading: 'The Rook',
        body: 'The rook moves any number of squares horizontally or vertically. Rooks are most powerful on open files (columns with no pawns) and on the 7th rank.',
        fen: '8/8/8/8/8/8/8/R7 w - - 0 1',
        caption: 'Place rooks on open files for maximum effect.',
      },
      {
        heading: 'The Bishop',
        body: 'The bishop moves any number of squares diagonally. Each bishop is permanently on its starting color. Bishops thrive in open positions with long diagonals.',
        fen: '8/8/8/8/8/8/8/2B5 w - - 0 1',
        caption: 'Bishops are long-range diagonal pieces.',
      },
      {
        heading: 'The Knight',
        body: "The knight moves in an L-shape: two squares in one direction, then one square perpendicular. Knights can jump over other pieces — they're the only piece that can. Knights are strongest in closed positions.",
        fen: '8/8/8/8/8/8/8/1N6 w - - 0 1',
        caption: 'Knights are the only pieces that can jump.',
      },
      {
        heading: 'The Pawn',
        body: 'Pawns move forward one square at a time (two squares on their first move). They capture diagonally forward. If a pawn reaches the opposite end of the board, it promotes to any piece (almost always a queen).',
        fen: '8/8/8/8/8/8/4P3/8 w - - 0 1',
        caption: 'Pawns are the soul of chess — Philidor.',
      },
    ],
  },
  {
    id: 'l002',
    title: 'Three Principles of the Opening',
    category: 'fundamentals',
    difficulty: 1,
    description: 'The three core principles that guide strong opening play.',
    sections: [
      {
        heading: 'Control the Center',
        body: 'The four central squares (e4, d4, e5, d5) are the most important squares on the board. Controlling them gives your pieces maximum reach and restricts your opponent.',
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        caption: '1.e4 — a classic first move that stakes a claim in the center.',
      },
      {
        heading: 'Develop Your Pieces',
        body: 'Get your knights and bishops off the back rank and into the game quickly. Every move should develop a new piece in the opening. Avoid moving the same piece twice without a good reason.',
        fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
        caption: 'Both sides have developed knights after 1.e4 e5 2.Nf3 Nf6.',
      },
      {
        heading: 'Castle Early',
        body: 'Castling moves your king to safety and connects your rooks. Try to castle within the first 10 moves. A king left in the center is vulnerable to attack.',
        fen: 'rnbq1rk1/pppp1ppp/5n2/4p3/4P3/5N2/PPPPBPPP/RNBQK2R w KQ - 4 5',
        caption: 'Black has castled kingside, securing the king.',
      },
    ],
  },

  // Openings
  {
    id: 'l003',
    title: "The Italian Game",
    category: 'opening',
    difficulty: 1,
    description: 'One of the oldest and most popular openings. Learn the ideas behind 1.e4 e5 2.Nf3 Nc6 3.Bc4.',
    sections: [
      {
        heading: 'The Opening Moves',
        body: "The Italian Game begins with 1.e4 e5 2.Nf3 Nc6 3.Bc4. White develops the bishop to an active square pointing at f7, one of Black's weakest points early in the game.",
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
        caption: 'The Italian Game after 1.e4 e5 2.Nf3 Nc6 3.Bc4.',
      },
      {
        heading: 'The Main Idea',
        body: 'White aims to control the center, develop actively, and create pressure on f7. The Bc4 also prepares a quick castle. Black must respond carefully to avoid early tactical problems.',
        fen: 'r1bqk1nr/pppp1ppp/2n5/4p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R b KQkq - 5 4',
        caption: 'White develops harmoniously with Nc3, targeting the center.',
      },
      {
        heading: 'Common Response: The Giuoco Piano',
        body: "Black can mirror White's development with 3...Bc5, the Giuoco Piano (\"quiet game\"). Both sides develop naturally and fight for central control. This leads to rich strategic battles.",
        fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        caption: '3...Bc5 — the Giuoco Piano.',
      },
    ],
  },
  {
    id: 'l004',
    title: "The Sicilian Defence",
    category: 'opening',
    difficulty: 2,
    description: "The most popular response to 1.e4. Black fights for the center asymmetrically.",
    sections: [
      {
        heading: 'Why 1...c5?',
        body: "After 1.e4, Black plays 1...c5 — the Sicilian Defence. Instead of matching White's center pawn, Black attacks d4 from the side. This creates an asymmetrical position with rich tactical and strategic possibilities.",
        fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2',
        caption: "The Sicilian Defence — 1.e4 c5.",
      },
      {
        heading: 'The Open Sicilian',
        body: "White usually continues 2.Nf3 and 3.d4, opening the center. After 2...d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 we reach the Open Sicilian — one of the sharpest and most studied positions in chess.",
        fen: 'rnbqkb1r/pp2pppp/3p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R b KQkq - 1 5',
        caption: "The Open Sicilian — sharp, double-edged play ahead.",
      },
      {
        heading: 'Key Ideas for Black',
        body: "Black typically has a queenside majority and will often castle kingside while launching a queenside pawn advance (a5-a4 or b5-b4). White usually attacks on the kingside. Both sides play for the win.",
        fen: 'r1bqkb1r/pp2pppp/2np1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 2 6',
        caption: "Both sides have active plans — imbalanced and exciting.",
      },
    ],
  },

  // Endgames
  {
    id: 'l005',
    title: 'King and Pawn Endgames',
    category: 'endgame',
    difficulty: 1,
    description: 'The foundation of all endgame play. Learn the key concepts of king activity and pawn promotion.',
    sections: [
      {
        heading: 'Activate Your King',
        body: 'In the endgame, the king becomes a powerful fighting piece. Unlike the middlegame, there is no longer a heavy-piece attack to fear. March your king toward the center or toward the pawns.',
        fen: '8/8/8/3k4/8/8/8/3K4 w - - 0 1',
        caption: 'The side with the more active king often wins.',
      },
      {
        heading: 'The Opposition',
        body: 'Two kings are in "opposition" when they face each other with one square between them. The side that does NOT have to move holds the opposition and has the advantage — the opposing king must give way.',
        fen: '8/8/8/3k4/8/3K4/8/8 w - - 0 1',
        caption: 'White holds the opposition. Black must step aside.',
      },
      {
        heading: 'The Square Rule',
        body: "To know if a king can catch a passed pawn: draw a square from the pawn to the promotion square. If the defending king can step into that square, it can catch the pawn. Otherwise, the pawn promotes.",
        fen: '8/8/8/8/3P4/8/8/7k w - - 0 1',
        caption: "Can Black's king catch the pawn? Apply the square rule.",
      },
    ],
  },
  {
    id: 'l006',
    title: 'Rook Endgames',
    category: 'endgame',
    difficulty: 2,
    description: 'The most common endgame type. Learn the Lucena and Philidor positions.',
    sections: [
      {
        heading: 'Rooks Belong Behind Passed Pawns',
        body: "The golden rule: place your rook behind a passed pawn — yours or your opponent's. Behind your own pawn, the rook gains power as the pawn advances. Behind your opponent's pawn, the rook restrains it.",
        fen: '8/8/8/3p4/8/8/8/3R4 w - - 0 1',
        caption: "White's rook behind the passed pawn restrains its advance.",
      },
      {
        heading: 'The Philidor Position (Draw)',
        body: "The Philidor position is a key drawing technique. With king on e6, pawn on e5, and White's rook, the defending side places its rook on the third rank. When the pawn advances to the 6th rank, switch the rook to the back rank for checking distance.",
        fen: '8/8/4k3/4P3/8/r7/8/4K2R w - - 0 1',
        caption: "Black's rook on the 3rd rank — the Philidor draw.",
      },
      {
        heading: 'Active Rook',
        body: "Keep your rook active. A passive rook defending from behind is almost always worse than an active rook creating threats. When your rook has no targets, activate it on the 7th rank to attack pawns.",
        fen: '8/1R6/8/8/8/8/1r6/8 w - - 0 1',
        caption: "Both rooks are active on the 7th rank.",
      },
    ],
  },

  // Tactics
  {
    id: 'l007',
    title: 'Forks',
    category: 'tactics',
    difficulty: 1,
    description: 'Attack two pieces at once to win material.',
    sections: [
      {
        heading: 'What is a Fork?',
        body: 'A fork is a tactic where one piece attacks two (or more) enemy pieces simultaneously. The opponent can only save one, so the other is lost. Any piece can fork, but knights are the most notorious forkers.',
        fen: '8/8/8/8/8/8/8/8 w - - 0 1',
        caption: 'Any piece can deliver a fork.',
      },
      {
        heading: 'The Knight Fork',
        body: "Knights are the best forking pieces because they move in an L-shape that can't be blocked. A classic knight fork attacks the king and a rook (a 'royal fork') — the opponent must move their king, and the rook falls.",
        fen: '4k3/8/8/3N4/8/8/8/4K3 w - - 0 1',
        caption: "The knight on d5 can fork king and multiple squares.",
      },
      {
        heading: 'The Pawn Fork',
        body: "Pawn forks are easy to overlook but very effective. A single pawn advance can attack two pieces at once. Always check if a pawn advance creates a fork before playing defensive moves.",
        fen: '4k3/8/3r1r2/4P3/8/8/8/4K3 w - - 0 1',
        caption: "e5-e6 would fork the two rooks... but it's White's pawn turn.",
      },
    ],
  },
  {
    id: 'l008',
    title: 'Pins and Skewers',
    category: 'tactics',
    difficulty: 2,
    description: 'Two powerful line-piece tactics that restrict and win enemy pieces.',
    sections: [
      {
        heading: 'The Pin',
        body: "A pin is when a piece cannot move without exposing a more valuable piece behind it. An absolute pin means the piece cannot legally move (it shields the king). A relative pin means moving would lose a valuable piece but is technically legal.",
        fen: '4k3/8/8/8/8/8/4R3/4K3 w - - 0 1',
        caption: "Rooks, bishops, and queens can all create pins.",
      },
      {
        heading: 'The Skewer',
        body: "A skewer is the reverse of a pin. You attack a valuable piece directly. When it moves to safety, you capture the less valuable piece behind it. The queen or rook attacking a king is a common skewer setup.",
        fen: '4k3/8/8/8/8/8/8/R3K3 w Q - 0 1',
        caption: "A skewer forces the more valuable piece to move.",
      },
      {
        heading: 'Using Pins Strategically',
        body: "Pins can be used both tactically (to win material) and strategically (to restrict a piece for the whole game). A bishop pinning a knight to the queen is a common opening tactic. Reinforce the pin by attacking the pinned piece multiple times.",
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        caption: "The Bc4 and the f6 knight — potential pin themes here.",
      },
    ],
  },
]
