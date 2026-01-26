import React from 'react';
import { Play, ArrowRightLeft } from 'lucide-react';
import { Card, ModelIcon } from '../components';
import type { ModelConfig } from '../types';
import { PLAYER_COLORS } from '../config';

interface GamesViewProps {
    models: ModelConfig[];
    gameModels: Record<string, { p1: string; p2: string }>;
    setP1Model: (game: string, model: string) => void;
    setP2Model: (game: string, model: string) => void;
    gameType: string;
    setGameType: (type: string) => void;
    onStartGame: () => void;
    pokerPlayers?: string[];
    setPokerPlayers?: (players: string[]) => void;
    isDebugMode?: boolean;
}

const GAME_CATALOG = [
    {
        id: 'tictactoe',
        name: 'Tic-Tac-Toe',
        desc: '3x3 • Zero-sum',
        icons: ['X', 'O'],
        colors: ['#FF5555', '#50FA7B']
    },
    {
        id: 'tictactoe_plus',
        name: 'Tic-Tac-Toe Plus',
        desc: '9x9 • 5-in-a-row',
        icons: ['X', 'O', '+'],
        colors: ['#FF5555', '#50FA7B']
    },
    {
        id: 'poker',
        name: 'No-Limit Hold\'em',
        desc: '4 Players • Strategy',
        icons: ['♠', '♥'],
        colors: ['#FFB86C', '#BD93F9'],
        minPlayers: 4,
        maxPlayers: 8
    }
];

export const GamesView: React.FC<GamesViewProps> = ({
    models,
    gameModels,
    setP1Model,
    setP2Model,
    gameType,
    setGameType,
    onStartGame,
    pokerPlayers = [],
    setPokerPlayers,
    isDebugMode = false
}) => {
    // Auto-select human players in Debug Mode
    React.useEffect(() => {
        if (isDebugMode) {
            // Set for current game types (TTT)
            GAME_CATALOG.forEach(g => {
                if (g.id !== 'poker') {
                    setP1Model(g.id, 'human');
                    setP2Model(g.id, 'human');
                }
            });
            // Set for Poker
            if (setPokerPlayers) {
                setPokerPlayers(Array(4).fill('human'));
            }
        } else {
            // Reset to "Select Model" (empty) when Debug Mode is off
            GAME_CATALOG.forEach(g => {
                if (g.id !== 'poker') {
                    setP1Model(g.id, '');
                    setP2Model(g.id, '');
                }
            });
            if (setPokerPlayers) {
                setPokerPlayers(Array(4).fill(''));
            }
        }
    }, [isDebugMode]);

    return (
        <div className="p-8 mx-auto flex flex-col items-center min-h-screen w-full">
            <div className="text-center mb-10 w-full">
                <h1 className="text-4xl font-bold mb-4">Game Catalogue</h1>
                <p className="text-muted">Select a simulation environment to benchmark your models.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-[1600px]">
                {GAME_CATALOG.map(game => {
                    const isSelected = gameType === game.id;
                    const isPoker = game.id === 'poker';

                    return (
                        <Card
                            key={game.id}
                            onClick={() => setGameType(game.id)}
                            className={`p-8 cursor-pointer transition-all duration-300 border-2 flex flex-col h-full min-h-[400px] ${isSelected
                                ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_25px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/10'
                                : 'border-gray-800 hover:border-gray-700 bg-surface/80 hover:bg-surface'
                                }`}
                        >
                            <div className="flex items-center gap-8 mb-10">
                                <div className="w-20 h-20 bg-[#1e2330] rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-black/40"></div>
                                    <div className="relative flex gap-1 transform transition-transform group-hover:scale-110 items-center justify-center w-full h-full">
                                        <span className="text-4xl font-black" style={{ color: game.colors[0], fontFamily: 'Arial, sans-serif' }}>{game.icons[0]}</span>
                                        <span className="text-4xl font-black" style={{ color: game.colors[1], fontFamily: 'Arial, sans-serif' }}>{game.icons[1]}</span>
                                        {game.icons[2] && (
                                            <span className="text-4xl font-black text-gray-400 absolute -right-0 -top-1" style={{ fontFamily: 'Arial, sans-serif' }}>{game.icons[2]}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold">{game.name}</h2>
                                        {isSelected && (
                                            <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/30">Active</span>
                                        )}
                                    </div>
                                    <div className="text-muted text-base mt-1">{game.desc}</div>
                                </div>
                            </div>

                            {/* Configurations */}
                            <div className="mt-auto space-y-8 pt-6 border-t border-white/5">
                                {isPoker ? (
                                    <>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center mb-2">
                                                {/* Labels moved to individual inputs */}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                {pokerPlayers.map((playerModel, idx) => {
                                                    const playerColor = PLAYER_COLORS[idx % PLAYER_COLORS.length];
                                                    return (
                                                        <div key={idx} className="space-y-2">
                                                            <label className="text-xs font-bold text-muted uppercase tracking-wider pl-1 font-mono" style={{ color: playerColor }}>
                                                                Player {idx + 1}
                                                            </label>
                                                            <div
                                                                className="flex items-center gap-2 rounded-xl border transition-all duration-300"
                                                                style={{
                                                                    borderColor: `${playerColor}60`,
                                                                    boxShadow: `0 0 12px ${playerColor}20`,
                                                                    backgroundColor: `${playerColor}05`
                                                                }}
                                                            >
                                                                <div className="bg-background/50 border border-white/5 rounded-xl p-2 flex items-center justify-center shrink-0 ml-1">
                                                                    <ModelIcon
                                                                        model={playerModel || ""}
                                                                        provider={models.find(m => m.id === playerModel)?.provider}
                                                                        size={18}
                                                                    />
                                                                </div>
                                                                <select
                                                                    className="w-full bg-transparent border-none p-3 text-sm outline-none focus:ring-0 text-white font-medium"
                                                                    value={playerModel}
                                                                    onClick={e => e.stopPropagation()}
                                                                    onChange={e => {
                                                                        if (setPokerPlayers) {
                                                                            const newPlayers = [...pokerPlayers];
                                                                            newPlayers[idx] = e.target.value;
                                                                            setPokerPlayers(newPlayers);
                                                                            setGameType(game.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    <option value="" disabled>Select Model</option>
                                                                    {models.filter(m => !m.name.includes("Custom") && !m.id.includes("custom")).map(m => (
                                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-end gap-4">
                                        <div className="flex-1 space-y-3">
                                            <label className="text-xs font-bold text-muted uppercase tracking-wider pl-1 font-mono" style={{ color: game.colors[0] }}>Player 1</label>
                                            <div
                                                className="flex items-center gap-2 rounded-xl border transition-all duration-300"
                                                style={{
                                                    borderColor: `${game.colors[0]}60`,
                                                    boxShadow: `0 0 12px ${game.colors[0]}20`,
                                                    backgroundColor: `${game.colors[0]}05`
                                                }}
                                            >
                                                <div className="bg-background/50 border border-white/5 rounded-xl p-2 flex items-center justify-center shrink-0 ml-1">
                                                    <ModelIcon
                                                        model={gameModels[game.id]?.p1 || ""}
                                                        provider={models.find(m => m.id === (gameModels[game.id]?.p1))?.provider}
                                                        size={24}
                                                    />
                                                </div>
                                                <select
                                                    className="w-full bg-transparent border-none p-3 text-sm outline-none focus:ring-0 text-white font-medium"
                                                    value={gameModels[game.id]?.p1 || ""}
                                                    onClick={e => e.stopPropagation()}
                                                    onChange={e => {
                                                        setP1Model(game.id, e.target.value);
                                                        setGameType(game.id);
                                                    }}
                                                >
                                                    <option value="" disabled>Select Model</option>
                                                    {models.filter(m => !m.name.includes("Custom")).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setP1Model(game.id, gameModels[game.id]?.p2 || "");
                                                setP2Model(game.id, gameModels[game.id]?.p1 || "");
                                                setGameType(game.id);
                                            }}
                                            className="p-3 text-muted hover:text-white bg-surface border border-gray-700 hover:bg-gray-700 rounded-xl transition-all h-[52px]"
                                        >
                                            <ArrowRightLeft className="w-5 h-5" />
                                        </button>
                                        <div className="flex-1 space-y-3">
                                            <label className="text-xs font-bold text-muted uppercase tracking-wider pl-1 font-mono text-right block" style={{ color: game.colors[1] }}>Player 2</label>
                                            <div
                                                className="flex items-center gap-2 rounded-xl border transition-all duration-300"
                                                style={{
                                                    borderColor: `${game.colors[1]}60`,
                                                    boxShadow: `0 0 12px ${game.colors[1]}20`,
                                                    backgroundColor: `${game.colors[1]}05`
                                                }}
                                            >
                                                <select
                                                    className="w-full bg-transparent border-none p-3 text-sm outline-none focus:ring-0 text-white font-medium text-right"
                                                    value={gameModels[game.id]?.p2 || ""}
                                                    onClick={e => e.stopPropagation()}
                                                    onChange={e => {
                                                        setP2Model(game.id, e.target.value);
                                                        setGameType(game.id);
                                                    }}
                                                >
                                                    <option value="" disabled>Select Model</option>
                                                    {models.filter(m => !m.name.includes("Custom")).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                </select>
                                                <div className="bg-background/50 border border-white/5 rounded-xl p-2 flex items-center justify-center shrink-0 mr-1">
                                                    <ModelIcon
                                                        model={gameModels[game.id]?.p2 || ""}
                                                        provider={models.find(m => m.id === (gameModels[game.id]?.p2))?.provider}
                                                        size={24}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {isSelected ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onStartGame();
                                        }}
                                        disabled={isPoker ? pokerPlayers.some(p => !p) : (!gameModels[game.id]?.p1 || !gameModels[game.id]?.p2)}
                                        className={`w-full font-bold py-4 text-base rounded-xl flex items-center justify-center gap-3 transition-all ${(isPoker ? pokerPlayers.some(p => !p) : (!gameModels[game.id]?.p1 || !gameModels[game.id]?.p2))
                                            ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed opacity-50'
                                            : 'bg-white text-black hover:bg-emerald-50 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:-translate-y-0.5'
                                            }`}
                                    >
                                        <Play className="w-5 h-5 fill-current" /> Start Simulation
                                    </button>
                                ) : (
                                    <div className="w-full py-4 text-center text-sm font-bold text-muted bg-black/20 rounded-xl border border-dashed border-white/5 opacity-50">
                                        Click to Select Environment
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div >
    );
};
