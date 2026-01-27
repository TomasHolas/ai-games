import { useState, useCallback, useRef } from 'react';
import { getGameWebSocketUrl } from '../config';
import type { GameState, LogEntry, MetricsHistoryEntry, InvalidMoves, ModelConfig } from '../types';

interface UseGameWebSocketProps {
    p1Model: string;
    p2Model: string;
    gameType: string;
    models: ModelConfig[];
    players?: string[]; // For N-player games
    onGameEnd?: () => void;
}

interface UseGameWebSocketReturn {
    matchId: string;
    gameState: GameState | null;
    logs: LogEntry[];
    metricsHistory: MetricsHistoryEntry[];
    invalidMoves: InvalidMoves;
    isConnected: boolean;
    startGame: () => void;
    stopGame: () => void;
    makeHumanMove: (move: string) => void;
}

export function useGameWebSocket({
    p1Model,
    p2Model,
    gameType,
    models,
    players,
    onGameEnd
}: UseGameWebSocketProps): UseGameWebSocketReturn {
    const [matchId, setMatchId] = useState<string>("test-match-1");
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [metricsHistory, setMetricsHistory] = useState<MetricsHistoryEntry[]>([]);
    const [invalidMoves, setInvalidMoves] = useState<InvalidMoves>({ p1: 0, p2: 0 });
    const [isConnected, setIsConnected] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const userTriggeredFinish = useRef(false);

    const startGame = useCallback(() => {
        // Reset state
        setLogs([]);
        setMetricsHistory([]);
        setGameState(null);
        setInvalidMoves({ p1: 0, p2: 0 });
        userTriggeredFinish.current = false;

        const newMatchId = `match-${Date.now()}`;
        setMatchId(newMatchId);

        const socket = new WebSocket(getGameWebSocketUrl(newMatchId));

        socket.onopen = () => {
            console.log("WebSocket connected");
            setIsConnected(true);
            socket.send(JSON.stringify({
                player1: p1Model,
                player2: p2Model,
                players: players, // Pass explicit players list
                game_type: gameType
            }));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.message === "Session ended") return;

            if (data.error) {
                alert("Error: " + data.error);
                socket.close();
                return;
            }

            setGameState(data);

            if (data.message && !data.is_thinking && data.message !== "Game started") {
                // Track Invalid Moves
                if (data.is_invalid) {
                    setInvalidMoves(prev => {
                        const p1Name = models.find(m => m.id === p1Model)?.name || p1Model;
                        if (data.current_player === p1Model || data.current_player === p1Name) return { ...prev, p1: prev.p1 + 1 };
                        return { ...prev, p2: prev.p2 + 1 };
                    });
                }

                if (data.metrics) {
                    const newLog: LogEntry = {
                        turn: data.turn,
                        player: data.current_player,
                        move: data.message,
                        metrics: data.metrics,
                        timestamp: new Date().toLocaleTimeString(),
                        is_invalid: data.is_invalid,
                        raw_response: data.raw_response,
                        thinking: data.thinking,
                        system_prompt: data.system_prompt,
                        user_prompt: data.user_prompt,
                        current_symbol: data.current_symbol,
                        player_index: data.current_player_idx,
                        board: data.board,
                        folded_cards: data.folded_cards,
                        hand_result: data.hand_result,
                        is_hand_summary: data.is_hand_summary
                    };
                    setLogs(prev => [...prev, newLog]);

                    const p1Name = models.find(m => m.id === p1Model)?.name || p1Model;
                    // Check if current player matches P1 ID or P1 Name
                    const isP1 = data.current_player === p1Model || data.current_player === p1Name;

                    setMetricsHistory(prev => [...prev, {
                        turn: data.turn,
                        latency_p1: isP1 ? data.metrics.latency_ms : null,
                        latency_p2: !isP1 ? data.metrics.latency_ms : null,
                        latency: data.metrics.latency_ms,
                        player_idx: data.current_player_idx,
                        cost: data.metrics.estimated_cost_usd * 1000,
                        tokens: data.metrics.total_tokens,
                        player: data.message.split(" ")[0]
                    }]);
                } else if (data.is_invalid) {
                    setLogs(prev => [...prev, {
                        turn: data.turn,
                        player: data.current_player,
                        move: data.message,
                        timestamp: new Date().toLocaleTimeString(),
                        is_invalid: true,
                        raw_response: data.raw_response,
                        thinking: data.thinking,
                        system_prompt: data.system_prompt,
                        user_prompt: data.user_prompt,
                        current_symbol: data.current_symbol,
                        player_index: data.current_player_idx,
                        board: data.board
                    }]);
                } else if (data.game_over) {
                    setLogs(prev => [...prev, {
                        turn: data.turn,
                        player: "System",
                        move: data.message,
                        timestamp: new Date().toLocaleTimeString(),
                        board: data.board
                    }]);

                    // Automatically return to menu after a short delay to let user see "Winner" message
                    // IF user explicitly finished (poker), exit immediately
                    const delay = userTriggeredFinish.current ? 0 : 2000;

                    setTimeout(() => {
                        // Close socket to prevent further updates
                        if (wsRef.current) wsRef.current.close();
                        onGameEnd?.();
                    }, delay);

                } else {
                    // Generic system message (Summary, Separator, etc)
                    setLogs(prev => [...prev, {
                        turn: data.turn,
                        player: data.current_player || "System",
                        move: data.message,
                        timestamp: new Date().toLocaleTimeString(),
                        board: data.board,
                        is_hand_summary: data.is_hand_summary,
                        hand_result: data.hand_result,
                        player_index: data.current_player_idx
                    }]);
                }
            }
        };

        socket.onclose = () => {
            setIsConnected(false);
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            setIsConnected(false);
        };

        wsRef.current = socket;
    }, [p1Model, p2Model, gameType, models, players]);

    const stopGame = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
        onGameEnd?.();
    }, [onGameEnd]);

    const makeHumanMove = useCallback((move: string) => {
        if (move === "finish") {
            userTriggeredFinish.current = true;
        }

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'human_move',
                move: move
            }));
        }
    }, []);

    return {
        matchId,
        gameState,
        logs,
        metricsHistory,
        invalidMoves,
        isConnected,
        startGame,
        stopGame,
        makeHumanMove
    };
}
