import React from 'react';
import { X, Terminal, Brain, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { LogEntry } from '../types';

interface DebugModalProps {
    log: LogEntry;
    onClose: () => void;
}

export const DebugModal: React.FC<DebugModalProps> = ({ log, onClose }) => {
    // Check duplication logic
    const isThinkingSameAsResponse = log.thinking && log.raw_response && log.thinking.trim() === log.raw_response.trim();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-surface border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                            <Terminal className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">Turn {log.turn} Debug</h2>
                            <p className="text-xs text-muted font-mono">{log.player}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Full Model Response */}
                    <section className="space-y-2">
                        <div className="flex items-center gap-2 text-secondary text-xs font-bold uppercase tracking-wider">
                            <Brain className="w-3.5 h-3.5" />
                            <span>Full Model Response</span>
                        </div>
                        <div className="bg-black/40 rounded-xl p-4 border border-white/5 text-sm text-gray-300 leading-relaxed overflow-hidden">
                            {/* Thinking / Reasoning */}
                            {log.thinking && (
                                <div className={`mb-4 pb-4 ${!isThinkingSameAsResponse ? 'border-b border-white/10' : ''}`}>
                                    <div className="text-[10px] uppercase font-bold mb-2 opacity-50 text-accent">Reasoning Process</div>
                                    <div className="prose-custom text-gray-400 italic">
                                        <ReactMarkdown>{log.thinking}</ReactMarkdown>
                                    </div>
                                </div>
                            )}

                            {/* Final Response (only if different) */}
                            {(!log.thinking || !isThinkingSameAsResponse) && (
                                <div>
                                    {log.thinking && <div className="text-[10px] uppercase font-bold mb-2 opacity-50 text-white">Action</div>}
                                    <div className="prose-custom text-white">
                                        <ReactMarkdown>{log.raw_response || "No response content"}</ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Prompts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <section className="space-y-2 flex flex-col h-full">
                            <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider shrink-0">
                                <Terminal className="w-3.5 h-3.5" />
                                <span>System Prompt</span>
                            </div>
                            <div className="bg-black/40 rounded-xl p-4 border border-white/5 text-[11px] text-gray-400 flex-1 h-full overflow-y-auto max-h-[300px]">
                                <div className="prose-custom">
                                    <ReactMarkdown>{(log.system_prompt || "N/A").replace(/\n/g, "  \n")}</ReactMarkdown>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-2 flex flex-col h-full">
                            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider shrink-0">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>User Prompt</span>
                            </div>
                            <div className="bg-black/40 rounded-xl p-4 border border-white/5 text-[11px] text-gray-400 flex-1 h-full overflow-y-auto max-h-[300px]">
                                <div className="prose-custom">
                                    <ReactMarkdown>{(log.user_prompt || "N/A").replace(/\n/g, "  \n")}</ReactMarkdown>
                                </div>
                            </div>
                        </section>
                    </div>

                    <style>{`
                        .prose-custom p { margin-bottom: 0.5rem; }
                        .prose-custom p:last-child { margin-bottom: 0; }
                        .prose-custom strong { color: white; font-weight: 700; }
                        .prose-custom ul { list-style-type: disc; padding-left: 1.25rem; margin-bottom: 0.5rem; }
                        .prose-custom ol { list-style-type: decimal; padding-left: 1.25rem; margin-bottom: 0.5rem; }
                        .prose-custom code { background-color: rgba(255,255,255,0.1); padding: 0.1em 0.3em; rounded: 0.2em; font-family: monospace; }
                        .prose-custom pre { background-color: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 0.5rem;}
                    `}</style>
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/20 border-t border-gray-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
