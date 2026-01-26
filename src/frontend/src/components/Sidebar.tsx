import React from 'react';
import { Zap, LayoutGrid, Play, BarChart2, History, Bug } from 'lucide-react';
import type { ProviderStatus } from '../types';

type ViewType = 'dashboard' | 'games' | 'metrics' | 'match' | 'history' | 'replay';

interface SidebarProps {
    view: ViewType;
    setView: (view: ViewType) => void;
    apiStatus: ProviderStatus[];
    isDebugMode: boolean;
    setIsDebugMode: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ view, setView, apiStatus, isDebugMode, setIsDebugMode }) => (
    <nav className="w-64 bg-surface border-r border-gray-800 flex flex-col p-4 shrink-0">
        <div className="flex items-center gap-3 mb-8 px-2">
            <Zap className="w-6 h-6 text-accent" />
            <span className="font-bold text-lg tracking-tight">AI Games</span>
        </div>

        <div className="space-y-2">
            <button
                onClick={() => setView('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-primary/20 text-primary font-bold' : 'text-muted hover:bg-white/5'}`}
            >
                <LayoutGrid className="w-5 h-5" /> Dashboard
            </button>
            <button
                onClick={() => setView('games')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'games' ? 'bg-primary/20 text-primary font-bold' : 'text-muted hover:bg-white/5'}`}
            >
                <Play className="w-5 h-5" /> Catalogue
            </button>
            <button
                onClick={() => setView('history')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'history' ? 'bg-primary/20 text-primary font-bold' : 'text-muted hover:bg-white/5'}`}
            >
                <History className="w-5 h-5" /> History
            </button>
            <button
                onClick={() => setView('metrics')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'metrics' ? 'bg-primary/20 text-primary font-bold' : 'text-muted hover:bg-white/5'}`}
            >
                <BarChart2 className="w-5 h-5" /> Analytics
            </button>
        </div>

        <div className="mt-auto space-y-4">
            {/* Debug Mode Toggle */}
            <div className="px-4 py-3 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bug className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold text-gray-300">Debug Mode</span>
                </div>
                <button
                    onClick={() => setIsDebugMode(!isDebugMode)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${isDebugMode ? 'bg-orange-500' : 'bg-gray-700'}`}
                >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${isDebugMode ? 'left-6' : 'left-1'}`} />
                </button>
            </div>

            <div className="px-4 py-4 bg-black/20 rounded-xl border border-white/5">
                <div className="text-xs text-muted font-bold uppercase mb-3">API Connectivity</div>

                <div className="space-y-2">
                    {apiStatus.length > 0 ? apiStatus.map((status, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">{status.provider}</span>
                            <div className={`flex items-center gap-1.5 ${status.ready ? "text-green-400" : "text-gray-600"}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${status.ready ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "bg-gray-600"}`}></div>
                                <span className="font-bold">{status.ready ? "READY" : "N/A"}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="text-gray-600 italic text-[10px]">Loading status...</div>
                    )}
                </div>
            </div>
        </div>
    </nav>
);
