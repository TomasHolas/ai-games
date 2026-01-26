import React from 'react';
import type { GameState } from '../types';

interface GameBoardProps {
    gameState: GameState | null;
    gameType?: string;
    makeHumanMove?: (move: string) => void;
    p1Model?: string;
    p2Model?: string;
}

export const GameBoard: React.FC<GameBoardProps> = ({
    gameState,
    gameType = 'tictactoe',
    makeHumanMove,
    p1Model,
    p2Model
}) => {
    const defaultSize = gameType === 'tictactoe_plus' ? 9 : 3;
    const board: string[][] = (gameState?.board as string[][]) || Array(defaultSize).fill(null).map(() => Array(defaultSize).fill(" "));
    const size = board.length;

    const isHumanTurn = gameState && !gameState.game_over &&
        ((gameState.current_symbol === 'X' && p1Model?.toLowerCase() === 'human') ||
            (gameState.current_symbol === 'O' && p2Model?.toLowerCase() === 'human'));

    const handleCellClick = (r: number, c: number) => {
        if (isHumanTurn && board[r][c].trim() === "" && makeHumanMove) {
            makeHumanMove(`${r},${c}`);
        }
    };

    // Fixed cell sizes based on board size
    const cellSize = size === 3 ? '3rem' : '1.75rem';
    const fontSize = size === 3 ? '2.5rem' : '1rem';

    return (
        <div
            className={`grid gap-2 mx-auto p-4 rounded-2xl ${isHumanTurn ? 'ring-2 ring-emerald-500/50 bg-emerald-500/5' : ''}`}
            style={{
                gridTemplateColumns: `1.5rem repeat(${size}, ${cellSize})`
            }}
        >
            {/* Top-left corner spacer */}
            <div />

            {/* Column Indices */}
            {Array.from({ length: size }).map((_, i) => (
                <div key={`col-${i}`} className="flex items-center justify-center text-[10px] font-black text-text/20 uppercase tracking-tighter">
                    {i}
                </div>
            ))}

            {/* Board Rows with Row Indices */}
            {board.map((row, r) => (
                <React.Fragment key={`row-group-${r}`}>
                    {/* Row Index */}
                    <div className="flex items-center justify-end pr-2 text-[10px] font-black text-text/20 uppercase tracking-tighter">
                        {r}
                    </div>

                    {/* Cells for this row */}
                    {row.map((cell, c) => (
                        <div
                            key={`${r}-${c}`}
                            onClick={() => handleCellClick(r, c)}
                            className={`bg-surface border ${cell === " " ? "border-gray-800" : "border-transparent"} rounded-lg flex items-center justify-center shadow-md transition-all overflow-hidden
                                ${isHumanTurn && cell === " " ? "cursor-pointer hover:bg-white/5 hover:border-gray-600 active:scale-95" : ""}
                            `}
                            style={{
                                width: cellSize,
                                height: cellSize,
                                fontSize: fontSize
                            }}
                        >
                            {cell === "X" && <span className="text-secondary font-bold font-sans leading-none">X</span>}
                            {cell === "O" && <span className="text-primary font-bold font-sans leading-none">O</span>}
                        </div>
                    ))}
                </React.Fragment>
            ))}
        </div>
    );
};
