import React, { useState } from 'react';
import type { GameState, ModelConfig } from '../types';
import { GameArena } from '../components/GameArena';
import { PokerTable } from '../components/PokerTable';
import { PlayingCard } from '../components/PlayingCard';
import { PLAYER_COLORS } from '../config';
import { Play, ArrowLeft, Trophy, Info, X } from 'lucide-react';

const RANK_NAMES: Record<number, string> = {
    10: "Royal Flush", 9: "Straight Flush", 8: "Four of a Kind", 7: "Full House",
    6: "Flush", 5: "Straight", 4: "Three of a Kind", 3: "Two Pair", 2: "Pair", 1: "High Card"
};

const EXAMPLE_HANDS: Record<number, string[]> = {
    10: ["A♥", "K♥", "Q♥", "J♥", "T♥"],
    9: ["9♠", "8♠", "7♠", "6♠", "5♠"],
    8: ["A♣", "A♦", "A♥", "A♠", "K♦"],
    7: ["K♠", "K♣", "K♥", "9♠", "9♣"],
    6: ["A♠", "J♠", "8♠", "4♠", "2♠"],
    5: ["8♠", "7♣", "6♦", "5♥", "4♠"],
    4: ["Q♣", "Q♥", "Q♠", "7♦", "2♠"],
    3: ["J♦", "J♠", "8♣", "8♠", "A♥"],
    2: ["T♣", "T♥", "K♠", "4♦", "3♠"],
    1: ["A♠", "J♦", "8♣", "6♥", "2♠"]
};

interface PokerBoardProps {
    gameState: GameState | null;
    gameType: string;
    makeHumanMove: (move: string) => void;
    onStop: () => void;
    models: ModelConfig[];
}

interface PokerState {
    pot: number;
    community_cards: string[];
    stage: string;
    dealer_idx: number;
    current_player_idx: number;
    players: {
        name: string;
        chips: number;
        bet: number;
        total_bet: number;
        status: string; // 'active', 'folded', 'allin', 'out'
        has_acted: boolean;
        cards: string[] | null;
        hand_rank: any;
        extraContent?: React.ReactNode;
    }[];
    last_hand_result: {
        winners: string[];
        winner_indices?: number[];
        pot: number;
        community_cards: string[];
        player_hands: Record<string, string[]>;
        winning_cards?: string[];
        winning_kickers?: string[];
        winning_hand_name?: string;
    } | null;
    wins?: Record<string, number>;
}

export const PokerBoard: React.FC<PokerBoardProps> = ({ gameState, makeHumanMove, onStop, models }) => {
    const [raiseAmount, setRaiseAmount] = useState<string>('');
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showRankings, setShowRankings] = useState(false);

    // Parse gameState if it's not null.
    const pokerState = gameState?.board as unknown as PokerState;

    if (!pokerState || !gameState) return <div className="text-white">Waiting for game...</div>;

    const { players, current_player_idx, dealer_idx } = pokerState;
    const activePlayers = players || [];

    // Helper to get nice winner name
    const getWinnerName = (id: string) => {
        return models.find(m => m.id === id)?.name || id;
    }

    // Leaderboard Data Calculation
    const leaderboardData = activePlayers.map((p, i) => {
        const modelName = models.find(m => m.id === p.name)?.name || p.name;
        const wins = pokerState.wins ? (pokerState.wins[p.name] || 0) : 0;
        const color = PLAYER_COLORS[i % PLAYER_COLORS.length];
        const profit = p.chips - 1000;
        return { ...p, modelName, wins, color, profit };
    }).sort((a, b) => b.chips - a.chips); // Sort by Chips (Richest first)

    const lastHandResult = pokerState.last_hand_result;
    const winningCards = lastHandResult?.winning_cards || [];
    const winningKickers = lastHandResult?.winning_kickers || [];

    // Calculate rank presence for Hand Rankings Table
    const rankPresence: Record<number, string[]> = {};
    activePlayers.forEach(p => {
        if (p.hand_rank && !p.status.includes('out') && !p.status.includes('folded')) {
            const r = p.hand_rank[0];
            if (!rankPresence[r]) rankPresence[r] = [];
            rankPresence[r].push(p.name);
        }
    });

    // Determine winner details for Overlay
    let winnerColor = '#FACC15'; // Primary winner/system color (gold)
    let winnerWins = 0;

    if (lastHandResult && lastHandResult.winners.length > 0) {
        const winnerId = lastHandResult.winners[0];

        // Match color using index or name (extremely defensive)
        let matchedIdx = -1;
        const bIndices = lastHandResult.winner_indices;
        if (Array.isArray(bIndices) && typeof bIndices[0] === 'number') {
            matchedIdx = bIndices[0];
        } else {
            // Fallback: match ID (e.g. "human_1") against players names
            matchedIdx = activePlayers.findIndex(p =>
                p.name.toLowerCase().trim() === winnerId.toLowerCase().trim()
            );
        }

        if (matchedIdx !== -1) {
            winnerColor = PLAYER_COLORS[matchedIdx % PLAYER_COLORS.length];
        }
        if (pokerState.wins) {
            winnerWins = pokerState.wins[winnerId] || 0;
        }
    }

    // Map to GameArena players format
    const arenaPlayers = activePlayers.map((p, i) => {
        const isFolded = p.status === 'folded';
        const isOut = p.status === 'out';
        const playerColor = PLAYER_COLORS[i % PLAYER_COLORS.length];

        // Resolve human-readable model name
        let modelName = models.find(m => m.id === p.name)?.name || p.name;
        if (modelName === "human") modelName = "Human";

        return {
            id: p.name, // Use ID for icon lookup
            name: modelName.slice(0, 20), // Use nice name, longer limit
            idx: i,
            isActive: i === current_player_idx && !isFolded && !isOut,
            isFolded: isFolded,
            isOut: isOut,
            isDealer: i === dealer_idx,
            extraContent: (
                <>
                    {/* Cards with Bet Chip */}
                    {!isOut && (
                        <div className="flex items-center gap-2">
                            {/* Cards - Increased size (-space-x-8) and no small prop */}
                            <div className={`flex -space-x-8 transition-all duration-500 ${isFolded ? 'opacity-60 grayscale brightness-75 rotate-3 scale-95 origin-bottom-left' : ''}`}>
                                {p.cards && p.cards.length > 0 ? (
                                    p.cards.map((c, idx) => (
                                        <PlayingCard key={idx} card={c} isWinning={winningCards.includes(c)} isKicker={winningKickers.includes(c)} />
                                    ))
                                ) : (
                                    // Fallback if cards not available (should not happen with backend update)
                                    <>
                                        <PlayingCard card="??" hidden />
                                        <PlayingCard card="??" hidden />
                                    </>
                                )}
                            </div>

                            {/* Bet Chip - Shows current round bet only */}
                            {p.bet > 0 && !isFolded && (
                                <div className="flex flex-col items-center gap-0.5">
                                    <div
                                        className="w-5 h-5 rounded-full border-2 shadow-lg"
                                        style={{
                                            backgroundColor: playerColor,
                                            borderColor: 'rgba(255,255,255,0.3)'
                                        }}
                                    />
                                    <div
                                        className="px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap shadow-lg border bg-black/80"
                                        style={{
                                            color: playerColor,
                                            borderColor: `${playerColor}40`
                                        }}
                                    >
                                        ${p.bet}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {/* Chips Count */}
                    {!isOut && (
                        <div className={`bg-black/80 px-3 py-1 rounded-full border border-white/10 text-xs font-mono font-bold ${isFolded ? 'text-gray-500' : 'text-emerald-400'}`}>
                            ${p.chips}
                        </div>
                    )}
                </>
            )
        };
    });

    const currentPlayer = activePlayers[current_player_idx];
    const isHumanTurn = currentPlayer?.name?.toLowerCase().includes("human")
        || currentPlayer?.name === "human";

    // Calculate minimum raise (typically 2x current bet or big blind)
    const currentBet = currentPlayer?.bet || 0;
    const minRaise = Math.max(currentBet * 2, 20);

    const handleRaise = () => {
        const amount = parseInt(raiseAmount) || minRaise;
        makeHumanMove(`raise ${amount}`);
        setRaiseAmount('');
    };


    return (
        <div className="flex flex-col h-full relative">
            {/* TOP RIGHT CONTROLS */}
            <div className="absolute top-6 right-6 z-[60] flex flex-col items-end gap-2">
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowLeaderboard(!showLeaderboard)}
                        className={`p-3 rounded-xl border transition-all active:scale-95 shadow-xl ${showLeaderboard ? 'bg-white text-black border-white' : 'bg-black/60 text-yellow-500 border-white/10 hover:bg-black/80'}`}
                    >
                        <Trophy className="w-5 h-5" />
                    </button>
                </div>

                {showLeaderboard && (
                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl w-64 shadow-2xl animate-in slide-in-from-top-2">
                        <div className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider flex justify-between">
                            <span>Player</span>
                            <span>Wins / Chips</span>
                        </div>
                        <div className="space-y-2">
                            {leaderboardData.map((p) => (
                                <div key={p.name} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                                        <span className="text-xs font-bold text-gray-200 truncate">{p.modelName}</span>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                        <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-bold">
                                            <Trophy className="w-3 h-3" /> {p.wins}
                                        </div>
                                        <div className={`flex items-center gap-1 text-[10px] font-mono font-bold ${p.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {p.profit >= 0 ? '+' : ''}{p.profit}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* HAND RANKINGS TOGGLE */}
            <div className="absolute top-6 left-6 z-40">
                <button
                    onClick={() => setShowRankings(!showRankings)}
                    className={`p-3 rounded-xl border transition-all active:scale-95 shadow-xl ${showRankings ? 'bg-white text-black border-white' : 'bg-black/60 text-blue-400 border-white/10 hover:bg-black/80'}`}
                >
                    <Info className="w-5 h-5" />
                </button>
            </div>

            {/* HAND RANKINGS MODAL */}
            {showRankings && (
                <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-200" onClick={() => setShowRankings(false)}>
                    <div className="bg-[#1a1c23]/95 border border-white/10 rounded-3xl p-8 shadow-2xl max-h-full overflow-y-auto no-scrollbar max-w-5xl w-full" onClick={e => e.stopPropagation()}>

                        <div className="flex items-center justify-between mb-6 sticky top-0 bg-[#1a1c23] z-10 pb-4 border-b border-white/5">
                            <div className="flex flex-col">
                                <div className="text-3xl font-black uppercase tracking-wider text-white">Poker Hand Rankings</div>
                                <div className="text-sm text-gray-400">Winning combinations from strongest to weakest</div>
                            </div>
                            <button onClick={() => setShowRankings(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {Object.entries(RANK_NAMES).reverse().map(([rankStr, name]) => {
                                const rank = parseInt(rankStr);
                                const playersWithRank = rankPresence[rank] || [];
                                const isActive = playersWithRank.length > 0;

                                return (
                                    <div key={rank} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isActive ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/5'}`}>

                                        {/* Rank Number Circle */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${isActive ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-500'}`}>
                                            {11 - rank}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`text-sm font-bold uppercase tracking-wider ${isActive ? 'text-blue-400' : 'text-gray-300'}`}>{name}</span>

                                                {/* Active Players Indicators */}
                                                <div className="flex -space-x-2">
                                                    {playersWithRank.map(pid => {
                                                        const pIdx = activePlayers.findIndex(ap => ap.name === pid);
                                                        if (pIdx === -1) return null;
                                                        const color = PLAYER_COLORS[pIdx % PLAYER_COLORS.length];
                                                        return (
                                                            <div key={pid} className="group relative">
                                                                <div className="w-3 h-3 rounded-full ring-2 ring-[#1a1c23] shadow-lg" style={{ backgroundColor: color }} />
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Example Cards - SMALL size */}
                                            <div className="flex gap-2">
                                                {EXAMPLE_HANDS[rank]?.map((c, i) => (
                                                    <div key={i} className="active:scale-110 transition-transform origin-bottom hover:-translate-y-1">
                                                        <PlayingCard card={c} small />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Hand Result Overlay - z-index ensures panels stay on top */}
            {lastHandResult && (
                <div className="absolute inset-0 z-50 flex flex-col justify-between p-8 pointer-events-none animate-in fade-in duration-500">

                    {/* TOP: Winner Info */}
                    <div className="flex flex-col items-center mt-4 drop-shadow-2xl">

                        {/* Winner Name - Reduced size */}
                        <div className="text-4xl lg:text-6xl font-black tracking-tighter drop-shadow-sm text-center px-4"
                            style={{
                                filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.8))',
                                color: winnerColor,
                                textShadow: `0 0 30px ${winnerColor}30`
                            }}>
                            {getWinnerName(lastHandResult.winners[0]) === "human" ? "Human" : getWinnerName(lastHandResult.winners[0])}
                        </div>

                        {/* Badges Row */}
                        <div className="flex items-center gap-3 mt-4 mb-4">
                            <div className="px-4 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md shadow-xl flex items-center gap-2">
                                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Pot</span>
                                <span className="text-emerald-400 text-sm font-mono font-bold">${lastHandResult.pot}</span>
                            </div>

                            {lastHandResult.winning_hand_name && (
                                <div className="px-5 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-md shadow-xl">
                                    <span className="text-yellow-500 text-[10px] font-black uppercase tracking-widest">
                                        {lastHandResult.winning_hand_name}
                                    </span>
                                </div>
                            )}

                            {pokerState.wins && (
                                <div className="px-4 py-1.5 rounded-full bg-black/40 border border-white/5 backdrop-blur-md shadow-xl flex items-center gap-2">
                                    <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Wins</span>
                                    <span className="text-white text-sm font-bold">{winnerWins}</span>
                                </div>
                            )}
                        </div>

                        {lastHandResult.winners.length > 1 && (
                            <div className="text-[10px] text-white/30 font-mono uppercase tracking-widest">+ {lastHandResult.winners.length - 1} others</div>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-4 mb-20 pointer-events-auto">
                        <div className="flex gap-3 bg-black/90 p-3 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl ring-1 ring-white/5">
                            <button
                                onClick={() => makeHumanMove("next")}
                                className="px-10 py-4 bg-white hover:bg-gray-200 text-black font-black text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl flex items-center gap-2 transition-all hover:-translate-y-0.5 active:scale-95"
                            >
                                <Play className="w-5 h-5 fill-current" /> Next Hand
                            </button>

                            <button
                                onClick={onStop}
                                className="px-6 py-4 bg-[#2a2d36] hover:bg-[#323640] text-gray-300 hover:text-white font-bold text-sm uppercase tracking-wider rounded-xl border border-gray-700 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <ArrowLeft className="w-5 h-5" /> Menu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Game Arena with Table and Players */}
            <div className="flex-1 relative">
                <GameArena players={arenaPlayers}>
                    <PokerTable gameState={gameState} />
                </GameArena>
            </div>

            {/* Controls for Human - Fixed at bottom, outside the arena */}
            {/* HIDE when overlay is active */}
            {isHumanTurn && !gameState.game_over && !lastHandResult && (
                <div className="shrink-0 flex justify-center py-4 bg-gradient-to-t from-black/50 to-transparent">
                    <div className="flex gap-3 bg-black/60 p-2 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom-4">
                        <button
                            onClick={() => makeHumanMove('fold')}
                            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
                        >
                            Fold
                        </button>
                        <button
                            onClick={() => makeHumanMove('check')}
                            className="px-6 py-3 bg-[#2a2d36] hover:bg-[#323640] text-gray-300 hover:text-white font-bold rounded-xl border border-gray-700 transition-all active:scale-95"
                        >
                            Check
                        </button>
                        <button
                            onClick={() => makeHumanMove('call')}
                            className="px-8 py-3 bg-white hover:bg-gray-200 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-95"
                        >
                            Call
                        </button>

                        {/* Raise with input */}
                        <div className="flex items-center gap-1 bg-[#1a1c23] rounded-xl border border-gray-700 overflow-hidden">
                            <input
                                type="number"
                                value={raiseAmount}
                                onChange={(e) => setRaiseAmount(e.target.value)}
                                placeholder={String(minRaise)}
                                className="w-20 px-3 py-3 bg-transparent text-white text-center font-mono font-bold outline-none placeholder:text-gray-500"
                            />
                            <button
                                onClick={handleRaise}
                                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all active:scale-95"
                            >
                                Raise
                            </button>
                        </div>

                        <button
                            onClick={() => makeHumanMove('allin')}
                            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 border border-yellow-400/50"
                        >
                            ALL IN
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
