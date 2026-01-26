import React, { useEffect, useState, useMemo } from 'react';
import { Shield, LayoutGrid, Cpu, Grid3X3, Gamepad2 } from 'lucide-react';
import { ModelIcon } from '../components';
import { API_ENDPOINTS } from '../config';
import type { ModelStats, ModelConfig } from '../types';

interface MetricsViewProps {
    models: ModelConfig[];
}

const GAME_TYPES = [
    { id: 'all', label: 'All Games', icon: null },
    { id: 'tictactoe', label: 'Tic-Tac-Toe', icon: Grid3X3 },
    { id: 'tictactoe_plus', label: 'Tic-Tac-Toe Plus', icon: Gamepad2 },
    { id: 'poker', label: "No-Limit Hold'em", icon: Grid3X3 },
];

export const MetricsView: React.FC<MetricsViewProps> = ({ models }) => {
    const [stats, setStats] = useState<ModelStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [grouping, setGrouping] = useState<'models' | 'providers'>('models');
    const [gameTypeFilter, setGameTypeFilter] = useState('all');

    useEffect(() => {
        setLoading(true);
        const url = gameTypeFilter === 'all'
            ? API_ENDPOINTS.stats
            : `${API_ENDPOINTS.stats}?game_type=${gameTypeFilter}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [gameTypeFilter]);

    const [confirmReset, setConfirmReset] = useState(false);

    const handleReset = async () => {
        if (!confirmReset) {
            setConfirmReset(true);
            // Auto-cancel after 3 seconds if not confirmed
            setTimeout(() => setConfirmReset(false), 3000);
            return;
        }

        try {
            await fetch(API_ENDPOINTS.statsReset, { method: "POST" });
            setStats([]);
        } catch (err) {
            console.error(err);
        } finally {
            setConfirmReset(false);
        }
    };

    const getProvider = (modelId: string): string => {
        const m = models.find(model => model.id === modelId);
        return m?.provider || "Other";
    };

    const processedData = useMemo(() => {
        let data: ModelStats[] = [];
        if (grouping === 'models') {
            data = [...stats];
        } else {
            // Group by provider
            const groups: Record<string, {
                model_id: string;
                matches: number;
                wins: number;
                total_latency_weighted: number;
                invalid_moves: number;
                errors: number;
                starts: number;
            }> = {};

            stats.forEach(s => {
                const provider = getProvider(s.model_id);
                if (!groups[provider]) {
                    groups[provider] = {
                        model_id: provider,
                        matches: 0,
                        wins: 0,
                        total_latency_weighted: 0,
                        invalid_moves: 0,
                        errors: 0,
                        starts: 0
                    };
                }
                groups[provider].matches += s.matches;
                groups[provider].wins += s.wins;
                groups[provider].total_latency_weighted += (s.avg_latency * s.matches);
                groups[provider].invalid_moves += s.invalid_moves;
                groups[provider].errors += s.errors || 0;
                groups[provider].starts += s.starts || 0;
            });

            data = Object.values(groups).map(g => ({
                ...g,
                draws: 0,
                losses: 0,
                total_latency_ms: g.total_latency_weighted,
                total_tokens: 0,
                win_rate: g.matches > 0 ? (g.wins / g.matches) * 100 : 0,
                avg_latency: g.matches > 0 ? g.total_latency_weighted / g.matches : 0
            }));
        }
        return data.sort((a, b) => b.win_rate - a.win_rate);
    }, [stats, grouping, models, gameTypeFilter]);

    return (
        <div className="p-8 max-w-7xl mx-auto w-full">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Performance Analytics</h1>
                <div className="flex items-center gap-4">
                    <div className="bg-surface border border-gray-700 rounded-lg p-1 flex text-xs font-bold">
                        <button
                            onClick={() => setGrouping('models')}
                            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 ${grouping === 'models' ? 'bg-primary text-black shadow-sm' : 'text-muted hover:text-white'}`}
                        >
                            <LayoutGrid className="w-3 h-3" /> By Model
                        </button>
                        <button
                            onClick={() => setGrouping('providers')}
                            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 ${grouping === 'providers' ? 'bg-primary text-black shadow-sm' : 'text-muted hover:text-white'}`}
                        >
                            <Cpu className="w-3 h-3" /> By Provider
                        </button>
                    </div>
                    <button
                        onClick={handleReset}
                        className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 border transition-all ${confirmReset
                            ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 scale-105 shadow-red-500/20 shadow-lg'
                            : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20'
                            }`}
                    >
                        <Shield className="w-4 h-4" />
                        {confirmReset ? 'Really Delete All?' : 'Reset All Data'}
                    </button>
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

            <div className="overflow-hidden rounded-xl border border-gray-800 bg-surface">
                <table className="w-full text-left">
                    <thead className="bg-black/20 text-xs uppercase text-muted font-bold">
                        <tr>
                            <th className="p-4">{grouping === 'models' ? 'Model Name' : 'Provider'}</th>
                            <th className="p-4 text-right">Matches</th>
                            <th className="p-4 text-right">Starts</th>
                            <th className="p-4 text-right">Win Rate</th>
                            <th className="p-4 text-right cursor-pointer text-primary">Avg Latency (ms)</th>
                            <th className="p-4 text-center">Inv. Moves</th>
                            <th className="p-4 text-center text-red-400">Errors</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="p-12 text-center text-muted animate-pulse font-bold">
                                    Loading analytics...
                                </td>
                            </tr>
                        ) : processedData.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-12 text-center text-muted">
                                    <div className="flex flex-col items-center gap-2">
                                        <LayoutGrid className="w-8 h-8 opacity-20" />
                                        <span>No data recorded for this game type.</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            processedData.map((row, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium flex items-center gap-3">
                                        {grouping === 'models' ? (
                                            <div className="flex items-center gap-2">
                                                <ModelIcon model={row.model_id} size={16} />
                                                {models.find(m => m.id === row.model_id)?.name || row.model_id}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <ModelIcon provider={row.model_id} size={16} />
                                                <span>{row.model_id}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right font-mono text-muted">{row.matches}</td>
                                    <td className="p-4 text-right font-mono text-muted">{row.starts || 0}</td>
                                    <td className="p-4 text-right font-mono font-bold text-green-400">{row.win_rate.toFixed(1)}%</td>
                                    <td className="p-4 text-right font-mono text-yellow-400">{row.avg_latency.toFixed(0)}</td>
                                    <td className="p-4 text-center">
                                        {row.invalid_moves > 0 ?
                                            <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs font-bold">{row.invalid_moves}</span>
                                            : <span className="text-muted opacity-30">-</span>
                                        }
                                    </td>
                                    <td className="p-4 text-center">
                                        {row.errors > 0 ?
                                            <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs font-bold">{row.errors}</span>
                                            : <span className="text-muted opacity-30">-</span>
                                        }
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    );
};
