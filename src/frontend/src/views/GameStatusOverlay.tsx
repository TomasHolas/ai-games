import React from 'react';
import { Play, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { PLAYER_COLORS } from '../config';
import type { GameState } from '../types';

interface GameStatusOverlayProps {
    gameState: GameState | null;
    p1Name: string;
    p2Name: string;
    onStartGame: () => void;
    onStopGame: () => void;
    onSwapPlayers?: () => void;
    isReviewing: boolean;
    gameType?: string;
}

export const GameStatusOverlay: React.FC<GameStatusOverlayProps> = ({
    gameState, p1Name, p2Name, onStartGame, onStopGame, onSwapPlayers, isReviewing, gameType
}) => {
    if (!gameState) return null;

    // POKER EXCEPTION: PokerBoard handles its own overlay for hand results.
    // To avoid visual clash (e.g. Invalid Move banner over Hand Winner), we hide this overlay
    // when a poker hand result is active or a hand summary is being shown.
    const pokerState = gameState.board as unknown as { last_hand_result: any };
    const isHandOver = (gameState as any).is_hand_summary || (gameState as any).hand_result || pokerState?.last_hand_result;

    if (gameType === 'poker' && isHandOver) {
        return null;
    }

    const { game_over, winner, message, is_invalid, current_symbol, winner_index } = gameState;
    // Use winner_index from backend for reliable color matching (0 = P1/secondary, 1 = P2/primary)
    const isP1Winner = winner_index === 0 || (winner_index == null && (winner === "X" || winner === p1Name));

    // Status Pill (Turn Indicator) - Only if game is active
    // And for poker, only if not showing hand result overlay
    // (pokerState and isPokerHandOver are already defined above)
    const isPokerHandOver = gameType === 'poker' && pokerState?.last_hand_result;

    if (!game_over && !isPokerHandOver) {
        // Suppress HAND OVER message as it's redundant with the main result overlay
        if (message?.includes('HAND OVER') || message === 'New hand started') return null;

        const isSystem = message?.includes('---') ||
            message?.includes('Game started') ||
            message === 'New hand started' ||
            gameState.current_player === 'System' ||
            ['FLOP', 'TURN', 'RIVER', 'PREFLOP', 'SHOWDOWN'].some(s => message?.toUpperCase().includes(s));
        const isHumanTurn = message?.toLowerCase().includes("your turn");

        // Get current player index for poker color
        const currentPlayerIdx = (gameState.board as any)?.current_player_idx ?? 0;
        const playerColor = PLAYER_COLORS[currentPlayerIdx % PLAYER_COLORS.length];

        // Extract player name from message (format: "PlayerName is thinking...")
        const thinkingMatch = message?.match(/^(.+?) is thinking/i);
        const thinkingPlayerName = thinkingMatch ? thinkingMatch[1] : null;

        // Strip decorations from system messages (handles --- RIVER --- or just RIVER)
        const cleanMessage = isSystem ? message?.replace(/[-_]/g, '').trim() : message;

        return (
            <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none w-full">
                {isSystem ? (
                    <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-8 duration-700">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="h-px w-20 bg-gradient-to-r from-transparent to-yellow-500/30" />
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-500/80 drop-shadow-sm">
                                Stage Announcement
                            </div>
                            <div className="h-px w-20 bg-gradient-to-l from-transparent to-yellow-500/30" />
                        </div>
                        {cleanMessage !== "Poker Game started" && cleanMessage !== "New hand started" && (
                            <div className="text-6xl lg:text-9xl font-black tracking-tighter text-white drop-shadow-2xl text-center px-4 uppercase"
                                style={{
                                    filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.8))',
                                    textShadow: '0 0 40px rgba(234,179,8,0.2)'
                                }}>
                                {cleanMessage}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`
                        mx-auto w-fit flex items-center gap-2 rounded-full border shadow-xl backdrop-blur-md transition-all duration-300
                        ${isHumanTurn
                            ? 'px-5 py-2 bg-green-500/20 border-green-500/40 text-green-400 font-bold animate-pulse'
                            : 'px-5 py-2 bg-black/60 border-white/10 text-gray-300 font-mono text-xs uppercase tracking-widest'}
                    `}>
                        {isHumanTurn ? (
                            <>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Your Turn
                            </>
                        ) : (
                            gameType === 'poker' ? (
                                thinkingPlayerName ? (
                                    <span className="flex items-center gap-2">
                                        <span
                                            className="w-2 h-2 rounded-full animate-pulse"
                                            style={{ backgroundColor: playerColor }}
                                        />
                                        <span style={{ color: playerColor }} className="font-bold">{thinkingPlayerName}</span>
                                        <span className="text-gray-400">is thinking...</span>
                                    </span>
                                ) : (
                                    <span>{message || "Game in Progress"}</span>
                                )
                            ) : (
                                <>
                                    <div className={`w-2 h-2 rounded-full ${current_symbol === 'X' ? 'bg-secondary' : 'bg-primary'}`}></div>
                                    <span>Turn: {current_symbol === 'X' ? p1Name : p2Name}</span>
                                </>
                            )
                        )}
                    </div>
                )}
            </div>
        );
    }

    // GAME OVER - Minimalist Overlay
    // We split into top (result) and bottom (controls) to keep board visible

    return (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-8 pointer-events-none animate-in fade-in duration-500">

            {/* TOP: Result Text */}
            <div className="flex flex-col items-center mt-6 pointer-events-auto gap-4">

                {/* Next Match Info - Top Center */}
                {!is_invalid && (
                    <div className="text-[10px] font-mono uppercase text-gray-400 tracking-widest bg-black/60 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
                        Next: <span className="text-secondary font-bold">{p1Name}</span> vs <span className="text-primary font-bold">{p2Name}</span>
                    </div>
                )}

                {is_invalid ? (
                    <div className="flex flex-col items-center text-red-500 drop-shadow-2xl">
                        <AlertTriangle className="w-12 h-12 mb-2 stroke-1" />
                        <span className="text-3xl font-black uppercase tracking-widest">Terminated</span>
                        <span className="text-sm opacity-90 font-mono bg-black/40 px-3 py-1 rounded">Invalid Move Detected</span>
                    </div>
                ) : winner ? (
                    <div className="flex flex-col items-center drop-shadow-2xl">
                        <div className="text-xs font-bold text-muted uppercase tracking-[0.5em] mb-2 bg-black/40 px-4 py-1 rounded-full border border-white/5">Winner</div>
                        <div className={`text-6xl lg:text-8xl font-black tracking-tighter ${isP1Winner ? 'text-secondary' : 'text-primary'}`}
                            style={{ textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                            {isP1Winner ? p1Name : p2Name}
                        </div>
                    </div>
                ) : (
                    <div className="text-6xl font-black text-gray-400 uppercase tracking-widest drop-shadow-2xl opacity-80"
                        style={{ textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                        Draw
                    </div>
                )}
            </div>

            {/* CENTER: Space for board */}
            <div className="flex-1"></div>

            {/* BOTTOM: Controls */}
            <div className="flex flex-col items-center gap-4 mb-4 pointer-events-auto">
                {!isReviewing && (
                    <div className="flex gap-3 bg-black/60 p-2 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
                        <button
                            onClick={onStartGame}
                            className="px-8 py-3 bg-white hover:bg-gray-200 text-black font-bold rounded-xl shadow-lg hover:shadow-xl flex items-center gap-2 transition-all hover:-translate-y-0.5"
                        >
                            <Play className="w-4 h-4 text-black fill-current" /> Play Again
                        </button>

                        {onSwapPlayers && (
                            <button
                                onClick={onSwapPlayers}
                                className="px-5 py-3 bg-[#2a2d36] hover:bg-[#323640] text-gray-300 hover:text-white font-bold rounded-xl border border-gray-700 transition-colors flex items-center gap-2"
                                title="Swap Roles"
                            >
                                <ArrowRightLeft className="w-4 h-4" />
                            </button>
                        )}

                        <button
                            onClick={onStopGame}
                            className="px-6 py-3 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-bold rounded-xl border border-transparent hover:border-gray-700 transition-all text-sm"
                        >
                            Menu
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
