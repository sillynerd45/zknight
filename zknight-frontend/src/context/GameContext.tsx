import {
    createContext,
    useContext,
    useReducer,
    useCallback,
    useEffect,
    useRef,
    type ReactNode,
    type Dispatch,
} from 'react';
import type {Puzzle} from '@/game/types';
import {
    gameReducer,
    createInitialState,
    type ReducerState,
    type GameAction,
} from '@/game/gameReducer';

interface GameContextValue {
    state: ReducerState;
    dispatch: Dispatch<GameAction>;
    puzzle: Puzzle;
    scheduleNoOpTick: () => void;  // Reset the NoOp timer (called by keyboard handler)
    // cycleJustPruned removed - cycle detection disabled
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
    puzzle: Puzzle;
    children: ReactNode;
}

export function GameProvider({puzzle, children}: GameProviderProps) {
    const puzzleRef = useRef(puzzle);
    puzzleRef.current = puzzle;

    const reducer = useCallback(
        (state: ReducerState, action: GameAction) =>
            gameReducer(state, action, puzzleRef.current),
        [],
    );

    const [state, dispatch] = useReducer(reducer, puzzle, createInitialState);
    // cycleJustPruned state removed - cycle detection disabled

    const noOpTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Schedule the next NoOp tick (600ms from now)
    // Use ref to break circular dependency in recursive callback
    const scheduleRef = useRef<(() => void) | undefined>(undefined);

    useEffect(() => {
        scheduleRef.current = () => {
            clearTimeout(noOpTimerRef.current);
            noOpTimerRef.current = setTimeout(() => {
                dispatch({type: 'TICK', move: 4, direction: null});  // NoOp tick
                scheduleRef.current?.(); // Chain next NoOp
            }, 600);
        };
    }, [dispatch]);

    const scheduleNoOpTick = useCallback(() => {
        scheduleRef.current?.();
    }, []);

    // Start NoOp ticking when game starts playing
    useEffect(() => {
        if (state.gameStatus === 'playing') {
            scheduleNoOpTick();
        }
        return () => clearTimeout(noOpTimerRef.current);
    }, [state.gameStatus, scheduleNoOpTick]);

    return (
        <GameContext.Provider value={{state, dispatch, puzzle, scheduleNoOpTick}}>
            {children}
        </GameContext.Provider>
    );
}

export function useGameContext(): GameContextValue {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error('useGameContext must be used within GameProvider');
    return ctx;
}
