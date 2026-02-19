import {useState, useEffect, useCallback} from 'react';
import {useWalletStandalone} from '@/hooks/useWalletStandalone';
import {ZknightService} from '../zknightService';
import {networks} from '../bindings';
import type {Game} from '../bindings';
import {CreateGamePanel} from './CreateGamePanel';
import {OpenGamesList} from './OpenGamesList';
import {JoinGamePanel} from './JoinGamePanel';
import {Toast} from '@/components/Toast';
import {retryWithBackoff} from './utils';
import {KnightLobbyDecor} from './KnightLobbyDecor';
import styles from './lobbyStyles.module.css';

interface LobbyViewProps {
    onGameStart: (game: Game, isPlayer1: boolean) => void;
    onOpenEditor?: () => void;
}

export function LobbyView({onGameStart, onOpenEditor}: LobbyViewProps) {
    const wallet = useWalletStandalone();
    const [service] = useState(() => new ZknightService(networks.testnet.contractId));
    const [openGames, setOpenGames] = useState<Game[]>([]);
    const [loadingGames, setLoadingGames] = useState(false);
    const [activeGameId, setActiveGameId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

    // Poll open games every 10 seconds with exponential backoff on failure
    useEffect(() => {
        let cancelled = false;
        let consecutiveFailures = 0;
        let isFirstFetch = true;

        const fetchOpenGames = async () => {
            if (cancelled) return;

            // Show loader only on initial check, not on background polls
            const showLoader = isFirstFetch;
            isFirstFetch = false;

            if (showLoader) setLoadingGames(true);
            try {
                const games = await retryWithBackoff(() => service.getOpenGames(), 2, 500, 5000);

                if (!cancelled) {
                    setOpenGames(games);
                    setIsReconnecting(false);
                    consecutiveFailures = 0;
                }
            } catch (err) {
                console.error('[LobbyView] Error fetching open games:', err);
                consecutiveFailures++;

                if (!cancelled && consecutiveFailures >= 3) {
                    setIsReconnecting(true);
                }
            } finally {
                if (!cancelled && showLoader) {
                    setLoadingGames(false);
                }
            }
        };

        // Initial fetch
        fetchOpenGames();

        // Poll every 6 seconds
        const interval = setInterval(fetchOpenGames, 6000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [service]);

    // Check if current player has an active game
    useEffect(() => {
        let cancelled = false;

        const checkActiveGame = async () => {
            if (!wallet.publicKey) {
                setActiveGameId(null);
                return;
            }

            try {
                const gameId = await service.getPlayerActiveGame(wallet.publicKey);
                if (!cancelled) {
                    setActiveGameId(gameId);
                }
            } catch (err) {
                console.error('[LobbyView] Error checking active game:', err);
            }
        };

        checkActiveGame();

        return () => {
            cancelled = true;
        };
    }, [wallet.publicKey, service]);

    const handleGameCreated = useCallback((gameId: number) => {
        setActiveGameId(gameId);
        setActiveTab('create'); // lock tab to create when waiting for opponent
        setError(null);
    }, []);

    const handleGameCancelled = useCallback(() => {
        setActiveGameId(null);
        setError(null);
    }, []);

    const handlePlayer1GameStart = useCallback((game: Game) => {
        onGameStart(game, true);
    }, [onGameStart]);

    const handleJoinSuccess = useCallback(async (gameId: number) => {
        try {
            const game = await service.getGame(gameId);
            if (game) {
                onGameStart(game, false);
            }
        } catch (err) {
            console.error('[LobbyView] Error fetching game after join:', err);
            setError('Failed to load game data');
        }
    }, [onGameStart, service]);

    const handleError = useCallback((message: string) => {
        setError(message);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return (
        <div className={styles.page}>
            {/* Header Bar */}
            <header className={styles.header}>
                <h1 className={styles.headerTitle}>ZKnight</h1>
                <p className={styles.headerTagline}>Mirror your moves. Seal your fate.</p>
                <div className={styles.headerRight}>
                    {/* Dev Editors Button (DEV ONLY) */}
                    {import.meta.env.DEV && onOpenEditor && (
                        <button className={styles.btnDevEditors} onClick={onOpenEditor}>
                            DEV EDITORS
                        </button>
                    )}

                    {/* Wallet Connection */}
                    {wallet.isWalletAvailable ? (
                        wallet.isConnected ? (
                            <div className={styles.headerRight}>
                                <div className={styles.walletPill}>
                                    {wallet.publicKey?.slice(0, 6)}...{wallet.publicKey?.slice(-4)}
                                </div>
                                <button className={styles.btnDisconnect} onClick={wallet.disconnect}>
                                    DISCONNECT
                                </button>
                            </div>
                        ) : (
                            <button
                                className={styles.btnConnect}
                                onClick={wallet.connect}
                                disabled={wallet.isConnecting}
                            >
                                {wallet.isConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}
                            </button>
                        )
                    ) : (
                        <div className={styles.walletWarning}>
                            Wallet not detected —{' '}
                            <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer">
                                Install Freighter
                            </a>
                        </div>
                    )}
                </div>
            </header>

            <div className={styles.pageInner}>
                {/* Reconnecting Indicator */}
                {isReconnecting && (
                    <div className={styles.reconnecting}>
                        <div className={styles.reconnectingDot}/>
                        <span>RECONNECTING TO NETWORK...</span>
                    </div>
                )}

                <div className={styles.singleCol}>
                    {/* Upper Section: Create / Join tabbed panel */}
                    <div className={styles.tabPanel}>
                        <div className={styles.tabBar}>
                            <button
                                className={activeTab === 'create' ? styles.tabBtnActive : styles.tabBtnInactive}
                                onClick={() => setActiveTab('create')}
                            >
                                CREATE GAME
                            </button>
                            <button
                                className={
                                    activeGameId !== null
                                        ? styles.tabBtnDisabled
                                        : activeTab === 'join'
                                            ? styles.tabBtnActive
                                            : styles.tabBtnInactive
                                }
                                onClick={() => {
                                    if (activeGameId === null) setActiveTab('join');
                                }}
                                disabled={activeGameId !== null}
                            >
                                JOIN GAME
                            </button>
                        </div>

                        <div className={styles.tabContent}>
                            {activeTab === 'create' ? (
                                <CreateGamePanel
                                    service={service}
                                    wallet={wallet}
                                    activeGameId={activeGameId}
                                    onGameCreated={handleGameCreated}
                                    onGameCancelled={handleGameCancelled}
                                    onGameStart={handlePlayer1GameStart}
                                    onError={handleError}
                                />
                            ) : (
                                <JoinGamePanel
                                    service={service}
                                    wallet={wallet}
                                    onJoinSuccess={handleJoinSuccess}
                                    onError={handleError}
                                />
                            )}
                        </div>
                    </div>

                    {/* Lower Section: Open Lobbies */}
                    <OpenGamesList
                        games={openGames}
                        loading={loadingGames}
                        currentPlayer={wallet.publicKey}
                        service={service}
                        wallet={wallet}
                        onJoinSuccess={handleJoinSuccess}
                        onError={handleError}
                    />
                </div>
            </div>

            {/* Error Toast */}
            {error && <Toast message={error} onDismiss={clearError}/>}

            {/* Footer */}
            <footer className={styles.footer}>made with ❤️ on Stellar</footer>

            {/* Knight decorations — fixed bottom-left / bottom-right */}
            <KnightLobbyDecor/>
        </div>
    );
}
