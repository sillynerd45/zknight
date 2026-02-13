import {
    createContext,
    useContext,
    useReducer,
    useCallback,
    useState,
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
    cycleJustPruned: boolean;
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
    const [cycleJustPruned, setCycleJustPruned] = useState(false);

    // Watch the _cyclePruned flag from the reducer
    useEffect(() => {
        if (state._cyclePruned) {
            setCycleJustPruned(true);
        }
    }, [state._cyclePruned, state.turnCount]);

    // Auto-clear cycle notice after 1 second
    useEffect(() => {
        if (!cycleJustPruned) return;
        const timer = setTimeout(() => setCycleJustPruned(false), 1000);
        return () => clearTimeout(timer);
    }, [cycleJustPruned]);

    // Auto-advance barrels every 1200ms when playing
    useEffect(() => {
        if (state.gameStatus !== 'playing') return;

        const interval = setInterval(() => {
            dispatch({type: 'ADVANCE_BARRELS'});
        }, 1200);

        return () => clearInterval(interval);
    }, [state.gameStatus, dispatch]);

    return (
        <GameContext.Provider value={{state, dispatch, puzzle, cycleJustPruned}}>
            {children}
        </GameContext.Provider>
    );
}

export function useGameContext(): GameContextValue {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error('useGameContext must be used within GameProvider');
    return ctx;
}
