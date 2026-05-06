// Stockfish web worker — loads from public/stockfish.js
declare function importScripts(...urls: string[]): void

// importScripts only works in classic workers
// We use self.postMessage to communicate back

let stockfish: { postMessage: (msg: string) => void; onmessage: (line: string) => void } | null = null

async function initStockfish() {
  try {
    // Load stockfish from public folder
    importScripts('/stockfish.js')

    // @ts-ignore — Stockfish is loaded via importScripts
    const sf = Stockfish()
    sf.onmessage = (line: string) => {
      self.postMessage(line)
    }
    stockfish = sf
    sf.postMessage('uci')
    sf.postMessage('isready')
  } catch (e) {
    console.error('Failed to load Stockfish:', e)
  }
}

initStockfish()

self.onmessage = (e: MessageEvent) => {
  if (stockfish) {
    stockfish.postMessage(e.data)
  }
}
