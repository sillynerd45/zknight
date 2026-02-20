import { useState, useEffect, useCallback } from 'react';
import { ScaledContainer } from '@/components/ScaledContainer';
import { GameScene } from '@/components/GameScene';
import { GameProvider, useGameContext } from '@/context/GameContext';
import { useKeyboardInput } from '@/hooks/useKeyboardInput';
import { GameHUD } from '@/components/GameHUD';
import lobbyStyles from './lobby/lobbyStyles.module.css';
import { ExplosionOverlay } from '@/components/GameOverlays';
import { Toast } from '@/components/Toast';
import { SolveProgressOverlay } from './SolveProgressOverlay';
// CycleNotice removed - cycle detection disabled
import { PUZZLES } from '@/puzzles';
import type { Puzzle } from '@/game/types';
import type { Puzzle as ContractPuzzle, Game } from './bindings';
import { EditorSelector, BackgroundEditor, PuzzleEditor } from '@/editor';
import { LobbyView } from './lobby';
import { OnChainGameProvider, useOnChainGameContext } from './OnChainGameContext';
import { useWalletStandalone } from '@/hooks/useWalletStandalone';
import { ZknightService } from './zknightService';
import { networks } from './bindings';

type GameView = 'lobby' | 'game' | 'editor';

function GamePlayView({ onBack }: { onBack: () => void }) {
  const { state, dispatch, puzzle } = useGameContext();
  const onChainGame = useOnChainGameContext();
  const wallet = useWalletStandalone();

  const [showExplosionOverlay, setShowExplosionOverlay] = useState(false);
  const [showSolveProgress, setShowSolveProgress] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [solveElapsed, setSolveElapsed] = useState(0);

  useKeyboardInput();

  // Start game on mount
  useEffect(() => {
    dispatch({ type: 'START' });
  }, [dispatch]);

  // Reset showExplosionOverlay when game resets
  useEffect(() => {
    if (state.gameStatus !== 'exploded') {
      setShowExplosionOverlay(false);
    }
  }, [state.gameStatus]);

  // Show solve progress overlay after win animation (600ms delay).
  // Stays open through the result phase — dismissed only via onBack/onPlayAgain.
  useEffect(() => {
    if (state.gameStatus === 'won') {
      const timer = setTimeout(() => {
        setShowSolveProgress(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [state.gameStatus]);

  // When player wins locally, trigger on-chain flow
  useEffect(() => {
    if (state.gameStatus === 'won' && !onChainGame.hasCommitted && state.tickHistory.length > 0) {
      onChainGame.handleLocalWin(state.tickCount, state.tickHistory);
    }
    // Only depend on gameStatus and hasCommitted to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameStatus, onChainGame.hasCommitted]);

  const handleExplosionComplete = useCallback(() => {
    setShowExplosionOverlay(true);
  }, []);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
    dispatch({ type: 'START' });
  }, [dispatch]);

  const handlePlayAgain = useCallback(() => {
    setShowSolveProgress(false);
    onChainGame.clearGame();
    onBack();
  }, [onChainGame, onBack]);

  const handleRetry = useCallback(() => {
    onChainGame.handleLocalWin(state.tickCount, state.tickHistory);
  }, [onChainGame, state.tickCount, state.tickHistory]);

  // Capture elapsed time at the moment the puzzle is solved (frozen, not live)
  useEffect(() => {
    if (state.gameStatus === 'won' && state.startTime) {
      setSolveElapsed(Date.now() - state.startTime);
    }
  }, [state.gameStatus, state.startTime]);

  const isProofInProgress = showSolveProgress && !onChainGame.gameFinished;

  return (
    <ScaledContainer>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <GameScene
          puzzle={puzzle}
          knightA={state.knightA}
          knightB={state.knightB}
          barrels={state.barrels}
          gameStatus={state.gameStatus}
          lastDirection={state.lastDirection}
          explodedKnights={state.explodedKnights}
          destroyedStaticTNT={state.destroyedStaticTNT}
          crossingExplosionPos={state.crossingExplosionPos}
          onExplosionComplete={handleExplosionComplete}
        />
        <GameHUD />
        {/* CycleNotice removed - cycle detection disabled */}

        {/* Explosion overlay */}
        {state.gameStatus === 'exploded' && showExplosionOverlay && (
          <ExplosionOverlay onReset={handleReset} />
        )}

        {/* Unified overlay: progress steps → result (stays open until dismissed) */}
        {showSolveProgress && (
          <SolveProgressOverlay
            turnCount={state.turnCount}
            elapsed={solveElapsed}
            currentPlayer={wallet.publicKey || ''}
            onRetry={handleRetry}
            onBack={handlePlayAgain}
          />
        )}

        {/* Error toast only when overlay is not showing */}
        {onChainGame.error && !showSolveProgress && (
          <Toast message={onChainGame.error} onDismiss={onChainGame.resetError} />
        )}

        {/* Confirm leave dialog */}
        {showLeaveConfirm && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 25, 35, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}>
            <div className={lobbyStyles.solveCard}>
              <div className={lobbyStyles.solveCardHeader}>
                <h2 className={lobbyStyles.solveCardTitle}>LEAVE GAME?</h2>
              </div>
              <div style={{ padding: '1.25rem 1.75rem' }}>
                {isProofInProgress && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: '#F2D06B',
                    border: '3px solid #1a1a1a',
                    marginBottom: '1rem',
                    fontFamily: "'VT323', monospace",
                    fontSize: '1.2rem',
                    color: '#1a1a1a',
                    letterSpacing: '0.5px',
                  }}>
                    ⚠ ZK PROOF IN PROGRESS — leaving now may cause you to forfeit the match.
                  </div>
                )}
                <p style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: '1.3rem',
                  color: '#555',
                  margin: 0,
                  letterSpacing: '0.5px',
                }}>
                  You will abandon this puzzle. Your progress will be lost.
                </p>
              </div>
              <div className={lobbyStyles.resultActions} style={{ padding: '0 1.75rem 1.25rem' }}>
                <button
                  className={lobbyStyles.btnGhost}
                  onClick={() => setShowLeaveConfirm(false)}
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  CANCEL
                </button>
                <button
                  className={lobbyStyles.btnDanger}
                  onClick={onBack}
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  LEAVE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <button
        onClick={() => setShowLeaveConfirm(true)}
        style={{
          position: 'fixed',
          top: 8,
          right: 8,
          zIndex: 9999,
          fontFamily: "'VT323', monospace",
          fontSize: 18,
          letterSpacing: '1px',
          padding: '6px 14px',
          border: '3px solid #1a1a1a',
          cursor: 'pointer',
          boxShadow: '4px 4px 0px 0px #1a1a1a',
          textTransform: 'uppercase',
          background: '#e0d5b8',
          color: '#1a1a1a',
          transition: 'transform 0.1s, box-shadow 0.1s',
        }}
      >
        BACK TO LOBBY
      </button>
    </ScaledContainer>
  );
}

/**
 * Convert contract Puzzle to frontend Puzzle type
 */
function contractPuzzleToFrontend(contractPuzzle: ContractPuzzle): Puzzle {
  return {
    id: String(contractPuzzle.id),
    name: `Puzzle ${contractPuzzle.id}`,
    gridWidth: contractPuzzle.grid_width,
    gridHeight: contractPuzzle.grid_height,
    knightA: {
      x: contractPuzzle.knight_a_start.x,
      y: contractPuzzle.knight_a_start.y,
    },
    knightB: {
      x: contractPuzzle.knight_b_start.x,
      y: contractPuzzle.knight_b_start.y,
    },
    goalA: {
      x: contractPuzzle.goal_a.x,
      y: contractPuzzle.goal_a.y,
    },
    goalB: {
      x: contractPuzzle.goal_b.x,
      y: contractPuzzle.goal_b.y,
    },
    walls: contractPuzzle.walls.map(w => ({ x: w.x, y: w.y })),
    staticTNT: contractPuzzle.static_tnt.map(t => ({ x: t.x, y: t.y })),
    movingTNT: contractPuzzle.moving_barrels.map(b => ({
      id: `barrel-${contractPuzzle.id}-${b.path[0]?.x}-${b.path[0]?.y}`,
      path: b.path.map(p => ({ x: p.x, y: p.y })),
      loop: true, // Assume all contract barrels loop
    })),
  };
}

export function ZknightGame() {
  const wallet = useWalletStandalone();
  const [view, setView] = useState<GameView>('lobby');
  const [editorSubView, setEditorSubView] = useState<'background' | 'puzzle' | null>(null);
  const [selectedPuzzle, setSelectedPuzzle] = useState<Puzzle>(PUZZLES[0]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [contractPuzzle, setContractPuzzle] = useState<ContractPuzzle | null>(null);
  const [isPlayer1, setIsPlayer1] = useState(false);
  const [service] = useState(() => new ZknightService(networks.testnet.contractId));

  const handleLeaveEditor = useCallback(() => {
    setEditorSubView(null);
    setView('lobby');
  }, []);

  const handleGameStart = useCallback(async (game: Game, player1: boolean) => {
    // Fetch puzzle from contract
    if (game.puzzle_id === undefined) {
      console.error('[ZknightGame] Game has no puzzle_id');
      return;
    }

    try {
      const puzzle = await service.getPuzzle(game.puzzle_id);
      if (!puzzle) {
        console.error('[ZknightGame] Failed to fetch puzzle');
        return;
      }

      const frontendPuzzle = contractPuzzleToFrontend(puzzle);
      setSelectedPuzzle(frontendPuzzle);
      setContractPuzzle(puzzle);
      setCurrentGame(game);
      setIsPlayer1(player1);
      setView('game');
    } catch (err) {
      console.error('[ZknightGame] Error fetching puzzle:', err);
    }
  }, [service]);

  const handleOpenEditor = useCallback(() => {
    setEditorSubView(null);
    setView('editor');
  }, []);

  const handleBackToLobby = useCallback(() => {
    setView('lobby');
    setCurrentGame(null);
  }, []);

  switch (view) {
    case 'lobby':
      return <LobbyView onGameStart={handleGameStart} onOpenEditor={handleOpenEditor} />;

    case 'game':
      if (!currentGame || !contractPuzzle || !wallet.publicKey) {
        // Fallback if game data is missing
        return <div>Loading game...</div>;
      }

      return (
        <OnChainGameProvider
          playerAddress={wallet.publicKey}
          signer={wallet.getContractSigner()}
          service={service}
        >
          <GameProvider puzzle={selectedPuzzle}>
            <GamePlayViewWithInit
              game={currentGame}
              puzzle={contractPuzzle}
              isPlayer1={isPlayer1}
              onBack={handleBackToLobby}
            />
          </GameProvider>
        </OnChainGameProvider>
      );

    case 'editor':
      if (editorSubView === 'background') {
        return <BackgroundEditor onBack={() => setEditorSubView(null)} />;
      }
      if (editorSubView === 'puzzle') {
        return <PuzzleEditor onBack={() => setEditorSubView(null)} />;
      }
      return (
        <EditorSelector
          onSelect={setEditorSubView}
          onBack={handleLeaveEditor}
        />
      );
  }
}

/**
 * Wrapper component that initializes OnChainGameContext with game data
 */
function GamePlayViewWithInit({
  game,
  puzzle,
  isPlayer1,
  onBack,
}: {
  game: Game;
  puzzle: ContractPuzzle;
  isPlayer1: boolean;
  onBack: () => void;
}) {
  const onChainGame = useOnChainGameContext();

  // Initialize on-chain game context on mount (only once)
  useEffect(() => {
    onChainGame.initGame(game, puzzle, isPlayer1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <GamePlayView onBack={onBack} />;
}
