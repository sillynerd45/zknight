import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type { Game, Puzzle } from './bindings';
import { ZknightService } from './zknightService';
import { generatePreimage, computeCommitment } from './utils/commitment';
import { encodeProof } from './utils/encodeProof';
import { padMoveHistory } from './utils/paddedMoves';
import type { MoveValue } from '@/game/types';

// ============================================================================
// Types
// ============================================================================

interface OnChainGameState {
  gameId: number | null;
  isPlayer1: boolean;
  game: Game | null;
  puzzle: Puzzle | null;

  // Commitment phase
  preimage: Uint8Array | null;
  commitment: Uint8Array | null;
  hasCommitted: boolean;

  // Proof generation phase
  isGeneratingProof: boolean;
  proofProgress: string;
  proof: Uint8Array | null;

  // Reveal phase
  hasRevealed: boolean;

  // Opponent state (from polling)
  opponentCommitted: boolean;
  opponentRevealed: boolean;

  // Result
  gameFinished: boolean;
  winner: string | null;

  // Error handling (toast)
  error: string | null;
}

interface OnChainGameContextValue extends OnChainGameState {
  initGame: (game: Game, puzzle: Puzzle, isPlayer1: boolean) => void;
  handleLocalWin: (tickCount: number, tickHistory: MoveValue[]) => Promise<void>;
  resetError: () => void;
  clearGame: () => void;
}

// ============================================================================
// Context
// ============================================================================

const OnChainGameContext = createContext<OnChainGameContextValue | null>(null);

export function useOnChainGameContext() {
  const context = useContext(OnChainGameContext);
  if (!context) {
    throw new Error('useOnChainGameContext must be used within OnChainGameProvider');
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

const STORAGE_KEY = 'zknight_active_game';
const POLL_INTERVAL = 5000; // 5 seconds

interface Props {
  children: React.ReactNode;
  playerAddress: string;
  signer: any; // ContractSigner from wallet
  service: ZknightService;
}

export function OnChainGameProvider({ children, playerAddress, signer, service }: Props) {
  const [state, setState] = useState<OnChainGameState>({
    gameId: null,
    isPlayer1: false,
    game: null,
    puzzle: null,
    preimage: null,
    commitment: null,
    hasCommitted: false,
    isGeneratingProof: false,
    proofProgress: '',
    proof: null,
    hasRevealed: false,
    opponentCommitted: false,
    opponentRevealed: false,
    gameFinished: false,
    winner: null,
    error: null,
  });

  const workerRef = useRef<Worker | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // LocalStorage Persistence
  // ============================================================================

  // Save game ID to localStorage
  useEffect(() => {
    if (state.gameId !== null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        gameId: state.gameId,
        isPlayer1: state.isPlayer1,
      }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state.gameId, state.isPlayer1]);

  // Restore game from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && !state.gameId) {
      try {
        const { gameId, isPlayer1 } = JSON.parse(stored);
        // Attempt to fetch game from contract
        service.getGame(gameId).then(async (game) => {
          if (game && game.status.tag !== 'Cancelled' && game.puzzle_id !== undefined) {
            // Fetch puzzle
            const puzzle = await service.getPuzzle(game.puzzle_id);
            if (puzzle) {
              setState((prev) => ({
                ...prev,
                gameId,
                isPlayer1,
                game,
                puzzle,
              }));
            } else {
              localStorage.removeItem(STORAGE_KEY);
            }
          } else {
            // Game no longer valid, clear storage
            localStorage.removeItem(STORAGE_KEY);
          }
        }).catch(() => {
          // Failed to restore, clear storage
          localStorage.removeItem(STORAGE_KEY);
        });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [service]);

  // ============================================================================
  // Initialize Game
  // ============================================================================

  const initGame = useCallback((game: Game, puzzle: Puzzle, isPlayer1: boolean) => {
    setState({
      gameId: game.id,
      isPlayer1,
      game,
      puzzle,
      preimage: null,
      commitment: null,
      hasCommitted: false,
      isGeneratingProof: false,
      proofProgress: '',
      proof: null,
      hasRevealed: false,
      opponentCommitted: false,
      opponentRevealed: false,
      gameFinished: false,
      winner: null,
      error: null,
    });
  }, []);

  // ============================================================================
  // Clear Game (return to lobby)
  // ============================================================================

  const clearGame = useCallback(() => {
    // Stop polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Terminate worker
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    // Clear state
    setState({
      gameId: null,
      isPlayer1: false,
      game: null,
      puzzle: null,
      preimage: null,
      commitment: null,
      hasCommitted: false,
      isGeneratingProof: false,
      proofProgress: '',
      proof: null,
      hasRevealed: false,
      opponentCommitted: false,
      opponentRevealed: false,
      gameFinished: false,
      winner: null,
      error: null,
    });

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // ============================================================================
  // Handle Local Win (Commit → Prove → Reveal)
  // ============================================================================

  const handleLocalWin = useCallback(
    async (tickCount: number, tickHistory: MoveValue[]) => {
      if (!state.gameId || !state.puzzle || state.hasCommitted) return;

      try {
        // 1. Generate preimage and commitment
        const preimage = generatePreimage();
        const commitment = await computeCommitment(preimage);

        setState((prev) => ({
          ...prev,
          preimage,
          commitment,
        }));

        // 2. Commit to contract
        await service.commitSolve(
          state.gameId,
          playerAddress,
          commitment,
          signer
        );

        setState((prev) => ({
          ...prev,
          hasCommitted: true,
        }));

        // 3. Start proof generation in Web Worker
        setState((prev) => ({
          ...prev,
          isGeneratingProof: true,
          proofProgress: 'Loading circuit...',
        }));

        const worker = new Worker('/prove.worker.js');
        workerRef.current = worker;

        // Pass puzzle data to worker (worker handles circuit format conversion)
        const puzzle = state.puzzle;
        const workerInput = {
          moves: padMoveHistory(tickHistory, 512),
          puzzle: {
            id: puzzle.id,
            grid_width: puzzle.grid_width,
            grid_height: puzzle.grid_height,
            walls: puzzle.walls,
            static_tnt: puzzle.static_tnt,
            moving_barrels: puzzle.moving_barrels,
            knight_a_start: puzzle.knight_a_start,
            knight_b_start: puzzle.knight_b_start,
          },
          tick_count: tickCount,
        };

        worker.postMessage(workerInput);

        worker.onmessage = async (e) => {
          if (e.data.error) {
            setState((prev) => ({
              ...prev,
              error: `Proof generation failed: ${e.data.error}`,
              isGeneratingProof: false,
              proofProgress: '',
            }));
            worker.terminate();
            workerRef.current = null;
            return;
          }

          try {
            // 4. Encode proof
            setState((prev) => ({
              ...prev,
              proofProgress: 'Encoding proof...',
            }));

            const encodedProof = encodeProof(e.data.proof);

            setState((prev) => ({
              ...prev,
              proof: encodedProof,
            }));

            // 5. Reveal solution with proof
            setState((prev) => ({
              ...prev,
              proofProgress: 'Submitting proof to contract...',
            }));

            await service.revealSolve(
              state.gameId!,
              playerAddress,
              preimage,
              encodedProof,
              tickCount,
              signer
            );

            setState((prev) => ({
              ...prev,
              hasRevealed: true,
              isGeneratingProof: false,
              proofProgress: '',
            }));

            worker.terminate();
            workerRef.current = null;
          } catch (err: any) {
            setState((prev) => ({
              ...prev,
              error: err.message || 'Failed to reveal solution',
              isGeneratingProof: false,
              proofProgress: '',
            }));
            worker.terminate();
            workerRef.current = null;
          }
        };

        worker.onerror = (err) => {
          setState((prev) => ({
            ...prev,
            error: `Worker error: ${err.message}`,
            isGeneratingProof: false,
            proofProgress: '',
          }));
          worker.terminate();
          workerRef.current = null;
        };
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          error: err.message || 'Failed to commit solution',
          isGeneratingProof: false,
        }));
      }
    },
    [state.gameId, state.puzzle, state.hasCommitted, playerAddress, signer, service]
  );

  // ============================================================================
  // Poll Game State
  // ============================================================================

  useEffect(() => {
    if (!state.gameId || state.gameFinished) return;

    const poll = async () => {
      try {
        const game = await service.getGame(state.gameId!);
        if (!game) return;

        // Update game object
        setState((prev) => ({
          ...prev,
          game,
        }));

        // Check opponent commitment
        const opponentCommitField = state.isPlayer1 ? 'p2_committed' : 'p1_committed';
        const opponentCommitted = game[opponentCommitField];

        setState((prev) => ({
          ...prev,
          opponentCommitted,
        }));

        // Check if game finished
        if (game.status.tag === 'Finished') {
          setState((prev) => ({
            ...prev,
            gameFinished: true,
            winner: game.winner || null,
          }));

          // Stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch (err) {
        console.error('Error polling game state:', err);
      }
    };

    // Poll immediately, then every 5 seconds
    poll();
    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [state.gameId, state.gameFinished, state.isPlayer1, service]);

  // ============================================================================
  // Error Handling
  // ============================================================================

  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Auto-dismiss error after 8 seconds
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        resetError();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [state.error, resetError]);

  // ============================================================================
  // Cleanup on Unmount
  // ============================================================================

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: OnChainGameContextValue = {
    ...state,
    initGame,
    handleLocalWin,
    resetError,
    clearGame,
  };

  return (
    <OnChainGameContext.Provider value={value}>
      {children}
    </OnChainGameContext.Provider>
  );
}
