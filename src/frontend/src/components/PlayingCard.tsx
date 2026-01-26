import React from 'react';

interface PlayingCardProps {
    card: string;
    small?: boolean;
    micro?: boolean;
    hidden?: boolean;
    isWinning?: boolean;
    isKicker?: boolean;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({ card, small, hidden, isWinning, isKicker, micro }) => {
    if (hidden) {
        return (
            <div className={`${small ? 'w-8 h-12' : 'w-16 h-24'} bg-blue-900 rounded border-2 border-white/20 flex flex-col items-center justify-center shadow-lg relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/30"></div>
                <span className="text-2xl opacity-50">♠</span>
            </div>
        );
    }

    const rank = card.slice(0, -1);
    const suit = card.slice(-1);

    // Support both Unicode symbols (♥♦♣♠) and ASCII (h,d,c,s)
    const isRedSuit = suit === '♥' || suit === '♦' || suit === 'h' || suit === 'd';
    const color = isRedSuit ? 'text-red-500' : 'text-gray-900';

    // Map ASCII to Unicode if needed
    const suitSymbolMap: Record<string, string> = { h: '♥', d: '♦', c: '♣', s: '♠', '♥': '♥', '♦': '♦', '♣': '♣', '♠': '♠' };
    const suitSymbol = suitSymbolMap[suit] || suit;

    // Map internal rank to display if needed (but 'A', 'K', '10' are fine)
    const displayRank = rank.replace('T', '10');

    if (micro) {
        return (
             <div className={`w-5 h-7 bg-white rounded-[2px] flex flex-col items-center justify-center shadow-sm select-none border-[0.5px] border-gray-400 ${isWinning ? 'ring-1 ring-yellow-400' : ''}`}>
                 <span className={`text-[6px] leading-none font-bold ${color} -mb-0.5`}>{displayRank}</span>
                 <span className={`text-[7px] leading-none ${color}`}>{suitSymbol}</span>
             </div>
        );
    }

    return (
        <div className={`${small ? 'w-8 h-12 text-sm' : 'w-16 h-24 text-xl'} bg-white rounded flex flex-col items-center justify-center shadow-lg relative select-none group hover:-translate-y-1 transition-transform duration-200
            ${isWinning ? 'ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)] z-10 scale-110 !border-yellow-300' : isKicker ? 'ring-4 ring-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)] z-10 scale-105 !border-orange-400' : ''}
        `}>
            <div className={`absolute top-1 left-1 leading-none ${small ? 'text-[8px]' : 'text-xs'} font-bold ${color}`}>
                {displayRank}
            </div>
            <div className={`font-black ${color} flex flex-col items-center justify-center h-full`}>
                <span className={small ? 'text-lg' : 'text-3xl'}>{suitSymbol}</span>
            </div>
            <div className={`absolute bottom-1 right-1 leading-none ${small ? 'text-[8px]' : 'text-xs'} font-bold ${color} rotate-180`}>
                {displayRank}
            </div>
        </div>
    );
};
