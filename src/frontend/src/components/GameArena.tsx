import React from 'react';
import { PLAYER_COLORS } from '../config';
import { ModelIcon } from './ModelIcon';

interface GameArenaProps {
    players: {
        id: string;
        name: string;
        provider?: string;
        idx: number;
        isActive: boolean;
        isFolded?: boolean; // Poker specific
        isOut?: boolean; // Poker specific
        isDealer?: boolean; // Poker specific
        isSmallBlind?: boolean; // Poker specific
        isBigBlind?: boolean; // Poker specific
        extraContent?: React.ReactNode; // Cards, Chips, etc.
    }[];
    children: React.ReactNode; // The central game board
    fluid?: boolean;
}

export const GameArena: React.FC<GameArenaProps> = ({ players, children, fluid = false }) => {
    const totalPlayers = players.length;

    // Layout Constants
    // We use a fixed container size for the arena to ensure consistent absolute positioning
    // Unless fluid is true, in which case we might want to let CSS handle it, but for our absolute calculations
    // we need reference dimensions.
    // If fluid, we can assume a larger base or keep the logic but rely on the parent scaling.
    // Actually, "fluid" here likely means "don't restrict to 800x600", or "scale to fill".
    // Let's use the fluid prop to just affect the style width/height style.

    // For the coordinate system, we can keep the 800x600 logical coordinate system 
    // and just scale the wrapping div if needed.
    const CONTAINER_WIDTH = 800;
    const CONTAINER_HEIGHT = 600;
    const CENTER_X = CONTAINER_WIDTH / 2;
    const CENTER_Y = CONTAINER_HEIGHT / 2;
    const RADIUS_X = 350; // Horizontal radius
    const RADIUS_Y = 250; // Vertical radius

    const renderPlayer = (player: typeof players[0], index: number) => {
        // Position Logic
        let x, y;

        if (totalPlayers === 2) {
            // Head-to-Head: Left and Right (or Top/Bottom)
            // Let's do Left/Right for TTT to match the dashboard look, or stick to circle logic
            // Circle logic with 2 players -> 0 and PI -> Right and Left.
            // Let's enforce specific "seats" for 2 players for better aesthetics
            if (index === 0) { x = CENTER_X - RADIUS_X; y = CENTER_Y; } // Left
            else { x = CENTER_X + RADIUS_X; y = CENTER_Y; } // Right
        } else {
            // Circular / Elliptical for N players
            // Start from Bottom (PI/2) or specific angle?
            // PokerBoard started from PI/2. Let's distribute evenly.
            const angle = (index / totalPlayers) * 2 * Math.PI + Math.PI / 2;
            x = CENTER_X + RADIUS_X * Math.cos(angle);
            y = CENTER_Y + RADIUS_Y * Math.sin(angle);
        }

        const playerColor = PLAYER_COLORS[player.idx % PLAYER_COLORS.length];

        return (
            <div
                key={player.idx}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500
                    ${player.isOut ? 'opacity-20 grayscale' : ''}
                    ${player.isFolded ? 'opacity-50 grayscale' : ''}
                `}
                style={{ left: x, top: y }}
            >
                {/* Avatar */}
                <div className="relative group">
                    <div
                        className={`
                            w-16 h-16 rounded-full border-4 flex items-center justify-center relative bg-gray-900 shadow-xl transition-all duration-300
                            ${player.isActive ? 'scale-110 ring-4 ring-offset-2 ring-offset-black' : 'scale-100'}
                        `}
                        style={{
                            borderColor: playerColor,
                            boxShadow: player.isActive ? `0 0 20px -5px ${playerColor}` : 'none',
                            // The ring color for active state
                            ['--tw-ring-color' as any]: playerColor
                        }}
                    >
                        <ModelIcon
                            model={player.id}
                            provider={player.provider}
                            size={32}
                            className="opacity-90"
                        />

                        {player.isDealer && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-white text-black font-bold rounded-full flex items-center justify-center text-xs border-2 border-gray-400 shadow-sm z-30" title="Dealer">
                                D
                            </div>
                        )}
                        {player.isSmallBlind && (
                            <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 text-white font-bold rounded-full flex items-center justify-center text-[10px] border-2 border-blue-300 shadow-sm z-30" title="Small Blind">
                                SB
                            </div>
                        )}
                        {player.isBigBlind && (
                            <div className="absolute -top-2 -left-2 w-6 h-6 bg-purple-500 text-white font-bold rounded-full flex items-center justify-center text-[10px] border-2 border-purple-300 shadow-sm z-30" title="Big Blind">
                                BB
                            </div>
                        )}
                    </div>

                    {/* Name Label */}
                    {/* Name Label */}
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-40">
                        <div className="bg-[#1e1e1e] px-3 py-1 rounded-full border border-gray-700 text-xs font-bold shadow-xl flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: playerColor, color: playerColor }} />
                            <span className="text-gray-200 tracking-wide drop-shadow-sm">{player.name}</span>
                        </div>
                    </div>
                </div>

                {/* Extra Content (Cards, Chips, Stats) */}
                <div className="flex flex-col items-center gap-1 mt-14">
                    {player.extraContent}
                </div>
            </div>
        );
    };

    return (
        <div className="relative w-full h-full min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#1a1c23] to-[#0f1115]">
            {/* The Arena Container */}
            <div
                className="relative transition-all duration-500"
                style={{
                    width: fluid ? '100%' : CONTAINER_WIDTH,
                    height: fluid ? '100%' : CONTAINER_HEIGHT,
                    maxWidth: fluid ? 'unset' : undefined
                }}
            >
                {/* Center Game Board */}
                <div className="absolute inset-0 flex items-center justify-center z-0">
                    {children}
                </div>

                {/* Players */}
                {players.map((p, i) => renderPlayer(p, i))}
            </div>
        </div>
    );
};
