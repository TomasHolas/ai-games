import React from 'react';
import { PlayingCard } from './PlayingCard';
import type { GameState } from '../types';

interface PokerTableProps {
    gameState: GameState | null;
    onRestart?: () => void;
    onStop?: () => void;
}

interface PokerState {
    pot: number;
    community_cards: string[];
    last_hand_result: {
        winners: string[];
        pot: number;
        community_cards: string[];
        player_hands: Record<string, string[]>;
        winning_cards?: string[];
        winning_kickers?: string[];
    } | null;
}

export const PokerTable: React.FC<PokerTableProps> = ({ gameState }) => {
    const pokerState = gameState?.board as unknown as PokerState;
    if (!pokerState) return null;

    const { community_cards, pot } = pokerState;
    const winningCards = pokerState.last_hand_result?.winning_cards || [];
    const winningKickers = pokerState.last_hand_result?.winning_kickers || [];

    return (
        <div className="relative w-[600px] h-[300px] bg-[#35654d] border-[12px] border-[#4a3c31] rounded-[150px] shadow-[inset_0_0_80px_rgba(0,0,0,0.5)] flex items-center justify-center select-none transform transition-all">
            {/* Table Felt Texture */}
            <div className="absolute inset-0 rounded-[140px] border border-white/10 opacity-50 pointer-events-none"></div>

            {/* Center Area: Community Cards and Pot */}
            <div className="flex flex-col items-center gap-4 z-10 scale-90">
                <div className="flex items-center gap-2 h-24">
                    {community_cards.map((c, i) => (
                        <PlayingCard key={i} card={c} isWinning={winningCards.includes(c)} isKicker={winningKickers.includes(c)} />
                    ))}
                    {/* Placeholders */}
                    {Array.from({ length: 5 - community_cards.length }).map((_, i) => (
                        <div key={`ph-${i}`} className="w-16 h-24 bg-black/10 rounded border-2 border-dashed border-white/10 opacity-50" />
                    ))}
                </div>

                <div className="flex flex-col items-center">
                    {/* Total Pot */}
                    <div className="text-white/60 text-[10px] uppercase tracking-widest font-bold mb-1">Total Pot</div>
                    <div className="text-xl font-mono text-yellow-400 font-bold flex items-center gap-2 bg-black/30 px-5 py-1.5 rounded-full border border-white/10 shadow-inner">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full border border-yellow-600 shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
                        {pot}
                    </div>
                </div>
            </div>
        </div>
    );
};
