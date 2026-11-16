// Display-side copy of the bot-win reward formula. The server
// (award_bot_win) is authoritative; keep the two in sync.
export function botWinReward(botElo: number, assists = 0): number {
  const elo = Math.min(Math.max(botElo, 200), 2600)
  const base = Math.round(5 + Math.pow((elo - 200) / 2400, 2) * 75)
  return Math.max(base - Math.max(assists, 0), 0)
}
