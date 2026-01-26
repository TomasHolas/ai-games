import React, { useRef, useEffect, useState } from 'react';
import { PLAYER_COLORS } from '../config';
import { RotateCcw, List, ArrowRightLeft, ChevronLeft, ChevronRight, SkipBack, SkipForward, AlertTriangle } from 'lucide-react';
import { LogItemSnippet, ModelIcon } from '../components';
import { PokerBoard } from './PokerBoard';
import { TicTacToeBoard } from './TicTacToeBoard'; // New wrapper
import { GameStatusOverlay } from './GameStatusOverlay'; // New wrapper
import type { GameState, LogEntry, MetricsHistoryEntry, InvalidMoves, ModelConfig } from '../types';

interface MatchViewProps {
    matchId: string;
    gameState: GameState | null;
    logs: LogEntry[];
    metricsHistory: MetricsHistoryEntry[];
    invalidMoves: InvalidMoves;
    p1Model: string;
    setP1Model: (model: string) => void;
    p2Model: string;
    setP2Model: (model: string) => void;
    models: ModelConfig[];
    onStartGame: () => void;
    onStopGame: () => void;
    isReviewing: boolean;
    gameType: string;
    makeHumanMove: (move: string) => void;
    players?: string[];
}

export const MatchView: React.FC<MatchViewProps> = ({
    matchId,
    gameState,
    logs,
    metricsHistory,
    invalidMoves,
    p1Model,
    setP1Model,
    p2Model,
    setP2Model,
    models,
    onStartGame,
    onStopGame,
    isReviewing,
    gameType,
    makeHumanMove,
    players
}) => {
    const logsEndRef = useRef<HTMLDivElement>(null);
    const [replayStep, setReplayStep] = useState<number>(0);

    const gameInfo = (() => {
        switch (gameType) {
            case 'tictactoe_plus': return { name: 'Tic-Tac-Toe Plus', colors: ['#FF79C6', '#8BE9FD'], icon: 'XO' };
            case 'poker': return { name: "No-Limit Hold'em", colors: ['#FFB86C', '#BD93F9'], icon: '♠♥' };
            default: return { name: 'Tic-Tac-Toe', colors: ['#FF5555', '#50FA7B'], icon: 'XO' };
        }
    })();

    // Auto-scroll logs
    useEffect(() => {
        if (!isReviewing) {
            logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs, isReviewing]);

    // Initialize replay step to first step when entering review mode
    useEffect(() => {
        if (isReviewing && logs.length > 0) {
            setReplayStep(0); // Start at first step
        } else if (!isReviewing) {
            setReplayStep(0);
        }
    }, [isReviewing, logs.length]);

    const p1Name = models.find(m => m.id === p1Model)?.name || p1Model;
    const p2Name = models.find(m => m.id === p2Model)?.name || p2Model;

    // Calculate latency stats - when reviewing, only count metrics up to current step
    const replayMetrics = isReviewing
        ? metricsHistory.slice(0, replayStep + 1)
        : metricsHistory;



    // Determine State for Display
    const currentLogItem = isReviewing && replayStep >= 0 && logs[replayStep] ? logs[replayStep] : null;

    // Construct a pseudo-GameState for the board if we are reviewing
    // Fallback to gameState prop if currentLogItem not available yet (initial render)
    let displayGameState: GameState | null = gameState;

    if (isReviewing && currentLogItem) {
        displayGameState = {
            board: currentLogItem.board || [],
            turn: currentLogItem.turn,
            message: currentLogItem.move,
            current_player: currentLogItem.player,
            current_symbol: currentLogItem.current_symbol || (currentLogItem.player === p1Model || currentLogItem.player === p1Name ? "X" : "O"),
            is_thinking: false,
            game_over: replayStep === logs.length - 1 && (logs[logs.length - 1]?.move?.includes("Winner") || logs[logs.length - 1]?.move?.includes("Draw")),
            winner: null,
            metrics: currentLogItem.metrics,
            is_invalid: currentLogItem.is_invalid,
            raw_response: currentLogItem.raw_response,
            thinking: currentLogItem.thinking,
            system_prompt: currentLogItem.system_prompt,
            user_prompt: currentLogItem.user_prompt,
            is_hand_summary: currentLogItem.is_hand_summary,
            hand_result: currentLogItem.hand_result
        } as GameState;
    }


    const normalizedPlayers = players ?
        players.map((id, idx) => ({ id, name: models.find(m => m.id === id)?.name || id, idx })) :
        [
            { id: p1Model, name: p1Name, idx: 0 },
            { id: p2Model, name: p2Name, idx: 1 }
        ];

    const displayedLogs = isReviewing ? logs.slice(0, Math.max(0, replayStep + 1)) : logs;

    const handleStep = (delta: number) => {
        setReplayStep(prev => Math.max(0, Math.min(logs.length - 1, prev + delta)));
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <header className="flex justify-between items-center bg-surface border-b border-gray-800 p-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onStopGame}
                        className="px-4 py-2 hover:bg-white/10 rounded-lg transition-colors text-muted hover:text-white flex items-center gap-2 font-bold text-sm bg-white/5"
                    >
                        {isReviewing ? <ArrowRightLeft className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                        {isReviewing ? "Back to History" : "Cancel Match"}
                    </button>
                    <div className="h-6 w-px bg-gray-700 mx-1"></div>
                    <div className="flex items-center gap-3 ml-2">
                        <div className="w-8 h-8 bg-black/40 rounded-lg flex items-center justify-center border border-white/5">
                            <span className="text-xs font-black relative top-px" style={{ color: gameInfo.colors[0], fontFamily: 'Arial, sans-serif' }}>
                                {gameInfo.icon[0]}
                            </span>
                            <span className="text-xs font-black relative top-px" style={{ color: gameInfo.colors[1], fontFamily: 'Arial, sans-serif' }}>
                                {gameInfo.icon[1]}
                            </span>
                        </div>
                        <div>
                            <div className="text-[10px] text-muted font-bold uppercase tracking-widest leading-none mb-1">
                                {isReviewing ? "Replay Mode" : "Live Match"}
                            </div>
                            <h1 className="text-sm font-bold tracking-tight flex items-center gap-2">
                                {gameInfo.name} <span className="text-muted/60 font-mono">#{matchId.split('-')[1]}</span>
                            </h1>
                        </div>
                    </div>

                    {isReviewing && (
                        <div className="flex items-center gap-2 ml-4 bg-black/40 rounded-lg p-1 border border-white/5">
                            <button
                                onClick={() => setReplayStep(0)}
                                disabled={replayStep === 0}
                                className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30 transition-colors"
                            >
                                <SkipBack className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleStep(-1)}
                                disabled={replayStep === 0}
                                className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="px-3 font-mono text-xs font-bold w-20 text-center">
                                {replayStep + 1} / {logs.length}
                            </div>
                            <button
                                onClick={() => handleStep(1)}
                                disabled={replayStep >= logs.length - 1}
                                className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setReplayStep(logs.length - 1)}
                                disabled={replayStep >= logs.length - 1}
                                className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30 transition-colors"
                            >
                                <SkipForward className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Player Info */}
                {/* Unified Player Info Header */}
                <div className="flex items-center gap-4">
                    <div className="flex gap-2 items-center bg-black/20 px-2 py-2 rounded-xl border border-white/5">
                        {normalizedPlayers.map((player) => {
                            // Active Turn Calculation
                            let isActiveTurn = false;

                            // If game is over, highlight the winner instead of "whose turn"
                            const isGameOver = displayGameState?.game_over;
                            const winnerIndex = displayGameState?.winner_index;

                            if (isGameOver && winnerIndex != null) {
                                // Highlight the winner using index
                                isActiveTurn = player.idx === winnerIndex;
                            } else if (isReviewing && currentLogItem) {
                                // REPLAY: Highlight the ACTOR (who made the move in this log)
                                // We match against the log's player ID or Name
                                isActiveTurn = player.id === currentLogItem.player || player.name === currentLogItem.player;

                                // TTT fallback: if log uses 'X'/'O' or symbols
                                if (!isActiveTurn && gameType !== 'poker') {
                                    const logSymbol = currentLogItem.current_symbol || (currentLogItem.player === 'X' ? 'X' : (currentLogItem.player === 'O' ? 'O' : null));
                                    if (player.idx === 0 && logSymbol === 'X') isActiveTurn = true;
                                    else if (player.idx === 1 && logSymbol === 'O') isActiveTurn = true;
                                }
                            } else if (!isGameOver) {
                                // LIVE: Highlight the CURRENT TURN (who is about to move)
                                if (gameType === 'poker') {
                                    isActiveTurn = (displayGameState?.board as any)?.current_player_idx === player.idx;
                                } else {
                                    // TTT: P1 is X (idx 0), P2 is O (idx 1)
                                    const currentSym = displayGameState?.current_symbol;
                                    isActiveTurn = (currentSym === 'X' && player.idx === 0) || (currentSym === 'O' && player.idx === 1);
                                }
                            }

                            // Folded Status (Poker only)
                            const isFolded = (displayGameState?.board as any)?.players?.[player.idx]?.status === 'folded';
                            const playerColor = PLAYER_COLORS[player.idx % PLAYER_COLORS.length];
                            const modelConfig = models.find(m => m.id === player.id);

                            // Invalid Moves Count (principally for TTT but generic enough)
                            const invalidCount = player.idx === 0 ? invalidMoves.p1 : invalidMoves.p2;

                            return (
                                <div
                                    key={player.idx}
                                    className={`
                                        flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all border border-transparent
                                        ${isActiveTurn ? 'bg-white/10 border-white/10 shadow-lg' : 'opacity-60 hover:opacity-100'}
                                        ${isFolded ? 'opacity-30 grayscale' : ''}
                                    `}
                                >
                                    <ModelIcon
                                        model={player.id}
                                        provider={modelConfig?.provider}
                                        size={18}
                                        className="bg-black/30 p-1 rounded-md border border-white/10"
                                    />

                                    <div className="flex flex-col justify-center">
                                        <div className="text-[10px] uppercase font-bold tracking-wider leading-none" style={{ color: isActiveTurn ? playerColor : '#94a3b8' }}>
                                            {(() => {
                                                const name = ((displayGameState?.board as any)?.players?.[player.idx]?.name || player.name).slice(0, 25);
                                                if (gameType === 'poker') return name;
                                                return `${name} ${player.idx === 0 ? '(X)' : '(O)'}`;
                                            })()}
                                        </div>
                                    </div>

                                    {/* Status Indicators */}
                                    <div className="flex items-center gap-2">
                                        {/* Invalid Move Warning */}
                                        {invalidCount > 0 && (
                                            <div className="flex items-center text-red-500" title={`${invalidCount} invalid moves`}>
                                                <AlertTriangle className="w-3 h-3" />
                                            </div>
                                        )}

                                        {/* Turn Indicator / Color Dot */}
                                        <div
                                            className={`
                                                w-2 h-2 rounded-full transition-all
                                                ${isActiveTurn ? 'scale-125' : 'scale-100'}
                                                ${isActiveTurn && !isReviewing ? 'animate-pulse' : ''}
                                            `}
                                            style={{
                                                backgroundColor: playerColor,
                                                boxShadow: isActiveTurn ? `0 0 8px ${playerColor}` : 'none'
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-hidden grid grid-cols-12">
                {/* LEFT: Board */}
                <div className="col-span-12 lg:col-span-5 bg-black/20 relative flex flex-col border-r border-gray-800 outline-none overflow-hidden">
                    {gameType === 'poker' ? (
                        <PokerBoard
                            gameState={displayGameState}
                            gameType={gameType}
                            makeHumanMove={makeHumanMove}
                            onStop={onStopGame}
                            models={models}
                        />
                    ) : (
                        <TicTacToeBoard
                            gameState={displayGameState}
                            p1Model={p1Model}
                            p2Model={p2Model}
                            models={models}
                            makeHumanMove={makeHumanMove}
                            gameType={gameType}
                        />
                    )}

                    <GameStatusOverlay
                        gameState={displayGameState}
                        p1Name={p1Name}
                        p2Name={p2Name}
                        onStartGame={onStartGame}
                        onStopGame={onStopGame}
                        onSwapPlayers={gameType !== 'poker' ? () => {
                            const temp = p1Model;
                            setP1Model(p2Model);
                            setP2Model(temp);
                        } : undefined}
                        isReviewing={isReviewing}
                        gameType={gameType}
                    />
                </div>

                {/* RIGHT: Data */}
                <div className="col-span-12 lg:col-span-7 flex flex-col bg-background lg:h-full lg:overflow-hidden min-h-0">
                    {/* Stats Cards */}
                    <div className="border-b border-gray-800 bg-surface/50 shrink-0">
                        <div className={`grid gap-4 p-4 ${players && players.length > 2 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
                            {(players ?
                                players.map((id, idx) => ({ id, name: models.find(m => m.id === id)?.name || id, idx })) :
                                [
                                    { id: p1Model, name: p1Name, idx: 0 },
                                    { id: p2Model, name: p2Name, idx: 1 }
                                ]
                            ).map((player) => {
                                // Unified Metric Calculation
                                const playerMetrics = replayMetrics.filter(m => {
                                    if (m.player_idx !== undefined) return m.player_idx === player.idx;
                                    // Legacy fallback for TTT/P1/P2 logs without explicit player_idx
                                    return player.idx === 0 ? m.latency_p1 !== null : m.latency_p2 !== null;
                                });

                                const lastLatency = playerMetrics.length ?
                                    (playerMetrics[playerMetrics.length - 1].latency ?? (player.idx === 0 ? playerMetrics[playerMetrics.length - 1].latency_p1 : playerMetrics[playerMetrics.length - 1].latency_p2)) : 0;

                                const avgLatency = playerMetrics.length ?
                                    playerMetrics.reduce((a, b) => a + (b.latency ?? (player.idx === 0 ? b.latency_p1 : b.latency_p2) ?? 0), 0) / playerMetrics.length : 0;

                                const playerColor = PLAYER_COLORS[player.idx % PLAYER_COLORS.length];
                                const modelConfig = models.find(m => m.id === player.id);

                                return (
                                    <div key={player.idx} className="p-4 bg-black/20 rounded-xl border border-white/5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl -mr-10 -mt-10 transition-all opacity-10" style={{ backgroundColor: playerColor }}></div>

                                        <div className="flex items-center gap-2 mb-3 relative z-10">
                                            <ModelIcon
                                                model={player.id}
                                                provider={modelConfig?.provider}
                                                size={16}
                                            />
                                            <div className="text-sm font-bold truncate uppercase tracking-tight" style={{ color: playerColor }}>
                                                {player.name}
                                            </div>
                                            <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ backgroundColor: playerColor }}></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 relative z-10">
                                            <div>
                                                <div className="text-[10px] uppercase text-muted font-bold tracking-wider">Last</div>
                                                <div className="text-xl font-mono font-bold" style={{ color: playerColor }}>
                                                    {lastLatency ? (lastLatency / 1000).toFixed(2) : '-'}<span className="text-xs text-muted ml-0.5">s</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase text-muted font-bold tracking-wider">Avg</div>
                                                <div className="text-xl font-mono font-bold text-gray-400">
                                                    {(avgLatency / 1000).toFixed(2)}<span className="text-xs text-muted ml-0.5">s</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Logs Section */}
                    <div className="flex-1 flex flex-col min-h-0 bg-surface/30">
                        <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-surface">
                            <h3 className="text-xs font-bold uppercase text-muted flex items-center gap-2">
                                <List className="w-3 h-3" /> Battle Log
                            </h3>
                            <span className="text-[10px] text-muted">{displayedLogs.length} entries</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {displayedLogs.map((log, i) => (
                                <LogItemSnippet
                                    key={`${log.turn}-${log.player}-${i}`}
                                    log={log}
                                    models={models}
                                />
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
