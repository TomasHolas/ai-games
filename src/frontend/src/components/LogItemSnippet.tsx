import React, { useState } from 'react';
import { Clock, Bug, Coins } from 'lucide-react';
import type { LogEntry, ModelConfig } from '../types';
import { DebugModal } from './DebugModal';
import { ModelIcon } from './ModelIcon';
import { PLAYER_COLORS } from '../config';

interface LogItemSnippetProps {
    log: LogEntry;
    models: ModelConfig[];
}

export const LogItemSnippet: React.FC<LogItemSnippetProps> = ({ log, models }) => {
    const [showDebug, setShowDebug] = useState(false);

    if (log.move === "--- HAND OVER ---" || log.move === "New hand started") {
        return null;
    }

    // Turn 0 is usually a system message, unless it's a real move coordinate OR an invalid move OR a poker move ("played")
    // Invalid moves are NOT system messages - they should show in player color
    const isSystem = log.player === 'System' || (
        log.turn === 0 &&
        !log.move.includes(",") &&
        !log.is_invalid &&
        !log.move.toLowerCase().includes("played")
    );

    // System Announcement Banner (FLOP, TURN, RIVER, etc)
    const isSystemAnnouncement = isSystem && (
        log.move.includes("---") ||
        log.move.includes("Game started") ||
        log.move === "New hand started" ||
        log.is_hand_summary ||
        ['FLOP', 'TURN', 'RIVER', 'PREFLOP', 'SHOWDOWN'].some(s => log.move.toUpperCase().includes(s))
    );

    if (isSystemAnnouncement) {
        let cleanMessage = log.move.replace(/[-_]/g, '').trim();
        // If it's the hand summary, use "HAND OVER" as the simple end marker
        if (log.is_hand_summary) cleanMessage = "HAND OVER";

        return (
            <div className="my-1 mx-2 relative group">
                <div className="relative flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/[0.02] transition-colors group-hover:bg-white/[0.03]">
                    <div className="flex items-center gap-3 mb-1 opacity-40">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">System</span>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" />
                    </div>

                    <div className="text-sm font-bold text-gray-400 tracking-wider uppercase">
                        {cleanMessage}
                    </div>
                </div>
            </div>
        );
    }

    // --- RE-ADDING REMOVED LOGIC FOR REGULAR MOVES ---
    // Use player_index for multi-player games (poker), fallback to turn-based for 2-player games
    const playerIndex = log.player_index ?? (log.turn % 2);
    const playerColor = !isSystem ? PLAYER_COLORS[playerIndex % PLAYER_COLORS.length] : '#6b7280';

    const hasDebugInfo = log.thinking || log.system_prompt || log.user_prompt;

    const modelConfig = models.find(m => m.id === log.player);
    const modelName = modelConfig?.name || log.player;

    // Extract coordinates if they exist (for TTT)
    const coordMatch = log.move.match(/\(?(\d+)[\s,]+(\d+)\)?/);
    const hasCoords = !!coordMatch;

    // Extract poker action from messages like "human 1 played call" or "InvalidMove 'check' by human"
    const pokerPlayedMatch = log.move.match(/played\s+(.+)$/i);
    const pokerInvalidMatch = log.move.match(/Invalid move ['"]?([^'"]+)['"]?/i);

    let moveDisplay: string;
    if (hasCoords) {
        moveDisplay = `${coordMatch![1]},${coordMatch![2]}`;
    } else if (pokerPlayedMatch) {
        moveDisplay = pokerPlayedMatch[1].toUpperCase();
    } else if (pokerInvalidMatch) {
        moveDisplay = pokerInvalidMatch[1].toUpperCase();
    } else {
        moveDisplay = log.move;
    }

    // If invalid, try to extract what the model actually tried to play from raw_response
    if (log.is_invalid && log.raw_response && !hasCoords && log.raw_response.length < 50) {
        const rawCoordMatch = log.raw_response.match(/\(?(\d+)[\s,]+(\d+)\)?/);
        if (rawCoordMatch) {
            moveDisplay = `${rawCoordMatch[1]},${rawCoordMatch[2]}`;
        }
    }

    return (
        <div className={`flex flex-col gap-2 p-3.5 rounded-xl transition-all group border mx-2 my-1
            ${log.is_invalid ? "bg-red-500/[0.03] border-red-500/10" : "hover:bg-white/[0.03] border-transparent hover:border-white/5"}`}>
            <div className="flex gap-4 items-start transition-all">
                {/* Turn Indicator */}
                <div
                    className={`mt-1 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg border transition-colors ${isSystem ? "bg-gray-800 text-gray-500 border-gray-700" : "text-white"}`}
                    style={!isSystem ? { backgroundColor: playerColor, borderColor: `${playerColor}40` } : undefined}
                >
                    {log.turn}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            {!isSystem && (
                                <ModelIcon
                                    model={log.player}
                                    provider={modelConfig?.provider}
                                    size={14}
                                    className="opacity-60"
                                />
                            )}
                            <span className={`font-black text-[10px] uppercase tracking-wider truncate shrink ${isSystem ? "text-gray-500" : "text-gray-400"}`}>
                                {modelName}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[9px] text-gray-600 font-mono hidden sm:inline">{log.timestamp}</span>

                            {/* Debug Button - Always takes space to keep layout stable */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDebug(true);
                                }}
                                className={`flex items-center gap-1.5 px-2 py-1 bg-accent/10 hover:bg-accent/20 border border-accent/20 rounded-md text-[9px] font-black text-accent transition-all hover:scale-105 active:scale-95 ${hasDebugInfo ? "opacity-100" : "opacity-0 pointer-events-none invisible"}`}
                            >
                                <Bug className="w-3 h-3" />
                                <span className="hidden sm:inline">DEBUG</span>
                            </button>
                        </div>
                    </div>

                    {/* The Pretty Move Display */}
                    <div className="flex items-center gap-3">
                        {isSystem ? (
                            <div className="text-gray-500 text-sm font-medium italic">{log.move}</div>
                        ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                                <div
                                    className="flex items-center font-mono text-sm font-bold tracking-tight px-3 py-1.5 rounded-lg border shadow-inner transition-colors"
                                    style={{
                                        backgroundColor: `${playerColor}10`,
                                        borderColor: `${playerColor}30`,
                                        color: playerColor
                                    }}
                                >
                                    <span className="text-[10px] opacity-40 mr-2 uppercase font-black">Move</span>
                                    {moveDisplay.length > 50 ? moveDisplay.substring(0, 50) + "..." : moveDisplay}
                                </div>


                                {log.thinking && (
                                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded border bg-amber-500/5 text-amber-500/80 border-amber-500/10">
                                        <div className="w-1 h-1 rounded-full bg-amber-500" />
                                        Thinking
                                    </div>
                                )}

                                {log.is_invalid && (
                                    <div className="px-2 py-1.5 bg-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-lg border border-red-500/30 animate-pulse">
                                        Invalid
                                    </div>
                                )}

                                {log.metrics && (
                                    <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity ml-1">
                                        <div className="flex items-center gap-1 text-[9px] font-mono bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                            <Clock className="w-2.5 h-2.5" /> {(log.metrics.latency_ms / 1000).toFixed(1)}s
                                        </div>
                                        <div className="flex items-center gap-1 text-[9px] font-mono bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                            <Coins className="w-2.5 h-2.5" /> {log.metrics.total_tokens}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Thinking Preview removed as per user request - use Debug button for details */}

            {showDebug && <DebugModal log={log} onClose={() => setShowDebug(false)} />}
        </div>
    );
};
