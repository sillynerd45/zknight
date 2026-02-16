import { useState, useEffect, useCallback } from 'react';
import { ScaledContainer } from '@/components/ScaledContainer';
import { GameScene } from '@/components/GameScene';
import { GameProvider, useGameContext } from '@/context/GameContext';
import { useKeyboardInput } from '@/hooks/useKeyboardInput';
import { MoveCounter } from '@/components/MoveCounter';
import { RaceTimer } from '@/components/RaceTimer';
import { WinOverlay, ExplosionOverlay } from '@/components/GameOverlays';
import { ProofGenerationOverlay } from '@/components/ProofGenerationOverlay';
import { Toast } from '@/components/Toast';
// CycleNotice removed - cycle detection disabled
import { PUZZLES } from '@/puzzles';
import type { Puzzle } from '@/game/types';
import type { Puzzle as ContractPuzzle, Game } from './bindings';
import { EditorSelector, BackgroundEditor, PuzzleEditor } from '@/editor';
import { LobbyView } from './lobby';
import { OnChainGameProvider, useOnChainGameContext } from './OnChainGameContext';
import { useWalletStandalone } from '@/hooks/useWalletStandalone';
import { GameResultScreen } from './lobby/GameResultScreen';
import { ZknightService } from './zknightService';
import { networks } from './bindings';

type GameView = 'lobby' | 'game' | 'editor';

function GamePlayView({ onBack }: { onBack: () => void }) {
  const { state, dispatch, puzzle } = useGameContext();
  const onChainGame = useOnChainGameContext();
  const wallet = useWalletStandalone();

  const [showExplosionOverlay, setShowExplosionOverlay] = useState(false);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [showGameResult, setShowGameResult] = useState(false);

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

  // Show win overlay after animation completes (600ms delay)
  // BUT only if game is not finished (don't show local win if game already over)
  useEffect(() => {
    if (state.gameStatus === 'won' && !onChainGame.gameFinished) {
      const timer = setTimeout(() => {
        setShowWinOverlay(true);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setShowWinOverlay(false);
    }
  }, [state.gameStatus, onChainGame.gameFinished]);

  // When player wins locally, trigger on-chain flow
  useEffect(() => {
    if (state.gameStatus === 'won' && !onChainGame.hasCommitted && state.tickHistory.length > 0) {
      onChainGame.handleLocalWin(state.tickCount, state.tickHistory);
    }
    // Only depend on gameStatus and hasCommitted to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameStatus, onChainGame.hasCommitted]);

  // Show game result screen when both players reveal
  useEffect(() => {
    if (onChainGame.gameFinished) {
      setShowGameResult(true);
    }
  }, [onChainGame.gameFinished]);

  const handleExplosionComplete = useCallback(() => {
    setShowExplosionOverlay(true);
  }, []);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
    dispatch({ type: 'START' });
  }, [dispatch]);

  const handlePlayAgain = useCallback(() => {
    setShowGameResult(false);
    onChainGame.clearGame();
    onBack();
  }, [onChainGame, onBack]);

  // Compute elapsed time for win overlay
  const elapsed = state.startTime ? Date.now() - state.startTime : 0;

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
        <MoveCounter />
        <RaceTimer />
        {/* CycleNotice removed - cycle detection disabled */}

        {/* Local win overlay (before on-chain flow completes) */}
        {showWinOverlay && !onChainGame.gameFinished && (
          <WinOverlay turnCount={state.turnCount} elapsed={elapsed} />
        )}

        {/* Explosion overlay */}
        {state.gameStatus === 'exploded' && showExplosionOverlay && (
          <ExplosionOverlay onReset={handleReset} />
        )}

        {/* Proof generation overlay */}
        {onChainGame.isGeneratingProof && (
          <ProofGenerationOverlay progress={onChainGame.proofProgress} />
        )}

        {/* Error toast */}
        {onChainGame.error && (
          <Toast message={onChainGame.error} onDismiss={onChainGame.resetError} />
        )}

        {/* Game result screen (overlay on top of game board) */}
        {showGameResult && onChainGame.game && (
          <GameResultScreen
            winner={onChainGame.winner}
            player1={onChainGame.game.player1}
            player2={onChainGame.game.player2 !== undefined ? onChainGame.game.player2 : ''}
            player1TickCount={onChainGame.game.p1_tick_count !== undefined ? Number(onChainGame.game.p1_tick_count) : null}
            player2TickCount={onChainGame.game.p2_tick_count !== undefined ? Number(onChainGame.game.p2_tick_count) : null}
            player1CommitTime={onChainGame.game.p1_commit_time !== undefined ? Number(onChainGame.game.p1_commit_time) : null}
            player2CommitTime={onChainGame.game.p2_commit_time !== undefined ? Number(onChainGame.game.p2_commit_time) : null}
            currentPlayer={wallet.publicKey || ''}
            onPlayAgain={handlePlayAgain}
            onBackToLobby={handlePlayAgain}
          />
        )}
      </div>
      <button
        onClick={onBack}
        style={{
          position: 'fixed',
          top: 8,
          right: 8,
          zIndex: 9999,
          background: '#fff',
          color: '#000',
          border: 'none',
          padding: '4px 12px',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: 12,
        }}
      >
        Back to Lobby
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
      x: contractPuzzle.knight_b_start.x,
      y: contractPuzzle.knight_b_start.y,
    },
    goalB: {
      x: contractPuzzle.knight_a_start.x,
      y: contractPuzzle.knight_a_start.y,
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
