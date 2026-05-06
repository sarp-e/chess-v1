import { useEffect, useRef, useCallback } from 'react'

interface UseStockfishOptions {
  depth: number
  onBestMove: (move: string) => void
}

export function useStockfish({ depth, onBestMove }: UseStockfishOptions) {
  const workerRef = useRef<Worker | null>(null)
  const onBestMoveRef = useRef(onBestMove)
  onBestMoveRef.current = onBestMove

  useEffect(() => {
    // stockfish-lite-single.js is designed to run directly as a Web Worker.
    // When loaded in a worker context it auto-detects and sets up postMessage I/O.
    const worker = new Worker('/stockfish.js')

    worker.onmessage = (e: MessageEvent) => {
      const line: string = typeof e.data === 'string' ? e.data : String(e.data)
      if (line.startsWith('bestmove')) {
        const parts = line.split(' ')
        const move = parts[1]
        if (move && move !== '(none)') {
          onBestMoveRef.current(move)
        }
      }
    }

    worker.onerror = (e) => {
      console.error('Stockfish worker error:', e)
    }

    worker.postMessage('uci')
    worker.postMessage('isready')

    workerRef.current = worker

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  const findBestMove = useCallback((fen: string, moveDepth?: number) => {
    const worker = workerRef.current
    if (!worker) return
    worker.postMessage(`position fen ${fen}`)
    worker.postMessage(`go depth ${moveDepth ?? depth}`)
  }, [depth])

  const stop = useCallback(() => {
    workerRef.current?.postMessage('stop')
  }, [])

  return { findBestMove, stop }
}
