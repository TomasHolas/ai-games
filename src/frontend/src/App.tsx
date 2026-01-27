/**
 * AI Games - Main Application
 * 
 * Refactored modular architecture:
 * - Components: Reusable UI components (Card, Sidebar, GameBoard, LogItemSnippet)
 * - Views: Page-level components (Dashboard, Games, Metrics, Match)
 * - Hooks: Custom React hooks (useGameWebSocket)
 * - Types: TypeScript type definitions
 * - Config: Centralized configuration (API URLs, models)
 */

import { useState, useEffect } from 'react';

// Components
import { Sidebar } from './components';

// Views
// Views
import { DashboardView, GamesView, MetricsView, MatchView, HistoryView } from './views';

// Hooks
import { useGameWebSocket, useAppNavigation } from './hooks';

// Config & Types
import { API_ENDPOINTS, FALLBACK_MODELS } from './config';
import type { ProviderStatus, ModelConfig } from './types';

function App() {
    // Navigation State
    // Navigation State
    const {
        view, setView: rawSetView,
        inGame, setInGame,
        isReviewing, setIsReviewing,
        pendingReplayId, setPendingReplayId
    } = useAppNavigation();

    // History State
    const [historyData, setHistoryData] = useState<any>(null);

    // Wrapper for view switching to handle cleanup
    const setView = (newView: any) => {
        rawSetView(newView);
        if (newView !== 'match') {
            setHistoryData(null);
        }
    };

    // Model Selection (Independent per game type)
    const [gameModels, setGameModels] = useState<Record<string, { p1: string; p2: string }>>({
        tictactoe: { p1: "", p2: "" },
        tictactoe_plus: { p1: "", p2: "" }
    });
    const [gameType, setGameType] = useState<string>("tictactoe");

    const p1Model = gameModels[gameType]?.p1 || "";
    const p2Model = gameModels[gameType]?.p2 || "";

    const setP1Model = (game: string, model: string) => {
        setGameModels(prev => ({
            ...prev,
            [game]: { ...prev[game], p1: model }
        }));
    };

    const setP2Model = (game: string, model: string) => {
        setGameModels(prev => ({
            ...prev,
            [game]: { ...prev[game], p2: model }
        }));
    };

    const setModelsForGame = (type: string, p1: string, p2: string) => {
        setGameModels(prev => ({
            ...prev,
            [type]: { p1, p2 }
        }));
    };

    // Available Models (loaded from API or fallback)
    const [models, setModels] = useState<ModelConfig[]>(FALLBACK_MODELS);

    // API Status
    const [apiStatus, setApiStatus] = useState<ProviderStatus[]>([]);

    // Load replay if coming from URL
    useEffect(() => {
        if (pendingReplayId && !historyData) {
            fetch(`${API_ENDPOINTS.history}/${pendingReplayId}`)
                .then(res => res.json())
                .then(data => {
                    setHistoryData(data);
                    const type = data.game_type || "tictactoe";
                    setGameType(type);
                    setModelsForGame(type, data.player1, data.player2);
                    setPendingReplayId(null);
                })
                .catch(err => {
                    console.error("Failed to load replay", err);
                    setView('history');
                    setInGame(false);
                    setIsReviewing(false);
                    setPendingReplayId(null);
                });
        }
    }, [pendingReplayId, historyData]);

    // Sync URL hash with view state
    useEffect(() => {
        if (isReviewing && historyData) {
            window.location.hash = `replay/${historyData.match_id}`;
        } else if (!inGame) {
            window.location.hash = view;
        }
    }, [view, inGame, isReviewing, historyData]);

    // Poker State
    const [pokerPlayers, setPokerPlayers] = useState<string[]>(Array(4).fill(""));

    // Game WebSocket Hook
    const {
        matchId,
        gameState,
        logs,
        metricsHistory,
        invalidMoves,
        startGame: wsStartGame,
        stopGame: wsStopGame,
        makeHumanMove
    } = useGameWebSocket({
        p1Model,
        p2Model,
        gameType,
        models,
        players: gameType === 'poker' ? pokerPlayers : undefined,
        onGameEnd: () => {
            // Only handle if we are NOT in history mode
            if (!isReviewing) {
                setInGame(false);
                setHistoryData(null);

                // For Poker, return to Catalog (Games) as requested by user
                // For others (TTT), go to History to see results
                if (gameType === 'poker') {
                    setView('games');
                    window.location.hash = 'games';
                } else {
                    setView('history');
                    window.location.hash = 'history';
                }
            }
        }
    });

    // Load models from API on mount
    useEffect(() => {
        fetch(API_ENDPOINTS.models)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setModels(data);
                }
            })
            .catch(err => {
                console.warn("Failed to fetch models from API, using fallback:", err);
            });
    }, []);

    // Load API Status on mount
    useEffect(() => {
        fetch(API_ENDPOINTS.providersStatus)
            .then(res => res.json())
            .then(data => setApiStatus(data))
            .catch(err => console.error("Failed to fetch API status", err));
    }, []);

    // Game Controls
    const handleStartGame = () => {
        setInGame(true);
        setView('match');
        setIsReviewing(false);
        setHistoryData(null);
        wsStartGame();
    };

    const handleStopGame = () => {
        if (isReviewing) {
            // Just exit review
            setInGame(false);
            setIsReviewing(false);
            setHistoryData(null);
            setView('history');
        } else {
            wsStopGame();
            setInGame(false);
            setView('games');
        }
    };

    const handleSelectHistoryMatch = (matchId: string) => {
        // Fetch full match data
        fetch(`${API_ENDPOINTS.history}/${matchId}`)
            .then(res => res.json())
            .then(data => {
                setHistoryData(data);
                const type = data.game_type || "tictactoe";
                setGameType(type);
                setModelsForGame(type, data.player1, data.player2);
                setIsReviewing(true);
                setInGame(true);
                setView('match');
            })
            .catch(err => console.error("Failed to load history match", err));
    };

    // Calculate props for MatchView based on mode
    // Filter out "thinking" steps - only keep actual moves
    const filteredHistoryLog = historyData?.log?.filter((l: any) => !l.is_thinking) || [];

    const matchViewProps = isReviewing && historyData ? {
        matchId: historyData.match_id,
        gameState: filteredHistoryLog[filteredHistoryLog.length - 1], // Last state
        winner: filteredHistoryLog[filteredHistoryLog.length - 1]?.winner,
        winner_index: historyData.winner_index,
        logs: filteredHistoryLog.map((l: any, idx: number) => ({
            turn: idx, // Use index as turn for cleaner step counts
            player: l.current_player,
            move: l.message,
            metrics: l.metrics,
            timestamp: new Date(l.timestamp || (historyData.timestamp * 1000)).toLocaleTimeString(),
            is_invalid: l.is_invalid,
            raw_response: l.raw_response,
            thinking: l.thinking,
            system_prompt: l.system_prompt,
            user_prompt: l.user_prompt,
            current_symbol: l.current_symbol,
            player_index: l.current_player_idx,
            board: l.board,
            winner: l.winner,
            winner_index: l.winner_index !== undefined ? l.winner_index : (idx === filteredHistoryLog.length - 1 ? historyData.winner_index : null)
        })),
        metricsHistory: filteredHistoryLog.map((l: any, idx: number) => ({
            turn: idx,
            latency_p1: l.current_player === historyData.player1 ? l.metrics?.latency_ms : null,
            latency_p2: l.current_player === historyData.player2 ? l.metrics?.latency_ms : null,
            tokens: l.metrics?.total_tokens || 0,
            player: l.current_player
        })),
        invalidMoves: {
            p1: historyData.model_stats?.[historyData.player1]?.invalid_moves || 0,
            p2: historyData.model_stats?.[historyData.player2]?.invalid_moves || 0
        },
        p1Model: historyData.player1,
        p2Model: historyData.player2,
        gameType: historyData.game_type || "tictactoe"
    } : {
        matchId,
        gameState,
        logs,
        metricsHistory,
        invalidMoves,
        p1Model,
        p2Model,
        gameType,
        makeHumanMove
    };

    // Debug Mode (Global Preference)
    const [isDebugMode, setIsDebugMode] = useState(true);

    return (
        <div className="min-h-screen bg-background text-text font-sans flex text-sm">
            {/* Sidebar - hidden during active game */}
            {!inGame && (
                <Sidebar
                    view={view}
                    setView={setView}
                    apiStatus={apiStatus}
                    isDebugMode={isDebugMode}
                    setIsDebugMode={setIsDebugMode}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 bg-background flex flex-col overflow-auto">
                {inGame ? (
                    <MatchView
                        key={isReviewing ? `review-${matchViewProps.matchId}` : `live-${matchViewProps.matchId}`}
                        {...matchViewProps}
                        setP1Model={(m) => setP1Model(gameType, m)}
                        setP2Model={(m) => setP2Model(gameType, m)}
                        models={models}
                        onStartGame={handleStartGame}
                        onStopGame={handleStopGame}
                        isReviewing={isReviewing}
                        makeHumanMove={makeHumanMove}
                        players={gameType === 'poker' ? pokerPlayers : undefined}
                    />
                ) : (
                    <>
                        {view === 'dashboard' && <DashboardView models={models} />}
                        {view === 'games' && (
                            <GamesView
                                models={models}
                                gameModels={gameModels}
                                setP1Model={setP1Model}
                                setP2Model={setP2Model}
                                gameType={gameType}
                                setGameType={setGameType}
                                onStartGame={handleStartGame}
                                pokerPlayers={pokerPlayers}
                                setPokerPlayers={setPokerPlayers}
                                isDebugMode={isDebugMode}
                            />
                        )}
                        {view === 'history' && (
                            <HistoryView
                                models={models}
                                onSelectMatch={handleSelectHistoryMatch}
                            />
                        )}
                        {view === 'metrics' && <MetricsView models={models} />}
                    </>
                )}
            </div>
        </div>
    );
}

export default App;
