import React, { useEffect, useState } from 'react';
import { Card, ModelIcon } from '../components';
import { API_ENDPOINTS } from '../config';
import type { ModelStats, ModelConfig } from '../types';
import { Trophy, Target, Zap, Cpu, Star, Medal } from 'lucide-react';

interface DashboardViewProps {
    models: ModelConfig[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ models }) => {
    const [statsOverall, setStatsOverall] = useState<ModelStats[]>([]);
    const [statsTicTacToe, setStatsTicTacToe] = useState<ModelStats[]>([]);
    const [statsTicTacToePlus, setStatsTicTacToePlus] = useState<ModelStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const [overall, ttt, tttPlus] = await Promise.all([
                    fetch(API_ENDPOINTS.stats).then(res => res.json()),
                    fetch(`${API_ENDPOINTS.stats}?game_type=tictactoe`).then(res => res.json()),
                    fetch(`${API_ENDPOINTS.stats}?game_type=tictactoe_plus`).then(res => res.json()),
                ]);
                setStatsOverall(overall);
                setStatsTicTacToe(ttt);
                setStatsTicTacToePlus(tttPlus);
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const totalGames = statsOverall.reduce((acc, curr) => acc + curr.matches, 0) / 2;
    const modelsCount = models.length;
    const totalTokens = statsOverall.reduce((acc, curr) => acc + curr.total_tokens, 0);

    const getModelName = (id: string) => models.find(m => m.id === id)?.name || id;

    const renderModelRank = (model: ModelStats, index: number) => {
        const rankColors = [
            'from-yellow-400 to-yellow-600', // Gold
            'from-gray-300 to-gray-500',   // Silver
            'from-orange-400 to-orange-700', // Bronze
        ];

        return (
            <Card key={model.model_id} className="p-5 flex items-center justify-between transition-all hover:scale-[1.02] hover:bg-white/5 group bg-surface h-full">
                <div className="flex items-center gap-5 w-full">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold bg-gradient-to-br ${index < 3 ? rankColors[index] : 'from-gray-700 to-gray-800'} text-black shadow-lg`}>
                        {index === 0 ? <Trophy className="w-8 h-8" /> : index + 1}
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                            <ModelIcon model={model.model_id} size={20} />
                            {getModelName(model.model_id)}
                        </div>
                        <div className="flex gap-4 mt-1 text-xs font-bold uppercase tracking-wider">
                            <span className="text-green-400/80 flex items-center gap-1">
                                <Target className="w-3 h-3" /> {model.win_rate.toFixed(1)}% Win Rate
                            </span>
                            <span className="text-muted flex items-center gap-1 border-l border-gray-700 pl-4">
                                <Zap className="w-3 h-3" /> {model.matches} Matches
                            </span>
                            <span className="text-blue-400/80 flex items-center gap-1 border-l border-gray-700 pl-4">
                                <Cpu className="w-3 h-3" /> {model.total_tokens.toLocaleString()} Tokens
                            </span>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <div className="text-2xl font-mono font-bold text-primary">
                            {model.wins}
                        </div>
                        <div className="text-xxs uppercase font-bold text-muted">Wins</div>
                    </div>
                </div>
            </Card>
        );
    };

    const renderGameTop = (title: string, icon: React.ReactNode, stats: ModelStats[]) => {
        const topModel = stats.sort((a, b) => b.win_rate - a.win_rate)[0];

        return (
            <Card className="p-6 relative overflow-hidden border-t-4 border-t-primary/50">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    {icon}
                </div>
                <div className="text-muted text-xs uppercase font-bold mb-4 flex items-center gap-2">
                    {icon} {title}
                </div>
                {topModel ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <ModelIcon model={topModel.model_id} size={48} />
                                <div className="absolute -bottom-1 -right-1 bg-primary text-black rounded-full p-1 border-2 border-surface">
                                    <Star className="w-3 h-3 fill-current" />
                                </div>
                            </div>
                            <div>
                                <div className="font-bold text-xl">{getModelName(topModel.model_id)}</div>
                                <div className="text-green-400 font-mono font-bold text-lg">{topModel.win_rate.toFixed(1)}% WR</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center mt-2 pt-4 border-t border-gray-800/50">
                            <div>
                                <div className="text-sm font-mono font-bold">{topModel.wins}</div>
                                <div className="text-[10px] uppercase text-muted font-bold">Wins</div>
                            </div>
                            <div>
                                <div className="text-sm font-mono font-bold">{topModel.matches}</div>
                                <div className="text-[10px] uppercase text-muted font-bold">Games</div>
                            </div>
                            <div>
                                <div className="text-sm font-mono font-bold">{topModel.total_tokens.toLocaleString()}</div>
                                <div className="text-[10px] uppercase text-muted font-bold">Tokens</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-10 text-center text-muted text-sm font-bold opacity-50 italic">
                        No matches played yet
                    </div>
                )}
            </Card>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-700">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Arena Dashboard</h1>
                    <p className="text-muted font-medium">Real-time performance analytics for all integrated LLMs.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card className="p-6 border-l-4 border-l-primary bg-gradient-to-br from-surface to-primary/5">
                    <div className="text-muted text-xs uppercase font-bold mb-2 flex items-center gap-2">
                        <Zap className="w-3 h-3 text-primary" /> Available Models
                    </div>
                    <div className="text-4xl font-mono font-bold tracking-tighter">{modelsCount}</div>
                </Card>
                <Card className="p-6 border-l-4 border-l-secondary bg-gradient-to-br from-surface to-secondary/5">
                    <div className="text-muted text-xs uppercase font-bold mb-2 flex items-center gap-2">
                        <Target className="w-3 h-3 text-secondary" /> Total Games Played
                    </div>
                    <div className="text-4xl font-mono font-bold tracking-tighter">{Math.ceil(totalGames)}</div>
                </Card>
                <Card className="p-6 border-l-4 border-l-blue-500 bg-gradient-to-br from-surface to-blue-500/5">
                    <div className="text-muted text-xs uppercase font-bold mb-2 flex items-center gap-2">
                        <Cpu className="w-3 h-3 text-blue-500" /> Total Tokens Used
                    </div>
                    <div className="text-4xl font-mono font-bold tracking-tighter">{totalTokens.toLocaleString()}</div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Game Specific Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Medal className="w-5 h-5 text-primary" /> Top by Game
                    </h2>
                    {renderGameTop("Tic-Tac-Toe", <Target className="w-4 h-4" />, statsTicTacToe)}
                    {renderGameTop("Tic-Tac-Toe Plus", <Zap className="w-4 h-4" />, statsTicTacToePlus)}
                </div>

                {/* Right Column: Overall Leaderboard */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" /> Hall of Fame (Top 3 Overall)
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <Card key={i} className="p-5 h-24 animate-pulse bg-gray-800/50 border-gray-700/30">
                                    <div className="flex items-center gap-5 w-full h-full">
                                        <div className="w-14 h-14 rounded-xl bg-gray-700/50" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-700/50 rounded w-1/3" />
                                            <div className="h-3 bg-gray-700/50 rounded w-1/4" />
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : statsOverall.length > 0 ? (
                            statsOverall
                                .sort((a, b) => {
                                    // Primary: Win Rate
                                    if (b.win_rate !== a.win_rate) return b.win_rate - a.win_rate;
                                    // Secondary: Number of matches
                                    return b.matches - a.matches;
                                })
                                .slice(0, 3)
                                .map((model, index) => renderModelRank(model, index))
                        ) : (
                            <div className="text-muted p-12 text-center rounded-xl border-2 border-dashed border-gray-800">
                                No statistics available yet. Start the matches!
                            </div>
                        )}
                    </div>

                    {statsOverall.length > 3 && (
                        <div className="mt-8">
                            <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-4">Other Competitors</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-70">
                                {statsOverall
                                    .sort((a, b) => b.win_rate - a.win_rate)
                                    .slice(3, 7)
                                    .map((model) => (
                                        <Card key={model.model_id} className="p-3 flex items-center gap-3 bg-surface/50">
                                            <ModelIcon model={model.model_id} size={16} />
                                            <div className="flex-1 truncate font-medium text-sm">{getModelName(model.model_id)}</div>
                                            <div className="text-xs font-mono font-bold text-primary">{model.win_rate.toFixed(0)}%</div>
                                        </Card>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
