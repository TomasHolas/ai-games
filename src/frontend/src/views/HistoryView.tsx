import React, { useEffect, useState } from 'react';
import { History, Search, AlertTriangle, Grid3X3, Gamepad2, Coins } from 'lucide-react';
import { ModelIcon } from '../components';
import { API_ENDPOINTS, PLAYER_COLORS } from '../config';
import type { ModelConfig } from '../types';

interface HistoryRecord {
    match_id: string;
    timestamp: number;
    game_type: string;
    player1: string;
    player2: string;
    players_list?: string[]; // New field for N-player games
    winner_model_id: string | null;
    winner_index?: number | null;
    error_model_id?: string;
    error_index?: number | null;
    model_stats?: Record<string, { latency_sum: number, tokens: number, invalid_moves: number }>;
}

interface HistoryViewProps {
    models: ModelConfig[];
    onSelectMatch: (matchId: string) => void;
}

const GAME_TYPES = [
    { id: 'all', label: 'All Games', icon: null },
    { id: 'tictactoe', label: 'Tic-Tac-Toe', icon: Grid3X3 },
    { id: 'tictactoe_plus', label: 'Tic-Tac-Toe Plus', icon: Gamepad2 },
    { id: 'poker', label: "No-Limit Hold'em", icon: Grid3X3 },
];

const GAME_BADGE_LABELS: Record<string, string> = {
    'poker': 'POKER',
    'tictactoe': '3x3',
    'tictactoe_plus': '9x9',
};

export const HistoryView: React.FC<HistoryViewProps> = ({ models, onSelectMatch }) => {
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [gameTypeFilter, setGameTypeFilter] = useState("all");

    useEffect(() => {
        setLoading(true);
        const url = gameTypeFilter === 'all'
            ? API_ENDPOINTS.history
            : `${API_ENDPOINTS.history}?game_type=${gameTypeFilter}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setHistory(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load history", err);
                setLoading(false);
            });
    }, [gameTypeFilter]);

    const getModelName = (id: string) => models.find(m => m.id === id)?.name || id;
    const getProvider = (id: string) => models.find(m => m.id === id)?.provider || "";

    const filtered = history.filter(h => {
        const matchesSearch = h.match_id.includes(searchTerm) ||
            h.player1.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.player2.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (h.players_list && h.players_list.some(p => p.toLowerCase().includes(searchTerm.toLowerCase())));
        return matchesSearch;
    });

    return (
        <div className="p-8 w-full max-w-6xl mx-auto min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Game History</h1>
                    <p className="text-muted">Review past matchups and replays.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search games..."
                        className="bg-surface border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-white/20 outline-none w-64"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Game Type Tabs */}
            <div className="flex gap-2 mb-6">
                {GAME_TYPES.map((gt) => (
                    <button
                        key={gt.id}
                        onClick={() => setGameTypeFilter(gt.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${gameTypeFilter === gt.id
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'bg-surface border border-gray-800 text-muted hover:bg-white/5'
                            }`}
                    >
                        {gt.icon && <gt.icon className="w-4 h-4" />}
                        {gt.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20 text-muted animate-pulse">Loading archive...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-surface/50 rounded-xl border border-dashed border-gray-800">
                    <History className="w-12 h-12 mx-auto text-gray-700 mb-4" />
                    <div className="text-xl font-bold text-muted">No games found</div>
                    <p className="text-sm text-gray-600 mt-2">Completed games will appear here.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map((game) => {
                        // UNIFIED VIEW (Based on Poker/Multiplayer Style)
                        const players = game.players_list || [game.player1, game.player2];
                        const winner = game.winner_model_id;
                        const isError = !!game.error_model_id;

                        // Determine winner color & index
                        let winnerColor = '#FACC15'; // Default Gold/Yellow
                        let winnerIdx = -1;

                        if (game.winner_index !== undefined && game.winner_index !== null) {
                            winnerIdx = game.winner_index;
                        } else if (winner) {
                            // Fallback for old records without index
                            winnerIdx = players.findIndex(p => p.toLowerCase() === winner.toLowerCase());
                        }

                        if (winnerIdx !== -1) {
                            winnerColor = PLAYER_COLORS[winnerIdx % PLAYER_COLORS.length];
                        }

                        return (
                            <div
                                key={game.match_id}
                                onClick={() => onSelectMatch(game.match_id)}
                                className="bg-surface border border-gray-800 p-4 rounded-xl flex items-center justify-between hover:bg-white/5 cursor-pointer transition-all group"
                            >
                                <div className="flex items-center gap-6">
                                    {/* Date & Game Icon */}
                                    <div className="flex flex-col items-center min-w-[60px] gap-1">
                                        <div className="text-[10px] text-gray-500 font-mono">
                                            {new Date(game.timestamp * 1000).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-gray-400 font-mono mb-1">
                                            {new Date(game.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-muted uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                            <span>{GAME_BADGE_LABELS[game.game_type] || game.game_type.toUpperCase()}</span>
                                        </div>
                                    </div>

                                    {/* Unified Layout */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-muted uppercase tracking-wider">{players.length} PLAYERS</span>
                                            {winner ? (
                                                <div
                                                    className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border bg-black/40"
                                                    style={{
                                                        borderColor: `${winnerColor}40`,
                                                        color: winnerColor
                                                    }}
                                                >
                                                    <span>Winner:</span>
                                                    <span className="truncate max-w-[150px]">{getModelName(winner)}</span>
                                                </div>
                                            ) : !isError && (
                                                <div className="flex items-center gap-1 text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                    <span>Draw</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {players.slice(0, 4).map((p, i) => {
                                                // Robust winner check using Index if available
                                                let isWinner = false;
                                                if (winnerIdx !== -1) {
                                                    isWinner = i === winnerIdx;
                                                } else if (winner) {
                                                    isWinner = p.toLowerCase() === winner.toLowerCase();
                                                }

                                                const playerColor = PLAYER_COLORS[i % PLAYER_COLORS.length];

                                                return (
                                                    <div
                                                        key={i}
                                                        className={`flex items-center gap-1.5 px-2 py-1 rounded bg-black/20 border`}
                                                        style={{
                                                            borderColor: isWinner ? `${playerColor}60` : 'rgba(255,255,255,0.05)',
                                                            color: isWinner ? playerColor : undefined
                                                        }}
                                                    >
                                                        <ModelIcon model={p} provider={getProvider(p)} size={14} />
                                                        <span className={`text-xs ${isWinner ? "font-bold" : "text-gray-400"}`}>
                                                            {getModelName(p) === "human" ? "Human" : getModelName(p)}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                            {players.length > 4 && (
                                                <div className="text-xs text-muted font-mono">+{players.length - 4}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {/* Match Metrics Summary */}
                                    {isError && (
                                        <div className="bg-red-500/10 text-red-400 px-3 py-1 rounded text-xs font-bold font-mono flex items-center gap-2 border border-red-500/20">
                                            <AlertTriangle className="w-3 h-3" /> ERROR
                                        </div>
                                    )}
                                    {game.model_stats && (
                                        <div className="flex items-center gap-4 text-[10px] font-mono opacity-60">
                                            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded border border-white/5">
                                                <Coins className="w-3 h-3 text-amber-500" />
                                                <span>{Object.values(game.model_stats).reduce((a, b) => a + (b.tokens || 0), 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
